async function send_review() {
    const reviewText = document.getElementById("review").value.trim();
    const predictionBox = document.getElementById("prediction-box");
    const predictionSpan = document.getElementById("prediction");

    if (!reviewText) {
        alert("Please enter a review.");
        return;
    }

    const requestBody = {
        data: reviewText
    };

    try {
        const response = await fetch("http://backend:5000/predict", {  // the name of the backend service defined in docker-compose.yml
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (response.ok && result.prediction) {
            const sentiment = result.prediction.toLowerCase();
            predictionSpan.textContent = sentiment;

            // Style prediction result
            predictionBox.style.display = "block";
            if (sentiment.includes("positive")) {
                predictionBox.className = "prediction-box prediction-positive";
            } else if (sentiment.includes("negative")) {
                predictionBox.className = "prediction-box prediction-negative";
                predictionSpan.style.color = "#dc3545";
            } else {
                predictionBox.className = "prediction-box";
            }
        } else {
            throw new Error(result.error || "Unknown prediction error");
        }
    } catch (error) {
        predictionBox.style.display = "block";
        predictionBox.className = "prediction-box prediction-negative";
        predictionSpan.style.color = "#dc3545";
        predictionSpan.textContent = "Error: " + error.message;
    }
}
