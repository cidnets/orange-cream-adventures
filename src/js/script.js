console.log("Hello, world!");

// --- Global Helper Functions ---
// A consolidated helper to check for mobile devices based on screen size.
function isMobileDevice() {
    // This breakpoint should match the one in your CSS.
    const breakpoint = 576;
    return window.innerWidth <= breakpoint;
}

// --- Functions that are called on page load ---

// COPYRIGHT & DATE
function updateCopyrightAndDate() {
    const copyrightYearSpan = document.getElementById('copyright-year');
    if (copyrightYearSpan) {
        copyrightYearSpan.textContent = new Date().getFullYear();
    }

    const dateElement = document.getElementById('date');
    if (dateElement) {
        const today = new Date();
        const options = {
            month: 'short',
            day: 'numeric'
        };
        dateElement.textContent = today.toLocaleDateString(undefined, options);
    }
}

// CLOCK
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
    
    // Construct the current time string without seconds
    const currentTime = `${hour}:${min} ${am_pm}`;

    // Update all elements with the class "js-clock-display"
    const clockElements = document.querySelectorAll(".js-clock-display");
    clockElements.forEach(element => {
        element.innerHTML = currentTime;
    });
}

// CALENDAR
function generateCalendar(year, month) {
    const calendarContainer = document.getElementById('calendar-container');
    const mobileCalendarWidget = document.getElementById('mobile-calendar-widget');
    const targetContainer = isMobileDevice() ? mobileCalendarWidget : calendarContainer;

    if (!targetContainer) {
        console.error('Calendar container not found!');
        return;
    }

    targetContainer.innerHTML = '';

    const today = new Date();
    const currentMonthDate = new Date(year, month);

    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.textContent = `${currentMonthDate.toLocaleString('default', { month: 'long' })} ${year}`;
    targetContainer.appendChild(header);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayNameCell = document.createElement('div');
        dayNameCell.className = 'day-name';
        dayNameCell.textContent = day;
        targetContainer.appendChild(dayNameCell);
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        targetContainer.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.textContent = day;

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayCell.classList.add('current-day');
        }
        targetContainer.appendChild(dayCell);
    }
}

// --- Helper Function for Mobile ---
// large date display
function generateLargeDateDisplay(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found.`);
        return;
    }
    const today = new Date();
    const dayOfWeek = today.toLocaleString('default', { weekday: 'short' }).toUpperCase();
    const dayOfMonth = today.getDate();

    container.innerHTML = `
        <div class="large-day-of-week">${dayOfWeek}</div>
        <div class="large-day-of-month">${dayOfMonth}</div>
    `;
}

// mini-calendar.
function generateMiniCalendar(containerId, year, month) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found.`);
        return;
    }
    container.innerHTML = '';
    
    const today = new Date();
    const currentMonthDate = new Date(year, month);
    
    // Create and append the calendar header (Month Year)
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.textContent = `${currentMonthDate.toLocaleString('default', { month: 'short' }).toUpperCase()} ${year}`;
    container.appendChild(header);

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        container.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'mini-day-cell';
        dayCell.textContent = day;

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayCell.classList.add('current-day');
        }
        container.appendChild(dayCell);
    }
}

// --- Event Listeners and Initial Page Load Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Call functions to run immediately on page load
    updateCopyrightAndDate();
    showTime();
	setInterval(showTime, 1000);

    // Desktop Calendar Event Listener
    const dateDisplay = document.getElementById('date-time');
    const calendarContainer = document.getElementById('calendar-container');

    if (dateDisplay) {
        dateDisplay.addEventListener('click', () => {
            if (isMobileDevice()) {
                return;
            }
            if (calendarContainer) {
                calendarContainer.classList.toggle('calendar-hidden');
                if (!calendarContainer.classList.contains('calendar-hidden')) {
                    const today = new Date();
                    generateCalendar(today.getFullYear(), today.getMonth());
                }
            }
        });
    }

    // Mobile Calendar Widget on initial load
    const mobileCalendarWidget = document.getElementById('mobile-calendar-widget');
    if (isMobileDevice() && mobileCalendarWidget) {
        const today = new Date();
        // Generate the large date display
        generateLargeDateDisplay('mobile-current-date-display');
        // Generate the mini-calendar
        generateMiniCalendar('mobile-mini-calendar', today.getFullYear(), today.getMonth());
    }

    // CLOSE NAVBAR AFTER CLICKING A LINK
    const menuToggle = document.getElementById('navbar-toggle');
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuToggle) {
                menuToggle.checked = false;
            }
        });
    });

    const navContainer = document.querySelector('.nav-container');
    document.addEventListener('click', (event) => {
        if (menuToggle && menuToggle.checked) {
            const isClickInsideNav = navContainer && navContainer.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            if (!isClickInsideNav && !isClickOnToggle) {
                menuToggle.checked = false;
            }
        }
    });

/*
    // RANDOM BORDER IMAGES
    const postGrids = document.querySelectorAll('.posts-grid');
    const borderStyles = [{
        url: 'url("/assets/Border-orange-3.png")',
        backgroundColor: '#ffc97d'
    }, {
        url: 'url("/assets/Border-peach.png")',
        backgroundColor: '#ffd5bd'
    }, {
        url: 'url("/assets/Border-pink.png")',
        backgroundColor: '#ffd1de'
    }, {
        url: 'url("/assets/Border-lpurple.png")',
        backgroundColor: '#faceff'
    }, {
        url: 'url("/assets/Border-yellow.png")',
        backgroundColor: '#fff6bd'
    }, {
        url: 'url("/assets/Border-base.png")',
        backgroundColor: '#ffffff'
    }, ];

    postGrids.forEach(grid => {
        const listItems = grid.querySelectorAll('li a');
        let styleIndex = 0;
        listItems.forEach(listItem => {
            const style = borderStyles[styleIndex % borderStyles.length];
            listItem.style.borderImageSource = style.url;
            listItem.style.borderImageSlice = '33%';
            listItem.style.borderWidth = '8px';
            listItem.style.borderImageRepeat = 'round';
            listItem.style.borderStyle = 'solid';
            listItem.style.backgroundColor = style.backgroundColor;
            styleIndex++;
        });
    });
*/

    // BACK TO TOP BUTTON
    const mybutton = document.getElementById("back-to-top-bttn");

    window.onscroll = function() {
        if (mybutton) {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                mybutton.style.display = "block";
            } else {
                mybutton.style.display = "none";
            }
        }
    };

    if (mybutton) {
        mybutton.addEventListener('click', () => {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        });
    }

    // RANDOM POST BUTTON
    const randomPostButton = document.getElementById('random-post-button');

    if (randomPostButton) {
        randomPostButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/posts.json');
                const data = await response.json();
                const allPosts = data;

                if (allPosts && allPosts.length > 0) {
                    const randomIndex = Math.floor(Math.random() * allPosts.length);
                    const randomPost = allPosts[randomIndex];
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