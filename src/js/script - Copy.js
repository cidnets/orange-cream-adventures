console.log("hello, world!");

// COPYRIGHT & DATE
document.addEventListener('DOMContentLoaded', () => {
  // Set the current year for the copyright
  const copyrightYearSpan = document.getElementById('copyright-year');
  if (copyrightYearSpan) {
    copyrightYearSpan.textContent = new Date().getFullYear();
  }

	// Display the current date (e.g., "Jul 20")
  const dateElement = document.getElementById('date');
  if (dateElement) {
    const today = new Date();
    const options = {
      month: 'short',
      day: 'numeric'
    };
    dateElement.textContent = today.toLocaleDateString(undefined, options);
  }
});

// CLOCK
// This function updates and displays the current time every second.
function showTime() {
  let time = new Date();
  let hour = time.getHours();
  let min = time.getMinutes();
  let am_pm = "AM";

  // Adjust hour for 12-hour format
  if (hour >= 12) {
    if (hour > 12) hour -= 12;
    am_pm = "PM";
  } else if (hour === 0) {
    hour = 12;
    am_pm = "AM";
  }

  // Add leading zero to minutes if less than 10
  min = min < 10 ? "0" + min : min;

  // Get the time zone abbreviation (e.g., PDT, EST)
  const timeZone = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short'
    })
    .formatToParts(time)
    .find(part => part.type === 'timeZoneName')?.value || '';

  // Construct the current time string
  const currentTime = `${hour}:${min} ${am_pm} ${timeZone}`;

  // Update the element with the ID "clock"
  const clockElement = document.getElementById("clock");
  if (clockElement) {
    clockElement.innerHTML = currentTime;
  }
}

// Update the clock every second
setInterval(showTime, 1000);
// Call showTime immediately to display time without delay on load
showTime();


// CALENDAR
document.addEventListener('DOMContentLoaded', () => {
  const dateDisplay = document.getElementById('date-time');
  const calendarContainer = document.getElementById('calendar-container');

  // Function to generate and display the calendar for a given year and month
  function generateCalendar(year, month) {
    // Clear any previously generated calendar content
    if (calendarContainer) {
      calendarContainer.innerHTML = '';
    } else {
      console.error('Calendar container not found!');
      return;
    }

    const today = new Date();
    const currentMonthDate = new Date(year, month);

    // Create and append the calendar header (Month Year)
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.textContent = `${currentMonthDate.toLocaleString('default', { month: 'long' })} ${year}`;
    calendarContainer.appendChild(header);

    // Create and append day names (Sun-Sat)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      const dayNameCell = document.createElement('div');
      dayNameCell.className = 'day-name';
      dayNameCell.textContent = day;
      calendarContainer.appendChild(dayNameCell);
    });

    // Determine the first day of the month and total days in the month
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty cells to align the first day of the month correctly
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarContainer.appendChild(document.createElement('div'));
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'day-cell';
      dayCell.textContent = day;

      // Highlight the current day if it matches today's date
      if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
        dayCell.classList.add('current-day');
      }
      calendarContainer.appendChild(dayCell);
    }
  }

  // Add event listener to the date display to toggle calendar visibility
  if (dateDisplay) {
    dateDisplay.addEventListener('click', () => {
      if (calendarContainer) {
        // Toggle the 'calendar-hidden' class
        calendarContainer.classList.toggle('calendar-hidden');

        // If the calendar is now visible, generate its content for the current month
        if (!calendarContainer.classList.contains('calendar-hidden')) {
          const today = new Date();
          generateCalendar(today.getFullYear(), today.getMonth());
        }
      }
    });
  }
});


// CLOSE NAVBAR AFTER CLICKING A LINK
document.addEventListener('DOMContentLoaded', () => {
  // Find the checkbox element responsible for toggling the navbar
  // Using 'navbar-toggle' as inferred from your second Navbar section
  const menuToggle = document.getElementById('navbar-toggle');

  // Find all the navigation links within your menu
  // Using '.nav-links a' as inferred from your second Navbar section
  const navLinks = document.querySelectorAll('.nav-links a');

  // Loop through each of the navigation links and add a click listener
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // When a link is clicked, uncheck the menu toggle to hide the menu
      if (menuToggle) {
        menuToggle.checked = false;
      }
    });
  });
});


// RANDOM BORDER IMAGES
document.addEventListener('DOMContentLoaded', function() {
  const postGrids = document.querySelectorAll('.posts-grid');

  const borderStyles = [{
    url: 'url("/assets/Border-orange-3.png")',
    backgroundColor: '#ffc97d'
  }, //light orange
  {
    url: 'url("/assets/Border-peach.png")',
    backgroundColor: '#ffd5bd'
  }, //peach
  {
    url: 'url("/assets/Border-pink.png")',
    backgroundColor: '#ffd1de'
  }, //pink
  {
    url: 'url("/assets/Border-lpurple.png")',
    backgroundColor: '#faceff'
  }, //light purple
  {
    url: 'url("/assets/Border-yellow.png")',
    backgroundColor: '#fff6bd'
  }, //yellow
  {
    url: 'url("/assets/Border-base.png")',
    backgroundColor: '#ffffff'
  }, //white
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

  // This function uses jQuery. Ensure jQuery is loaded if you intend to use this.
  // If jQuery is not used elsewhere, consider rewriting this in vanilla JS.
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

  // Ensure jQuery is loaded before these calls
  // $(document).ready(hideCutOffLinesJQuery);
  // $(window).on('resize', hideCutOffLinesJQuery);
});


// BACK TO TOP BUTTON
document.addEventListener('DOMContentLoaded', () => {
  const mybutton = document.getElementById("back-to-top-bttn");

  // Show or hide the button based on scroll position
  window.onscroll = function() {
    if (mybutton) { // Ensure the button exists before trying to access its style
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
      } else {
        mybutton.style.display = "none";
      }
    }
  };

  // Scroll to the top of the document when the button is clicked
  if (mybutton) {
    mybutton.addEventListener('click', () => {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    });
  }
});


// RANDOM POST BUTTON
document.addEventListener('DOMContentLoaded', () => {
  const randomPostButton = document.getElementById('random-post-button');

  if (randomPostButton) { // Ensure the button exists
    randomPostButton.addEventListener('click', async () => {
      try {
        // Fetch the list of posts from your JSON file
        const response = await fetch('/posts.json');
        const data = await response.json();
        const allPosts = data;

        if (allPosts && allPosts.length > 0) {
          // Pick a random post from the list
          const randomIndex = Math.floor(Math.random() * allPosts.length);
          const randomPost = allPosts[randomIndex];

          // Navigate to the random post's URL
          window.location.href = randomPost.url;
        } else {
          console.error('Oops, no posts were found in posts.json!');
        }
      } catch (error) {
        console.error('Oh no, something went wrong while fetching posts:', error);
      }
    });
  }
});