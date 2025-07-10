  window.addEventListener('DOMContentLoaded', (event) => {
    new PagefindUI({
      element: "#search-container", // Make sure this matches the div ID
      showSubResults: true,
      showImages: false, // Set to true if you want images in search results
      autofocus: false, // Set to true if you want the search input to be focused on page load
      placeholder: 'Search site...' // Custom placeholder text
    });
  });

// /path/to/your/custom-search-toggle.js
window.addEventListener('DOMContentLoaded', () => {
  const searchToggle = document.getElementById('search-toggle');
  const searchContainer = document.getElementById('search-container');

  if (searchToggle && searchContainer) {
    searchToggle.addEventListener('click', () => {
      // Toggle the 'collapsed' class on the search container
      searchContainer.classList.toggle('collapsed');

      // Optional: Adjust button's aria-expanded attribute for accessibility
      const isExpanded = !searchContainer.classList.contains('collapsed');
      searchToggle.setAttribute('aria-expanded', isExpanded);

      // Optional: Autofocus the search input when it expands
      if (isExpanded) {
        // Pagefind might take a moment to render its input, so a small delay helps
        setTimeout(() => {
          const pagefindInput = searchContainer.querySelector('.pagefind-ui__search-input');
          if (pagefindInput) {
            pagefindInput.focus();
          }
        }, 100); // Small delay
      }
    });

    // Optional: Close search if user clicks outside of the search area
    document.addEventListener('click', (event) => {
      const isClickInsideWrapper = searchContainer.contains(event.target) || searchToggle.contains(event.target);
      const isSearchExpanded = !searchContainer.classList.contains('collapsed');

      if (!isClickInsideWrapper && isSearchExpanded) {
        searchContainer.classList.add('collapsed');
        searchToggle.setAttribute('aria-expanded', false);
      }
    });

    // Initial state for accessibility
    searchToggle.setAttribute('aria-expanded', false); // Start collapsed
  }
});