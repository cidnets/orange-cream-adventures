console.log("hello, world!");

$(document).ready(function() {
  $('.hamburger').click(function() {
    $('.nav-links').toggleClass('active');
  });
});

// Random Border Images
document.addEventListener('DOMContentLoaded', function() {
  const postGrids = document.querySelectorAll('.posts-grid');

  const borderStyles = [
{ url: 'url("https://cdn.glitch.global/17b0a683-376a-4c07-9955-5053391d0c1b/Border-orange-3.png?v=1745585352749")', backgroundColor: '#ffc97d' },
  { url: 'url("https://cdn.glitch.global/17b0a683-376a-4c07-9955-5053391d0c1b/Border-peach.png?v=1745480097660")', backgroundColor: '#ffd5bd' },
  { url: 'url("https://cdn.glitch.global/17b0a683-376a-4c07-9955-5053391d0c1b/Border-pink.png?v=1745480099740")', backgroundColor: '#ffd1de' },
  { url: 'url("https://cdn.glitch.global/17b0a683-376a-4c07-9955-5053391d0c1b/Border-lpurple.png?v=1745572353207")', backgroundColor: '#faceff' },
  { url: 'url("https://cdn.glitch.global/17b0a683-376a-4c07-9955-5053391d0c1b/Border-yellow.png?v=1745480104838")', backgroundColor: '#fff6bd' },
  { url: 'url("https://cdn.glitch.global/17b0a683-376a-4c07-9955-5053391d0c1b/Border-base.png?v=1745480120938")', backgroundColor: '#ffffff' },
    // Add as many unique image/color pairs as you like!
  ];

  postGrids.forEach(grid => {
    const listItems = grid.querySelectorAll('li a');
    let usedColors = []; // Keep track of colors used in this grid

    listItems.forEach(listItem => {
      if (borderStyles.length > 0) {
        let randomIndex;
        let randomStyle;

        // Keep picking a random style until we find one with an unused color
        do {
          randomIndex = Math.floor(Math.random() * borderStyles.length);
          randomStyle = borderStyles[randomIndex];
        } while (usedColors.includes(randomStyle.backgroundColor) && usedColors.length < borderStyles.length);

        listItem.style.borderImageSource = randomStyle.url;
        listItem.style.borderImageSlice = '33%'; // Adjust as needed
        listItem.style.borderWidth = '8px'; // Adjust as needed
        listItem.style.borderImageRepeat = 'round'; // Or 'stretch', 'round', etc.
        listItem.style.borderStyle = 'solid'; // Fallback
        listItem.style.backgroundColor = randomStyle.backgroundColor;

        usedColors.push(randomStyle.backgroundColor); // Mark this color as used

        // If we've used all the styles, you might want to reset the usedColors array
        if (usedColors.length === borderStyles.length) {
          usedColors = [];
        }
      }
    });
  });
});