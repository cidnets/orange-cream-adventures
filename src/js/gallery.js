console.log("The gallery.js has loaded");

// --- Modal Functions: Moved to a higher scope to avoid ReferenceError ---
function openModal() {
    const modal = document.querySelector('#my-modal');
    if (modal) {
        modal.classList.add('modal-active');
    }
}

function closeModal() {
    const modal = document.querySelector('#my-modal');
    const infoPanel = document.querySelector('.modal-img-info');
    if (modal) {
        modal.classList.remove('modal-active');
    }
    if (infoPanel) {
        infoPanel.classList.remove('is-visible');
    }
}

// --- Gallery Grid Initialization Function ---
function initializeGalleryGrid() {
    const galleryContainer = document.querySelector('.gallery-container');
    if (!galleryContainer) {
        return;
    }

    // This is our new and improved function that reads the gap size from your CSS!
    function resizeGridItem(item) {
        const grid = document.querySelector('.gallery-container');
        const rowHeight = parseInt(getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
        const rowGap = parseInt(getComputedStyle(grid).getPropertyValue('gap'));

        const image = item.querySelector('img');
        if (!image) return;

        // NEW: Use the image's natural height for an accurate calculation.
        const itemHeight = image.naturalHeight; 
        const rowSpan = Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap));
        item.style.gridRowEnd = 'span ' + rowSpan;
    }

    // This is the part that correctly loops through all gallery items.
    const allItems = document.querySelectorAll('.custom-lightbox-trigger');
    allItems.forEach(item => {
        const image = item.querySelector('img');
        if (image) {
            const applyResize = () => {
                resizeGridItem(item);
            };
            image.addEventListener('load', applyResize);
            if (image.complete) {
                applyResize();
            }
        }
    });

    window.addEventListener('resize', () => {
        allItems.forEach(resizeGridItem);
    });
}

// --- Modal Lightbox Initialization Function ---
function initializeLightbox() {
    const modal = document.querySelector('#my-modal');
    if (!modal) {
        return;
    }

    const modalImage = modal.querySelector('.modal-image');
    const closeButton = modal.querySelector('.modal-close-btn');
    const overlay = modal.querySelector('.modal-overlay');
    const triggerLinks = document.querySelectorAll('.custom-lightbox-trigger');

    const infoTrigger = document.querySelector('.modal-info-trigger');
    const infoPanel = document.querySelector('.modal-img-info');
    const modalTitle = document.querySelector('#modal-title');
    const modalDate = document.querySelector('#modal-date');
    const modalMedium = document.querySelector('#modal-medium');
    const modalSize = document.querySelector('#modal-size');
    
    const prevButton = modal.querySelector('.prev-btn');
    const nextButton = modal.querySelector('.next-btn');
    let currentImageIndex = 0;
    let allGalleryItems = [];

	const modalContent = modal.querySelector('.modal-content');
    const modalButtons = modal.querySelector('.modal-buttons');
    const navButtons = modal.querySelectorAll('.modal-nav-btn');
	
	// NEW: Tap/click listener to toggle controls
	modalContent.addEventListener('click', () => {
		// This function will toggle a CSS class on the main modal container
		modal.classList.toggle('controls-visible');
	});

	// A small improvement: prevent tap on controls from hiding them
	if (modalButtons) {
		modalButtons.addEventListener('click', (event) => {
			event.stopPropagation(); // Prevents the click from bubbling up to the modal-content
		});
	}
	navButtons.forEach(button => {
		button.addEventListener('click', (event) => {
			event.stopPropagation();
		});
	});

    function updateModalContent(index) {
        const item = allGalleryItems[index];
        if (!item) return;

        const title = item.dataset.title;
        const date = item.dataset.date;
        const medium = item.dataset.medium;
        const size = item.dataset.size;
        const imageUrl = item.getAttribute('href');

        modalImage.setAttribute('src', imageUrl);
        modalTitle.textContent = title;
        modalDate.textContent = date;
        modalMedium.textContent = medium;
        modalSize.textContent = size;
        
        currentImageIndex = index;
    }

    triggerLinks.forEach((link, index) => {
        allGalleryItems.push(link);
        
        link.addEventListener('click', function(event) {
            event.preventDefault();
            updateModalContent(index);
            openModal();
        });
    });

    prevButton.addEventListener('click', () => {
        const newIndex = (currentImageIndex - 1 + allGalleryItems.length) % allGalleryItems.length;
        updateModalContent(newIndex);
    });

    nextButton.addEventListener('click', () => {
        const newIndex = (currentImageIndex + 1) % allGalleryItems.length;
        updateModalContent(newIndex);
    });

    if(closeButton) closeButton.addEventListener('click', closeModal);
    if(overlay) overlay.addEventListener('click', closeModal);

    if(infoTrigger && infoPanel) {
        infoTrigger.addEventListener('click', () => {
            infoPanel.classList.toggle('is-visible');
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}