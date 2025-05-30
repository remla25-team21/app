// Global variable to track current review context for star rating
let currentReviewContext = null;
// Track the current rating for UI highlighting
let satisfactionRating = 0;

// Common function to update version display
function updateVersionDisplay() {
  const versionDisplay = document.getElementById('version-display');
  if (!versionDisplay) return;

  let frontendVersion = "1"; // Default version number
  if (window.APP_CONFIG && window.APP_CONFIG.FRONTEND_VERSION) {
    frontendVersion = window.APP_CONFIG.FRONTEND_VERSION.toString();

    // Remove any existing 'v' prefix from the version
    frontendVersion = frontendVersion.replace(/^v/i, '');
  }

  versionDisplay.textContent = `v${frontendVersion}`;
}

// Update version display on page load
window.addEventListener('DOMContentLoaded', () => {
  updateVersionDisplay();

  // Review page specific setup
  if (document.getElementById('reviews-container')) {
    // Get the selected restaurant from localStorage
    const selectedRestaurant = localStorage.getItem("selectedRestaurant") || "Pizza Planet";

    // Update the restaurant name display
    document.getElementById("restaurant-name-display").innerHTML = `🍽️ ${selectedRestaurant}`;
    document.title = `${selectedRestaurant} - Sentiment Review`;

    // Load sample reviews
    loadReviews(selectedRestaurant);
  }
});

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

  // --- Determine the API Base URL ---
  let apiBaseUrlToUse;
  let frontendVersion = "1"; // Default version number

  if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
    apiBaseUrlToUse = window.APP_CONFIG.API_BASE_URL;
  } else {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      apiBaseUrlToUse = "http://localhost:5000";
      console.log("Using localhost fallback API URL:", apiBaseUrlToUse);
    } else {
      apiBaseUrlToUse = "http://app-service:5000";
      console.log("Using 'docker network' fallback API URL:", apiBaseUrlToUse);
    }
  }

  if (window.APP_CONFIG && window.APP_CONFIG.FRONTEND_VERSION) {
    frontendVersion = window.APP_CONFIG.FRONTEND_VERSION.toString();
    // Remove any existing 'v' prefix
    frontendVersion = frontendVersion.replace(/^v/i, '');
  }

  // Construct the full API URL
  const apiUrl = `${apiBaseUrlToUse}/predict`;

  try {
    // Show loading state
    predictionBox.style.display = "block";
    predictionSpan.textContent = "Analyzing...";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "app-version": `v${frontendVersion}`,
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
        predictionSpan.style.color = "#28a745";
      } else if (sentiment === 0) {
        predictionBox.className = "prediction-box prediction-negative";
        predictionSpan.style.color = "#dc3545";
      } else {
        predictionBox.className = "prediction-box";
      }

      // Show star rating after prediction
      showStarRating();

      addReviewToList(reviewText, sentiment === 1);

      // Store the current review context for rating submission
      const selectedRestaurant = localStorage.getItem("selectedRestaurant") || "Pizza Planet";
      currentReviewContext = {
        text: reviewText,
        sentiment: sentiment === 1 ? "positive" : "negative",
        restaurant: selectedRestaurant
      };
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

// Sample review data
const sampleReviews = {
  "McDonald's": [
    { user: "User1", review: "Great value meals and fast service!", sentiment: "positive" },
    { user: "User2", review: "The fries were cold when I got them.", sentiment: "negative" },
  ],
  KFC: [
    { user: "User3", review: "Best fried chicken in town!", sentiment: "positive" },
    { user: "User4", review: "Too greasy and the wait was too long.", sentiment: "negative" },
  ],
  "Burger King": [
    { user: "User5", review: "The Whopper is still my favorite burger.", sentiment: "positive" },
    { user: "User6", review: "Service was slow during lunch hour.", sentiment: "negative" },
  ],
  "Wendy's": [
    { user: "User7", review: "Fresh ingredients and great salad options.", sentiment: "positive" },
    { user: "User8", review: "The restaurant was not clean.", sentiment: "negative" },
  ],
  "Pizza Planet": [
    { user: "User1", review: "This place is amazing!", sentiment: "positive" },
    { user: "User2", review: "Worst restaurant in town!", sentiment: "negative" },
  ],
};

