const askBtn = document.getElementById("askBtn");

askBtn.addEventListener("click", async () => {

    const pdfFiles = document.getElementById("pdfFile").files;

    const question = document.getElementById("question").value;

    const answerDiv = document.getElementById("answer");

    // -------- VALIDATION --------

    if (pdfFiles.length === 0 || !question) {

        alert("Please upload PDFs and ask a question.");

        return;
    }

    // -------- RESET ANSWER --------

    answerDiv.innerHTML = "Thinking...\n\n";

    // -------- FORM DATA --------

    const formData = new FormData();

    // -------- ADD MULTIPLE PDFs --------

    for (let file of pdfFiles) {

        formData.append("pdfs", file);

    }

    formData.append("question", question);

    try {

        // -------- SEND REQUEST --------

        const response = await fetch("/ask", {

            method: "POST",

            body: formData

        });

        // -------- STREAM READER --------

        const reader = response.body.getReader();

        const decoder = new TextDecoder();

        // -------- CLEAR THINKING TEXT --------

        answerDiv.innerHTML = "";

        // -------- STREAM LOOP --------

        while (true) {

            const { done, value } = await reader.read();

            if (done) break;

            // -------- DECODE CHUNK --------

            const chunk = decoder.decode(value, { stream: true });

            // -------- APPEND TEXT --------

            answerDiv.innerHTML += chunk;
        }

    } catch (error) {

        console.error(error);

        answerDiv.innerHTML = "Error processing request.";
    }

});