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
        // Use relative URL or determine API URL based on current hostname
        // This works in both development and production environments
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:5000/predict'  // For local development
            : '/api/predict';  // For production (assuming API is properly proxied)

        const response = await fetch(apiUrl, {
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