// Load sample reviews for the selected restaurant
function loadReviews(selectedRestaurant) {
  const reviews = sampleReviews[selectedRestaurant] || [];
  const container = document.getElementById("reviews-container");
  if (!container) return;

  container.innerHTML = "";

  reviews.forEach((item, index) => {
    const emoji = item.sentiment === "positive" ? "😄" : "☹️";
    const reviewCard = document.createElement("div");
    reviewCard.className = "review-card";
    reviewCard.innerHTML = `<p><strong>User${index + 1}:</strong> ${emoji} ${item.review}</p>`;
    container.appendChild(reviewCard);
  });
}

// Function to show star rating options after prediction
function showStarRating() {
  let starContainer = document.getElementById("star-rating-container");

  if (!starContainer) {
    starContainer = document.createElement("div");
    starContainer.id = "star-rating-container";
    starContainer.className = "star-rating";

    const instruction = document.createElement("p");
    instruction.textContent = "Rate your experience:";
    starContainer.appendChild(instruction);

    const starsDiv = document.createElement("div");
    starsDiv.className = "stars";

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.className = "star fa fa-star";
      star.dataset.rating = i;
      star.addEventListener("mouseenter", () => highlightStars(i));
      star.addEventListener("mouseleave", () => highlightStars(satisfactionRating));
      star.addEventListener("click", () => setRating(i));
      starsDiv.appendChild(star);
    }

    starContainer.appendChild(starsDiv);

    const statusMsg = document.createElement("p");
    statusMsg.id = "rating-status";
    statusMsg.style.marginTop = "5px";
    statusMsg.style.fontSize = "0.9em";
    statusMsg.style.minHeight = "20px";
    starContainer.appendChild(statusMsg);

    document.getElementById("prediction-box").appendChild(starContainer);
  } else {
    starContainer.style.display = "block";
  }
}

// Helper function to highlight stars
function highlightStars(rating) {
  const stars = document.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.classList.remove("selected", "hover");
    if (index + 1 <= rating) {
      if (rating === satisfactionRating) {
        star.classList.add("selected");
      } else {
        star.classList.add("hover");
      }
    }
  });
}

// Set user rating and submit to backend
function setRating(rating) {
  satisfactionRating = rating;
  highlightStars(rating);

  const statusMsg = document.getElementById("rating-status");
  if (statusMsg) {
    statusMsg.textContent = "Submitting rating...";
    statusMsg.style.color = "#6c757d";
  }

  submitRating(rating)
    .then(() => {
      if (statusMsg) {
        statusMsg.textContent = "Rating submitted successfully!";
        statusMsg.style.color = "#28a745";
      }

      setTimeout(() => {
        const starContainer = document.getElementById("star-rating-container");
        if (starContainer) starContainer.style.display = "none";
        document.getElementById("review").value = "";
        currentReviewContext = null;
        satisfactionRating = 0;
      }, 2000);
    })
    .catch(error => {
      if (statusMsg) {
        statusMsg.textContent = "Failed to submit rating. Please try again.";
        statusMsg.style.color = "#dc3545";
      }
      console.error("Rating submission error:", error);
    });
}

// Function to submit the rating to the backend
async function submitRating(ratingValue) {
  if (!currentReviewContext) {
    throw new Error("No review context available for rating");
  }

  let apiBaseUrlToUse;
  let frontendVersion = "1";

  if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
    apiBaseUrlToUse = window.APP_CONFIG.API_BASE_URL;
  } else {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      apiBaseUrlToUse = "http://localhost:5000";
    } else {
      apiBaseUrlToUse = "http://app-service:5000";
    }
  }

  if (window.APP_CONFIG && window.APP_CONFIG.FRONTEND_VERSION) {
    frontendVersion = window.APP_CONFIG.FRONTEND_VERSION.toString().replace(/^v/i, '');
  }

  const payload = {
    review_text: currentReviewContext.text,
    rating: ratingValue,
    sentiment: currentReviewContext.sentiment,
    restaurant: currentReviewContext.restaurant
  };

  const response = await fetch(`${apiBaseUrlToUse}/submit-rating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "app-version": `v${frontendVersion}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

// Add a new review to the list of previous reviews
function addReviewToList(reviewText, isPositive) {
  const reviewsContainer = document.getElementById("reviews-container");
  if (!reviewsContainer) return;

  const emoji = isPositive ? "😄" : "☹️";
  const reviewCard = document.createElement("div");
  reviewCard.className = "review-card";
  reviewCard.innerHTML = `<p><strong>You:</strong> ${emoji} ${reviewText}</p>`;

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