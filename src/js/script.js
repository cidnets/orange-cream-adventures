console.log("hello, world!");

// $(document).ready(function() {
//  $('.hamburger').click(function() {
//    $('.nav-links').slideToggle(); // This will toggle the visibility with a nice slide effect!
    // Alternatively, you could use .toggle() for a simple show/hide
    // $('.nav-links').toggle();
//  });
// });

//COPYRIGHT
    const copyrightYearSpan = document.getElementById('copyright-year');
    const currentYear = new Date().getFullYear();
    copyrightYearSpan.textContent = currentYear;
	
// CLOSE NAVBAR AFTER CLICKING
  // Find the checkbox element by its ID
  const menuToggle = document.getElementById('menu-toggle');

  // Find all the navigation links within your menu
  const navLinks = document.querySelectorAll('a.nav-links');

  // Loop through each of the navigation links
  navLinks.forEach(link => {
    // Add a 'click' event listener to each one
    link.addEventListener('click', () => {
      // When a link is clicked, set the checkbox to 'unchecked'
      // This will trigger your CSS to hide the menu again! ✨
      menuToggle.checked = false;
    });
  });


// Random Border Images
document.addEventListener('DOMContentLoaded', function() {
  const postGrids = document.querySelectorAll('.posts-grid');

  const borderStyles = [
{ url: 'url("/assets/Border-orange-3.png")', backgroundColor: '#ffc97d' }, //light orange
  { url: 'url("/assets/Border-peach.png")', backgroundColor: '#ffd5bd' }, //peach
  { url: 'url("/assets/Border-pink.png")', backgroundColor: '#ffd1de' }, //pink
  { url: 'url("/assets/Border-lpurple.png")', backgroundColor: '#faceff' }, //light purple
  { url: 'url("/assets/Border-yellow.png")', backgroundColor: '#fff6bd' }, //yellow
  { url: 'url("/assets/Border-base.png")', backgroundColor: '#ffffff' }, //white
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
  
  function hideCutOffLinesJQuery() {
  $('.posts-grid li a').each(function() { // Replace with your container selector
    const $container = $(this);
    const lineHeight = parseFloat($container.css('line-height'));
    const containerHeight = $container.outerHeight();
    const textHeight = this.scrollHeight;

    if (textHeight > containerHeight) {
      const fittingLines = Math.floor(containerHeight / lineHeight);
      if (Math.ceil(textHeight / lineHeight) > fittingLines) {
        $container.hide(); // Or $container.empty();
      }
    }
  });
}

$(document).ready(hideCutOffLinesJQuery);
$(window).on('resize', hideCutOffLinesJQuery);
});

//BACK TO TOP BUTTON
// Get the button:
let mybutton = document.getElementById("back-to-top-bttn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function backToTop() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

//RANDOM POST BUTTON 
  const randomPostButton = document.getElementById('random-post-button');

  randomPostButton.addEventListener('click', async () => {
    try {
      // Fetch the list of posts
      const response = await fetch('/posts.json');
      const data = await response.json();
      const allPosts = data;

      if (allPosts && allPosts.length > 0) {
        // Pick a random post
        const randomIndex = Math.floor(Math.random() * allPosts.length);
        const randomPost = allPosts[randomIndex];

        // Go to the random post's URL
        window.location.href = randomPost.url;
      } else {
        console.error('Oops, no posts were found!');
      }
    } catch (error) {
      console.error('Oh no, something went wrong!', error);
    }
  });