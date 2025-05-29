async function send_review() {
  const reviewText = document.getElementById("review").value.trim();
  const predictionBox = document.getElementById("prediction-box");
  const predictionSpan = document.getElementById("prediction");

  if (!reviewText) {
    alert("Please enter a review.");
    return;
  }

  // --- Determine the API Base URL ---
  let apiBaseUrlToUse;

  if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
    apiBaseUrlToUse = window.APP_CONFIG.API_BASE_URL;
  } else {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      apiUrl = "http://localhost:5000/predict";
      console.log("Using localhost fallback API URL:", apiUrl);
    } else {
      apiUrl = "http://app-service:5000/predict";
      console.log("Using 'docker network' fallback API URL:", apiUrl);
    }
  }

  // 3. Construct the full API URL
  const apiUrl = `${apiBaseUrlToUse}/predict`;

  try {
    // Show loading state
    predictionBox.style.display = "block";
    predictionSpan.textContent = "Analyzing...";

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

      // Show feedback options after getting prediction
      showFeedbackOptions();
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

// Get the selected restaurant from localStorage
const selectedRestaurant =
  localStorage.getItem("selectedRestaurant") || "Pizza Planet";

// Update the restaurant name display
document.getElementById(
  "restaurant-name-display"
).innerHTML = `🍽️ ${selectedRestaurant}`;
document.title = `${selectedRestaurant} - Sentiment Review`;

// Sample review data (in a real app, this would come from a database)
const sampleReviews = {
  "McDonald's": [
    {
      user: "User1",
      review: "Great value meals and fast service!",
      sentiment: "positive",
    },
    {
      user: "User2",
      review: "The fries were cold when I got them.",
      sentiment: "negative",
    },
  ],
  KFC: [
    {
      user: "User3",
      review: "Best fried chicken in town!",
      sentiment: "positive",
    },
    {
      user: "User4",
      review: "Too greasy and the wait was too long.",
      sentiment: "negative",
    },
  ],
  "Burger King": [
    {
      user: "User5",
      review: "The Whopper is still my favorite burger.",
      sentiment: "positive",
    },
    {
      user: "User6",
      review: "Service was slow during lunch hour.",
      sentiment: "negative",
    },
  ],
  "Wendy's": [
    {
      user: "User7",
      review: "Fresh ingredients and great salad options.",
      sentiment: "positive",
    },
    {
      user: "User8",
      review: "The restaurant was not clean.",
      sentiment: "negative",
    },
  ],
  "Pizza Planet": [
    {user: "User1", review: "This place is amazing!", sentiment: "positive"},
    {user: "User2", review: "Worst restaurant in town!", sentiment: "negative"},
  ],
};

// Load sample reviews for the selected restaurant

function loadReviews() {
  const reviews = sampleReviews[selectedRestaurant] || [];
  const container = document.getElementById("reviews-container");

  container.innerHTML = "";

  reviews.forEach((item, index) => {
    const emoji = item.sentiment === "positive" ? "😄" : "☹️";
    const reviewCard = document.createElement("div");
    reviewCard.className = "review-card";
    reviewCard.innerHTML = `<p><strong>User${index + 1}:</strong> ${emoji} ${
      item.review
    }</p>`;
    container.appendChild(reviewCard);
  });
}

// Load reviews when the page loads
window.onload = loadReviews;

// Function to show feedback options after prediction
function showFeedbackOptions() {
  // Check if feedback options already exist, create if they don't
  let feedbackDiv = document.getElementById("feedback-options");

  if (!feedbackDiv) {
    // Create feedback options container
    feedbackDiv = document.createElement("div");
    feedbackDiv.id = "feedback-options";
    feedbackDiv.className = "feedback-options";

    // Create question text
    const questionPara = document.createElement("p");
    questionPara.textContent = "Is this prediction correct?";

    // Create yes button
    const yesButton = document.createElement("button");
    yesButton.className = "feedback-btn";
    yesButton.textContent = "Yes ✓";
    yesButton.onclick = function () {
      provideFeedback(true);
    };

    // Create no button
    const noButton = document.createElement("button");
    noButton.className = "feedback-btn";
    noButton.textContent = "No ✗";
    noButton.onclick = function () {
      provideFeedback(false);
    };

    // Add all elements to the feedback div
    feedbackDiv.appendChild(questionPara);
    feedbackDiv.appendChild(yesButton);
    feedbackDiv.appendChild(noButton);

    // Add feedback div to the prediction box
    document.getElementById("prediction-box").appendChild(feedbackDiv);
  } else {
    // If it already exists, just make it visible
    feedbackDiv.style.display = "block";
  }

  // Hide any previous feedback response
  const feedbackResponse = document.getElementById("feedback-response");
  if (feedbackResponse) {
    feedbackResponse.style.display = "none";
  }
}

// Handle user feedback on prediction
function provideFeedback(isCorrect) {
  // Create or get the feedback response element
  let feedbackResponse = document.getElementById("feedback-response");

  if (!feedbackResponse) {
    feedbackResponse = document.createElement("div");
    feedbackResponse.id = "feedback-response";
    document.getElementById("prediction-box").appendChild(feedbackResponse);
  }

  const reviewText = document.getElementById("review").value.trim();
  const sentiment = document.getElementById("prediction").textContent;

  if (isCorrect) {
    feedbackResponse.innerHTML =
      '<p class="feedback-correct">Thank you for confirming! Your feedback helps improve our system.</p>';

    // Add the review to the list of reviews
    addReviewToList(reviewText, sentiment === "Positive");
  } else {
    feedbackResponse.innerHTML =
      '<p class="feedback-incorrect">Thanks for letting us know! We\'ll use this feedback to improve our predictions.</p>';

    // In a real system, you would log this misclassification for model improvement
  }

  feedbackResponse.style.display = "block";

  // Hide the feedback options
  document.getElementById("feedback-options").style.display = "none";

  // Clear the review input after some time
  setTimeout(() => {
    document.getElementById("review").value = "";
  }, 1500);
}

// Add a new review to the list of previous reviews
function addReviewToList(reviewText, isPositive) {
  const reviewsContainer = document.getElementById("reviews-container");
  if (!reviewsContainer) return; // Exit if container doesn't exist

  const emoji = isPositive ? "😄" : "☹️";

  // Create new review element
  const reviewCard = document.createElement("div");
  reviewCard.className = "review-card";
  reviewCard.innerHTML = `<p><strong>You:</strong> ${emoji} ${reviewText}</p>`;

  // Add it to the top of the list
  if (reviewsContainer.firstChild) {
    reviewsContainer.insertBefore(reviewCard, reviewsContainer.firstChild);
  } else {
    reviewsContainer.appendChild(reviewCard);
  }
}

// Function to go back to restaurant selection
function goBack() {
  window.location.href = "index.html";
}
