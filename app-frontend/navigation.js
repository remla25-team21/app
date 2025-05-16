function selectRestaurant(restaurantName) {
    // Store the selected restaurant name
    localStorage.setItem('selectedRestaurant', restaurantName);

    // Redirect to the review page
    window.location.href = 'review.html';
}