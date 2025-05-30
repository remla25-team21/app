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
  let frontendVersion = "v1"; // Default if not found

  console.log("window app config", window.APP_CONFIG);

  if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
    apiBaseUrlToUse = window.APP_CONFIG.API_BASE_URL;
  } else {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      apiBaseUrlToUse = "http://localhost:5000/predict";
      console.log("Using localhost fallback API URL:", apiBaseUrlToUse);
    } else {
      apiBaseUrlToUse = "http://app-service:5000/predict";
      console.log("Using 'docker network' fallback API URL:", apiBaseUrlToUse);
    }
  }

  if (window.APP_CONFIG && window.APP_CONFIG.FRONTEND_VERSION) {
    frontendVersion = window.APP_CONFIG.FRONTEND_VERSION;
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
        "x-app-version": frontendVersion,
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

      // Show star rating after prediction
      showStarRating();

      addReviewToList(reviewText, sentiment === "Positive");
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

// Function to show star rating options after prediction
function showStarRating() {
  // Check if star rating already exists, create if not
  let starContainer = document.getElementById("star-rating-container");

  if (!starContainer) {
    // Create star rating container
    starContainer = document.createElement("div");
    starContainer.id = "star-rating-container";
    starContainer.className = "star-rating";

    // Create instruction
    const instruction = document.createElement("p");
    instruction.textContent = "Rate your experience:";
    starContainer.appendChild(instruction);

    // Create star container
    const starsDiv = document.createElement("div");
    starsDiv.className = "stars";

    // Create 5 stars (from left to right: 1 to 5)
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.className = "star fa fa-star";
      star.dataset.rating = i;
      // Add hover effects for better user experience
      star.addEventListener("mouseenter", () => highlightStars(i));
      star.addEventListener("mouseleave", () => highlightStars(satisfactionRating));
      star.addEventListener("click", () => setRating(i));
      starsDiv.appendChild(star);
    }

    starContainer.appendChild(starsDiv);
    document.getElementById("prediction-box").appendChild(starContainer);
  } else {
    starContainer.style.display = "block";
  }
}

// Helper function to highlight stars (for hover and selection)
function highlightStars(rating) {
  const stars = document.querySelectorAll(".star");
  stars.forEach((star, index) => {
    // Clear all classes first
    star.classList.remove("selected", "hover");

    // Add appropriate class based on rating
    // index + 1 because arrays are 0-based but ratings are 1-based
    if (index + 1 <= rating) {
      if (rating === satisfactionRating) {
        star.classList.add("selected");
      } else {
        star.classList.add("hover");
      }
    }
  });
}

// Set user rating (fixed version)
function setRating(rating) {
  // Store the rating
  satisfactionRating = rating;

  // Debug: Log the rating to console so you can see what was selected
  console.log(`User selected rating: ${rating} stars`);

  // Highlight the selected stars
  highlightStars(rating);

  // Show thank you message after a brief delay
  setTimeout(() => {
    const starContainer = document.getElementById("star-rating-container");
    if (starContainer) {
      // Show both the rating and thank you message
      starContainer.innerHTML = `
        <p class="feedback-thanks">
          Thank you for your ${rating}-star rating! 
          <span style="color: #ffc107;">★</span>
        </p>
      `;

      setTimeout(() => {
        starContainer.style.display = "none";
        // Clear the review input
        document.getElementById("review").value = "";

        // Reset satisfaction rating for next review
        satisfactionRating = 0;
      }, 2500); // Increased time so user can see their rating
    }
  }, 800);
}

// Alternative function if you want to see the rating immediately without hiding
function setRatingWithDisplay(rating) {
  satisfactionRating = rating;
  console.log(`User selected rating: ${rating} stars`);

  // Update visual feedback
  highlightStars(rating);

  // Show current rating below stars
  let ratingDisplay = document.getElementById("current-rating-display");
  if (!ratingDisplay) {
    ratingDisplay = document.createElement("p");
    ratingDisplay.id = "current-rating-display";
    ratingDisplay.style.marginTop = "10px";
    ratingDisplay.style.fontWeight = "bold";
    document.getElementById("star-rating-container").appendChild(ratingDisplay);
  }

  ratingDisplay.innerHTML = `Your rating: ${rating} star${rating !== 1 ? 's' : ''} <span style="color: #ffc107;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>`;
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
