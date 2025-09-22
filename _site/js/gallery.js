console.log("gallery.js has loaded");

// filtering the gallery.
function filterGallery(type) {
    const galleryItems = document.querySelectorAll('.gallery-container .custom-lightbox-trigger');
    const filterButtons = document.querySelectorAll('#gallery-filter-container .gallery-btn');

    // Update active state of filter buttons.
    filterButtons.forEach(button => {
        if (button.textContent.toLowerCase().includes(type.toLowerCase())) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Loop through all items to show/hide based on the filter type.
    galleryItems.forEach(item => {
        const itemType = item.dataset.type;
        if (type === 'all' || itemType === type) {
            item.style.display = ''; // Use an empty string to revert to the default display
        } else {
            item.style.display = 'none';
        }
    });
}

/*
// A function to initialize the gallery grid.
function initializeGalleryGrid() {
    const galleryContainer = document.querySelector('.window.active .gallery-container, .mobile-app.active .gallery-container');
    if (!galleryContainer) {
        return;
    }

    // Function to resize a single grid item.
    function resizeGridItem(item) {
        const grid = galleryContainer;
        const rowHeight = parseInt(getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
        const rowGap = parseInt(getComputedStyle(grid).getPropertyValue('gap'));

        const image = item.querySelector('img');
        if (!image) return;

        // Create a temporary, hidden image element to get the dimensions
        const tempImage = document.createElement('img');
        tempImage.style.visibility = 'hidden';
        tempImage.style.position = 'absolute';
        tempImage.src = image.src;
        document.body.appendChild(tempImage);

        // This event listener will fire only when the image is fully loaded
        tempImage.onload = function() {
            const imageAspectRatio = tempImage.naturalHeight / tempImage.naturalWidth;
            const columnWidth = item.getBoundingClientRect().width;
            const calculatedHeight = columnWidth * imageAspectRatio;
            
            const rowSpan = Math.ceil((calculatedHeight + rowGap) / (rowHeight + rowGap));
            
            // Set the grid-row-end style on the item
            item.style.gridRowEnd = 'span ' + rowSpan;
            
            // Clean up the temporary image element
            document.body.removeChild(tempImage);
        };
        // If the image is already in the browser cache, onload might not fire,
        // so we check and run the function immediately.
        if (tempImage.complete) {
            tempImage.onload();
        }
    }
    
    // Select only the visible gallery items to resize.
    const allItems = galleryContainer.querySelectorAll('.custom-lightbox-trigger:not([style*="display: none"])');
    allItems.forEach(item => {
        resizeGridItem(item); // Call the function directly
    });
} */

// A function to initialize the lightbox modal.
function initializeLightbox() {
    const modal = document.querySelector('#my-modal');
    if (!modal) {
        return;
    }
    
    const containerBreakpoint = 576;
    
    // Use a flag to track if the click handler has been added
    let isClickHandlerAttached = false;
    
    // The event handler for toggling controls on a click
    function toggleMobileControls(event) {
        // We only want to toggle if the user clicks the image or the overlay, not the buttons themselves.
        if (!event.target.closest('.modal-buttons, .modal-nav-btn, .modal-img-info, .modal-close-btn')) {
            modal.classList.toggle('controls-visible');
        }
    }
    
    const containerObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const containerWidth = entry.contentRect.width;
            if (containerWidth <= containerBreakpoint) {
                // Attach the click handler for small container sizes if it's not already attached
                if (!isClickHandlerAttached) {
                    modal.addEventListener('click', toggleMobileControls);
                    isClickHandlerAttached = true;
                }
            } else {
                // Remove the click handler for large container sizes if it's attached
                if (isClickHandlerAttached) {
                    modal.removeEventListener('click', toggleMobileControls);
                    isClickHandlerAttached = false;
                    // Ensure controls are visible on large containers, just in case
                    modal.classList.remove('controls-visible');
                }
            }
        }
    });

    // ✨ NEW: Global variables to store gallery state
    let allGalleryItems;
    let currentItemIndex;

    // ✨ NEW: Function to update the modal with a new image and data
    function updateModalContent(item) {
        const title = item.dataset.title;
        const date = item.dataset.date;
        const medium = item.dataset.medium;
        const size = item.dataset.size;
        const imageUrl = item.getAttribute('href');

        $('#my-modal .modal-image').attr('src', imageUrl);
        $('#modal-title').text(title);
        $('#modal-date').text(date);
        $('#modal-medium').text(medium);
        $('#modal-size').text(size);
    }

    // Now, we must attach our event listeners to the body, not to the document.
    // This is because new .custom-lightbox-trigger elements are added dynamically.
    $('body').on('click', '.custom-lightbox-trigger', function(event) {
        event.preventDefault();

        // Get all VISIBLE gallery items and the index of the clicked item
        const galleryContainer = document.querySelector('.window.active .gallery-container, .mobile-app.active .gallery-container');
        if (galleryContainer) {
            allGalleryItems = Array.from(galleryContainer.querySelectorAll('.custom-lightbox-trigger:not([style*="display: none"])'));
            currentItemIndex = allGalleryItems.indexOf(this);
        } else {
            console.error("Gallery container not found.");
            return;
        }

        updateModalContent(this);
        $('#my-modal').addClass('modal-active');
    });

    // ✨ NEW: Click handler for the 'next' button
    $('body').on('click', '.modal-nav-btn.next-btn', function() {
        if (allGalleryItems && allGalleryItems.length > 0) {
            currentItemIndex = (currentItemIndex + 1) % allGalleryItems.length;
            const nextItem = allGalleryItems[currentItemIndex];
            updateModalContent(nextItem);
        }
    });

    // ✨ NEW: Click handler for the 'previous' button
    $('body').on('click', '.modal-nav-btn.prev-btn', function() {
        if (allGalleryItems && allGalleryItems.length > 0) {
            currentItemIndex = (currentItemIndex - 1 + allGalleryItems.length) % allGalleryItems.length;
            const prevItem = allGalleryItems[currentItemIndex];
            updateModalContent(prevItem);
        }
    });

    // The rest of the modal logic is now a standalone block.
    // The close and info buttons should be added to the document once.
    const modalImage = modal.querySelector('.modal-image');
    const closeButton = modal.querySelector('.modal-close-btn');
    const overlay = modal.querySelector('.modal-overlay');
    const infoTrigger = document.querySelector('.modal-info-trigger');
    const infoPanel = document.querySelector('.modal-img-info');

    function closeModal() {
        modal.classList.remove('modal-active');
        if (infoPanel) {
            infoPanel.classList.remove('is-visible');
        }
    }

    $(closeButton).on('click', closeModal);
    $(overlay).on('click', closeModal);

    if (infoTrigger) {
        $(infoTrigger).on('click', () => {
            $(infoPanel).toggleClass('is-visible');
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.classList.contains('modal-active')) {
            closeModal();
        }
    });
    
    // This observer will automatically start watching for resizes
    const galleryContainer = document.querySelector('.gallery-container');
    if (galleryContainer) {
        containerObserver.observe(galleryContainer);
    }
}