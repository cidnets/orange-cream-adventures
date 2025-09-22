console.log("Links page is here!");

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

document.addEventListener('DOMContentLoaded', () => {
	updateCopyrightAndDate();
	 
    // A new helper function to apply a random border and background color.
    // Shuffler (Something called the Fisher Yates Algorithm)
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    function applyRandomStylesToLinks() {
        const borderStyles = [
            "frilly-border-base",
            "frilly-border-blue",
            "frilly-border-cream",
            "frilly-border-peach",
            "frilly-border-pink",
            "frilly-border-purple"
        ];
        
        const shuffledStyles = shuffleArray(borderStyles);
        
        // Select all links on the page
        const links = document.querySelectorAll('.frilly-link');
        let styleIndex = 0;
        
        links.forEach(link => {
            const style = shuffledStyles[styleIndex % shuffledStyles.length];
            link.classList.add(style);
            styleIndex++;
        });
    }

    // Call the function on page load
    applyRandomStylesToLinks();
});