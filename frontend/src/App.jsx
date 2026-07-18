import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Page States
  const [preloaderActive, setPreloaderActive] = useState(true);
  const [preloaderFade, setPreloaderFade] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Q&A Workspace States
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Preloader timeout (2.2 seconds)
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setPreloaderFade(true);
      const closeTimer = setTimeout(() => {
        setPreloaderActive(false);
      }, 600); // matches CSS transitions
      return () => clearTimeout(closeTimer);
    }, 2200);

    return () => clearTimeout(fadeTimer);
  }, []);

  // Sticky header class trigger on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simple Scroll-triggered Reveal Observer
  useEffect(() => {
    if (preloaderActive) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-up-active');
          }
        });
      },
      { threshold: 0.1 }
    );

    const targetElements = document.querySelectorAll('.fade-up-init');
    targetElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [preloaderActive]);

  // Smooth Scroll Helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // File Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const pdfs = newFiles.filter(file => file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) {
      setErrorMessage("Please select valid PDF files.");
      return;
    }
    setErrorMessage("");
    setFiles(prev => {
      const filtered = pdfs.filter(newFile => 
        !prev.some(existing => existing.name === newFile.name && existing.size === newFile.size)
      );
      return [...prev, ...filtered];
    });
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Submit and Ask Question
  const handleAsk = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setErrorMessage("Please upload at least one PDF document.");
      return;
    }
    if (!question.trim()) {
      setErrorMessage("Please enter a question.");
      return;
    }

    setErrorMessage("");
    setAnswer("");
    setIsProcessing(true);
    setStatusMessage("Uploading and processing PDFs...");

    const formData = new FormData();
    files.forEach(file => {
      formData.append("pdfs", file);
    });
    formData.append("question", question);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      setStatusMessage("Reading response stream...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        let textChunk = "";

        for (let line of lines) {
          if (line.startsWith("[System: ") && line.endsWith("]")) {
            const statusText = line.substring(9, line.length - 1);
            setStatusMessage(statusText);
          } else {
            textChunk += line + '\n';
          }
        }

        if (!chunk.endsWith('\n') && textChunk.endsWith('\n')) {
          textChunk = textChunk.slice(0, -1);
        }

        setAnswer(prev => prev + textChunk);
      }

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to process RAG request. Please check the backend connection.");
    } finally {
      setIsProcessing(false);
      setStatusMessage("");
    }
  };

  // Preloader Letter Animation Helper
  const preloaderTitle = "RAG Knowledge Assistant";

  return (
    <>
      {/* 1. ANIMATED PRELOADER */}
      {preloaderActive && (
        <div className={`preloader ${preloaderFade ? 'fade-out' : ''}`}>
          <div className="preloader-content">
            <div className="scan-doc-container">
              <div className="scan-lines">
                <div className="scan-line-item"></div>
                <div className="scan-line-item"></div>
                <div className="scan-line-item"></div>
                <div className="scan-line-item"></div>
              </div>
              <div className="scanner-laser"></div>
            </div>
            <h2 className="preloader-title">
              {preloaderTitle.split('').map((char, index) => (
                <span key={index} style={{ animationDelay: `${index * 0.04}s` }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h2>
            <div className="preloader-progress-track">
              <div className="preloader-progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SINGLE PAGE WEBSITE */}
      <div style={{ opacity: preloaderActive ? 0 : 1, transition: 'opacity 0.5s ease' }}>
        
        {/* Header */}
        <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
          <div className="header-container">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="brand">
              <span className="brand-icon">⚡</span>
              <span className="brand-name">RAG Assistant</span>
            </a>
            <nav className="nav-links">
              <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="nav-item">Features</a>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }} className="nav-item">How It Works</a>
              <a href="#workspace" onClick={(e) => { e.preventDefault(); scrollToSection('workspace'); }} className="nav-item">Workspace</a>
            </nav>
            <div className="header-ctas">
              <a 
                href="https://github.com/JayPatel171143/rag-knowledge-assistant" 
                target="_blank" 
                rel="noreferrer" 
                className="btn-outline-github"
              >
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                GitHub
              </a>
              <button onClick={() => scrollToSection('workspace')} className="btn-launch-app">
                Open Workspace
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="hero">
          <div className="hero-content fade-up-init fade-up-active">
            <div className="hero-badge">
              <span>Free & Self-Hosted</span>
            </div>
            <h2 className="hero-headline">
              Turn your PDF documents into <span>instant answers</span>.
            </h2>
            <p className="hero-subheadline">
              Upload business reports, textbooks, or research papers and query them instantly. A high-performance local RAG workspace powered by FastAPI, ChromaDB, and Groq.
            </p>
            <div className="hero-ctas">
              <button onClick={() => scrollToSection('workspace')} className="btn-launch-app" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                Go to Workspace
              </button>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }} className="btn-outline-github" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                How It Works
              </a>
            </div>
          </div>
          
          <div className="hero-visual">
            {/* Custom SVG Document-Processing Animation Mockup */}
            <svg className="hero-svg-mockup" viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 40H360V280H40V40Z" fill="#FBFBFE" />
              <path d="M40 80H360" stroke="#F1F1F7" strokeWidth="1.5" />
              <path d="M40 160H360" stroke="#F1F1F7" strokeWidth="1.5" />
              <path d="M40 240H360" stroke="#F1F1F7" strokeWidth="1.5" />
              
              {/* Document Node */}
              <rect className="svg-doc-rect" x="60" y="100" width="80" height="110" rx="6" fill="#F8F9FD" stroke="#000000" strokeWidth="2.5" />
              <line x1="75" y1="125" x2="125" y2="125" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="75" y1="140" x2="125" y2="140" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="75" y1="155" x2="110" y2="155" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="120" cy="180" r="10" fill="#000000" fillOpacity="0.05" />
              <circle cx="120" cy="180" r="4" fill="#000000" />

              {/* Vector Flow Connector */}
              <path d="M150 150 C 200 120, 220 180, 255 150" stroke="#000000" strokeWidth="2.5" strokeDasharray="5 5" />
              
              {/* Embeddings/Database Node */}
              <rect x="260" y="105" width="80" height="100" rx="8" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              <rect x="275" y="125" width="50" height="16" rx="3" fill="#F3F4F6" stroke="#000000" strokeWidth="1.5" />
              <rect x="275" y="147" width="50" height="16" rx="3" fill="#F3F4F6" stroke="#000000" strokeWidth="1.5" />
              <rect x="275" y="169" width="50" height="16" rx="3" fill="#000000" />
              
              {/* Status indicator */}
              <rect x="150" y="240" width="100" height="30" rx="15" fill="#F3F4F6" />
              <text x="200" y="259" fill="#000000" fontSize="10" fontWeight="700" textAnchor="middle">VECTORIZED</text>
            </svg>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="section-wrapper">
          <div className="section-container">
            <div className="section-header fade-up-init">
              <h3 className="section-title">Designed for Fast Local Research</h3>
              <p className="section-subtitle">
                Built on a robust python stack with state-of-the-art open source tooling.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card fade-up-init">
                <div className="feature-icon-wrapper">🔍</div>
                <h4 className="feature-title">Fast Semantic Search</h4>
                <p className="feature-description">
                  Extracts document contexts using sentence-transformers embeddings stored securely in a local in-memory ChromaDB database.
                </p>
              </div>
              
              <div className="feature-card fade-up-init">
                <div className="feature-icon-wrapper">⚡</div>
                <h4 className="feature-title">High-Speed Generation</h4>
                <p className="feature-description">
                  Answers are streamed token-by-token in real-time, utilizing Groq's high-speed Llama 3.3 serverless architecture.
                </p>
              </div>
              
              <div className="feature-card fade-up-init">
                <div className="feature-icon-wrapper">🔒</div>
                <h4 className="feature-title">100% Private & Clean</h4>
                <p className="feature-description">
                  Data stays in memory and temporary file buffers. Minimal libraries ensure easy auditability and direct hosting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="how-it-works">
          <div className="section-container">
            <div className="section-header fade-up-init">
              <h3 className="section-title">Seamless Workflow</h3>
              <p className="section-subtitle">From document to precise response in seconds.</p>
            </div>

            <div className="steps-timeline">
              <div className="step-item fade-up-init">
                <div className="step-number">1</div>
                <h4 className="step-title">Upload Documents</h4>
                <p className="step-desc">Drag and drop your PDF resources right into the interface.</p>
              </div>
              
              <div className="step-item fade-up-init">
                <div className="step-number">2</div>
                <h4 className="step-title">Vector Indexing</h4>
                <p className="step-desc">The assistant extracts textual content, splits it into dense chunks, and indexes it.</p>
              </div>
              
              <div className="step-item fade-up-init">
                <div className="step-number">3</div>
                <h4 className="step-title">Ask & Converse</h4>
                <p className="step-desc">Ask queries and get immediate streaming answers backed directly by references.</p>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE WORKSPACE SECTION */}
        <section id="workspace" className="workspace-section">
          <div className="section-container">
            <div className="section-header fade-up-init">
              <h3 className="section-title">Interactive Workspace</h3>
              <p className="section-subtitle">Upload multiple PDF files and query them simultaneously.</p>
            </div>

            <main className="workspace-main">
              {/* Document Input Panel */}
              <div className="dashboard-panel">
                <label className="light-input-label">Document Sources</label>
                <div 
                  className={`light-dropzone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple 
                    accept=".pdf"
                    style={{ display: 'none' }}
                  />
                  <span className="light-upload-icon">📥</span>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>
                    <strong>Drag & drop PDFs</strong> or click to browse
                  </p>
                  <p className="light-dropzone-hint" style={{ margin: 0 }}>
                    Upload one or more PDF files
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="light-file-list">
                    {files.map((file, idx) => (
                      <div key={idx} className="light-file-item">
                        <div className="light-file-info">
                          <span className="light-pdf-badge">PDF</span>
                          <span className="light-file-name">{file.name}</span>
                          <span className="light-file-size">({formatBytes(file.size)})</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            padding: '0 4px'
                          }}
                          title="Remove file"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Input Panel */}
              <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="question-input" className="light-input-label">Query Assistant</label>
                  <input 
                    id="question-input"
                    type="text" 
                    className="light-text-input" 
                    placeholder="Ask a question comparing or combining details from your uploaded documents..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isProcessing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAsk(e);
                    }}
                  />
                </div>

                {errorMessage && (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn-launch-app" 
                    onClick={handleAsk}
                    disabled={isProcessing || files.length === 0 || !question.trim()}
                    style={{
                      opacity: (isProcessing || files.length === 0 || !question.trim()) ? 0.6 : 1,
                      cursor: (isProcessing || files.length === 0 || !question.trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Ask AI'}
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              {isProcessing && statusMessage && (
                <div className="light-status-box">
                  <div className="light-spinner"></div>
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Answer Output Panel */}
              {(answer || isProcessing) && (
                <div className="light-answer-box">
                  <div className="light-answer-header">
                    <span>Assistant Response</span>
                    <span className="light-answer-badge">
                      {isProcessing ? 'Generating...' : 'Complete'}
                    </span>
                  </div>
                  <pre className="light-answer-content">
                    {answer}
                    {isProcessing && <span className="light-cursor"></span>}
                  </pre>
                </div>
              )}
            </main>
          </div>
        </section>

        {/* Tech Stack Strip */}
        <section id="tech-stack" className="tech-strip-wrapper">
          <div className="tech-strip">
            <div className="tech-badge">
              <span className="tech-logo-dot"></span> FastAPI
            </div>
            <div className="tech-badge">
              <span className="tech-logo-dot"></span> LangChain
            </div>
            <div className="tech-badge">
              <span className="tech-logo-dot"></span> ChromaDB
            </div>
            <div className="tech-badge">
              <span className="tech-logo-dot"></span> Groq Llama 3
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-left">
              <h4 className="footer-brand">RAG Knowledge Assistant</h4>
              <p className="footer-copyright">
                &copy; 2026 RAG Knowledge Assistant. Designed & developed by Jay Patel.
              </p>
            </div>
            <div className="footer-right">
              <h5 className="footer-links-title">Connect</h5>
              <div className="footer-links">
                <a href="https://github.com/JayPatel171143" target="_blank" rel="noreferrer" className="footer-link-item">GitHub</a>
                <a href="https://shorturl.at/WUQm5" target="_blank" rel="noreferrer" className="footer-link-item">LinkedIn</a>
                <a href="mailto:jaynp17@gmail.com" className="footer-link-item">Email</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

export default App;
