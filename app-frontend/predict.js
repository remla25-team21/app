async function send_review() {
  const reviewText = document.getElementById("review").value.trim();
  const predictionBox = document.getElementById("prediction-box");
  const predictionSpan = document.getElementById("prediction");

  if (!reviewText) {
    alert("Please enter a review.");
    return;
  }

  const requestBody = {
    data: reviewText,
  };

  try {
    // Use relative URL or determine API URL based on current hostname
    // This works in both development and production environments
    const apiUrl =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/predict" // For local development
        : "http://app-service:5000/predict"; // For docker network

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log(result.prediction);

    if (response.ok && (result.prediction === 0 || result.prediction === 1)) {
      const sentiment = result.prediction;
      predictionSpan.textContent = sentiment === 1 ? "Positive" : "Negative";

      // Style prediction result
      predictionBox.style.display = "block";
      if (sentiment === 1) {
        predictionBox.className = "prediction-box prediction-positive";
        predictionSpan.style.color = "#28a745"; // Green for positive
      } else if (sentiment === 0) {
        predictionBox.className = "prediction-box prediction-negative";
        predictionSpan.style.color = "#dc3545"; // Red for negative
      } else {
        predictionBox.className = "prediction-box"; // Default style if result is not 0 or 1
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
