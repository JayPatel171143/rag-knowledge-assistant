const askBtn = document.getElementById("askBtn");

askBtn.addEventListener("click", async () => {

    const pdfFile = document.getElementById("pdfFile").files[0];
    const question = document.getElementById("question").value;

    const loading = document.getElementById("loading");
    const answerDiv = document.getElementById("answer");

    if (!pdfFile || !question) {
        alert("Please upload PDF and ask a question.");
        return;
    }

    loading.classList.remove("hidden");

    answerDiv.innerHTML = "";

    const formData = new FormData();

    formData.append("pdf", pdfFile);
    formData.append("question", question);

    try {

        const response = await fetch("/ask", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        answerDiv.innerHTML = data.answer;

    } catch (error) {

        answerDiv.innerHTML = "Error processing request.";

        console.error(error);

    }

    loading.classList.add("hidden");

});