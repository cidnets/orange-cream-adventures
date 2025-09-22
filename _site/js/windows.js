console.log("windows.js has loaded");

// --- Pagefind Helper Functions ---
function loadPagefindScript() {
    if (!document.querySelector('script[src="/pagefind/pagefind-ui.js"]')) {
        const script = document.createElement('script');
        script.src = "/pagefind/pagefind-ui.js";
        script.async = true;
        return new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
    return Promise.resolve();
}

function initializePagefindUI() {
    if (typeof PagefindUI !== 'undefined' && $('#search').length) {
        new PagefindUI({
            element: "#search",
            showSubResults: true
        });
        console.log("Pagefind UI successfully initialized!");
    } else {
        console.warn("PagefindUI is not yet available or search element not found.");
    }
}

$(document).ready(function() {
    // --- Global Variables ---
    let zIndexCounter = 1000;
    const breakpoint = 576; // Mobile breakpoint in pixels.
    let resizeTimer;
    let lastSelectedText = '';
    let contextMenuTarget = null;
	// let desktopApps = [];
	let knownWindows = {};
    let navbarLinks = [];
	
	// --- Helper Functions ---
    // A consolidated helper to check for mobile devices based on screen size.
    function isMobileDevice() {
        return $(window).width() <= breakpoint;
    }
    
    // A universal ID generation function for windows.
    function getUrlId(url) {
        const normalizedUrl = url.split('#')[0].replace(/\/$/, '');
        return 'window-' + btoa(normalizedUrl).replace(/=/g, '');
    }

    // Helper function to sanitize a string for use as a CSS class name.
    function sanitizeForClass(input) {
        if (!input) {
            return '';
        }
        // Replace spaces and invalid characters with hyphens, and convert to lowercase.
        return input.replace(/[\s&]+/g, '-').replace(/[^\w-]+/g, '').toLowerCase();
    }
	
	// A new helper function to get the correct icon source URL.
	function getIconSource(icon) {
		if (icon.startsWith('/') || icon.startsWith('http')) {
			return icon; // It's a file path, so return it as is.
		} else {
			// Correctly handle Unicode characters before Base64 encoding.
			const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="16" fill="black">${icon}</text></svg>`;
			const encodedSvg = unescape(encodeURIComponent(svg));
			return `data:image/svg+xml;base64,${btoa(encodedSvg)}`;
		}
	}
	
	// A new function to set the icon src on the app launchers.
	function initializeDesktopIcons() {
		$('.app-launcher').each(function() {
			const $this = $(this);
			const icon = $this.data('icon') || '';
			const iconSrc = getIconSource(icon);
			$this.find('.icon-visual').attr('src', iconSrc);
			
			const title = $this.data('title');
			const sanitizedTitle = sanitizeForClass(title);
			$this.addClass(`icon-${sanitizedTitle}`);
		});
	}
	
	// A universal function to load a script dynamically.
	function loadScript(src) {
		if (document.querySelector(`script[src="${src}"]`)) {
			console.log(`Script already loaded: ${src}`);
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.onload = () => {
				console.log(`Script loaded: ${src}`);
				resolve();
			};
			script.onerror = () => {
				console.error(`Script failed to load: ${src}`);
				reject(new Error(`Script failed to load: ${src}`));
			};
			document.body.appendChild(script);
		});
	}
	
	// A helper function to get the value of a URL parameter.
	function getQueryParameter(name) {
		name = name.replace(/[\[\]]/g, '\\$&');
		const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
		const results = regex.exec(location.href);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}
	
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
	
	function applyRandomStylesToButtons($container) {
		const borderStyles = [
			"frilly-border-base",
			"frilly-border-blue",
			"frilly-border-cream",
			"frilly-border-peach",
			"frilly-border-pink",
			"frilly-border-purple"
		];
		
		const shuffledStyles = shuffleArray(borderStyles);
		
		const $buttons = $container.find('.random-borders-menu .random-borders-link');
		let styleIndex = 0;
		
		$buttons.each(function() {
			const style = shuffledStyles[styleIndex % borderStyles.length];
			const $button = $(this);
			$button.addClass(style);		
			styleIndex++;
		});
	}
	
	/*
	// A new function to load the desktop_apps.js file and populate the array.
	function loadDesktopApps() {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = '/js/desktop_apps.js';
			script.onload = () => {
				if (window.desktopApps) {
					console.log("desktop_apps.js loaded successfully!");
					resolve();
				} else {
					reject(new Error("Failed to load desktopApps data."));
				}
			};
			script.onerror = () => {
				reject(new Error("Script failed to load: /js/desktop_apps.js"));
			};
			document.body.appendChild(script);
		});
	}
	// This function will now find the window to open from the desktopApps array.
	function handleInitialWindowLoad() {
		const windowUrl = getQueryParameter('openwindow');
		if (windowUrl) {
			// The fix is here: we explicitly use 'window.desktopApps'
			const windowInfo = window.desktopApps.find(app => app.url === windowUrl);
			if (windowInfo) {
				createWindow(getUrlId(windowUrl), windowInfo.title, windowUrl, 'general', windowInfo.icon);
				return true;
			}
		}
		return false;
	} */
	// END HELPER FUNCTIONS
	
    // --- Core Window/App Creation and Content Loading Functions ---
	// This is now the only function that creates a new window.
	function createWindow(windowId, title, url, type = 'general', windowIcon = '/assets/heart-basic.png') {
		const uniqueClassName = `window-${sanitizeForClass(title)}`;
		
		// Correctly handle image source for the window-icon
		const iconSrc = getIconSource(windowIcon);

		// Define the single HTML structure
		const windowHtml = `
			<div class="window ${type}-window ${uniqueClassName}" id="${windowId}" data-window-state="open" data-maximized="false">
				<div class="window-header">
					<img src="${iconSrc}" class="window-icon" onerror="this.src='/assets/heart-basic.png'; this.onerror=null;">
					<span class="window-title">${title}</span>
					<div class="window-controls">
						<button class="window-minimize" title="Minimize">_</button>
						<button class="window-maximize" title="Maximize">◻</button>
						<button class="window-close" title="Close">&times;</button>
					</div>
				</div>
				<div class="window-body">
					<div class="window-content"><p>Loading...</p></div>
				</div>
			</div>`;

		const $newWindow = $(windowHtml);
		$newWindow.appendTo('#desktop');
		
		// Add the mobile-window class if needed
		if (isMobileDevice()) {
			$newWindow.addClass('mobile-window');
		}

		// Initialize jQuery UI behaviors only if not a mobile device.
		if (!isMobileDevice()) {
			$newWindow.draggable({
				handle: ".window-header",
				containment: "#desktop",
				start: function() { setActiveWindow($(this)); }
			});
			$newWindow.resizable({
				minHeight: 150,
				minWidth: 250,
				handles: "n, e, s, w, ne, se, sw, nw",
				containment: "#desktop",
				start: function() { setActiveWindow($(this)); }
			});
		}
		
		// Update the navbar button with the new iconSrc
		const navbarButtonHtml = `<button class="navbar-button" data-window-id="${windowId}"><img src="${iconSrc}" class="window-icon" onerror="this.src='/assets/heart-basic.png'; this.onerror=null;"><span class="window-title">${title}</span></button>`;
		$(`.navbar-button[data-window-id="${windowId}"]`).remove();
		$(navbarButtonHtml).insertAfter('#navbar .start-divider');
		
		loadContentAndPositionWindow($newWindow, url, title, true);

		$newWindow.on('mousedown', function() {
			setActiveWindow($(this));
		});
	}
    
    // Handles content loading and window positioning.
    async function loadContentAndPositionWindow($window, url, title, isInitialLoad = true) {
        const $contentContainer = $window.find('.window-content');
        
        $contentContainer.html('<p>Loading...</p>');

        if (title) {
            $window.find('.window-title').text(title);
            const windowId = $window.attr('id');
            $(`.navbar-button[data-window-id="${windowId}"]`).find('.window-title').text(title);
        }
        
        $contentContainer.load(url + ' #page-content', async function(response, status, xhr) {
            if (status === "error") {
                $(this).html(`<div class="error-content">
                    <p>Sorry, an error occurred loading this content: ${xhr.status} ${xhr.statusText}.</p>
                    <button class="reload-content-button" data-url="${url}" data-title="${title}">Try Again</button>
                </div>`);
                $(this).find('.reload-content-button').on('click', function() {
                    const reloadUrl = $(this).data('url');
                    const reloadTitle = $(this).data('title');
                    loadContentAndPositionWindow($window, reloadUrl, reloadTitle, false);
                });
            } if (url === '/search/') {
                // Now we can simply call the functions directly.
                await loadPagefindScript();
                initializePagefindUI();
            } if ($(this).find('.gallery-container').length) {
				// Dynamically load the gallery script only when needed.
				await loadScript('/js/gallery.js');

				// Now, we can safely call the functions from the gallery script.
				if (typeof initializeLightbox === 'function') {
					initializeLightbox();
				}
			}
			applyRandomStylesToButtons($window);
            applyDynamicSizingAndPositioning($window, isInitialLoad);
        });
    }

    // Handles the dynamic sizing and positioning of windows on the desktop.
    function applyDynamicSizingAndPositioning($window, isInitialLoad) {
        if (isMobileDevice()) {
            $window.css('opacity', 1);
            setActiveWindow($window);
            return;
        }
        if (!isInitialLoad) {
            $window.css('opacity', 1);
            setActiveWindow($window);
            return;
        }
        const minDynamicWidth = 250;
        const minDynamicHeight = 150;
        const desktopWidth = $('#desktop').width();
        const desktopHeight = $('#desktop').height();
        const padding = 20;
        const maxDesktopFitWidth = desktopWidth - (padding * 2);
        const maxDesktopFitHeight = desktopHeight - (padding * 2);
        const $tempContainer = $('<div></div>')
            .css({ 'position': 'absolute', 'visibility': 'hidden', 'height': 'auto' })
            .appendTo('body');
        const $clonedContent = $window.find('.window-content').clone().appendTo($tempContainer);
        $tempContainer.css('width', Math.min(desktopWidth / 2, 700) + 'px');
        const naturalContentWidth = $tempContainer.outerWidth();
        const naturalContentHeight = $tempContainer.outerHeight();
        $tempContainer.remove();
        let finalCalculatedWidth = Math.min(Math.max(naturalContentWidth, minDynamicWidth), maxDesktopFitWidth);
        let finalCalculatedHeight = Math.min(Math.max(naturalContentHeight, minDynamicHeight), maxDesktopFitHeight);
        if ($window.data('ui-resizable')) {
            const resizableMinHeight = $window.resizable("option", "minHeight");
            const resizableMinWidth = $window.resizable("option", "minWidth");
            finalCalculatedWidth = Math.max(finalCalculatedWidth, resizableMinWidth);
            finalCalculatedHeight = Math.max(finalCalculatedHeight, resizableMinHeight);
        }
        $window.css('width', finalCalculatedWidth + 'px').css('height', finalCalculatedHeight + 'px');
        const centerX = (desktopWidth / 2) - (finalCalculatedWidth / 2);
        const centerY = (desktopHeight / 2) - (finalCalculatedHeight / 2);
        $window.css({ 'top': centerY + 'px', 'left': centerX + 'px', 'opacity': 1 });
        setActiveWindow($window);
    }

    // --- Window/App Control Functions ---
    // Function to set the active window and manage z-index.
    function setActiveWindow($window) {
        const newWindowId = $window.attr('id');
        const $currentActiveWindow = $('.window.active');
        if ($currentActiveWindow.length && $currentActiveWindow.attr('id') !== newWindowId) {
            $currentActiveWindow.removeClass('active');
            $(`.navbar-button[data-window-id="${$currentActiveWindow.attr('id')}"]`).removeClass('active');
        }
        $window.removeClass('minimized');
        $window.attr('data-window-state', 'open');
        $window.addClass('active').css('z-index', ++zIndexCounter);
        $(`.navbar-button[data-window-id="${newWindowId}"]`).addClass('active').removeClass('minimized');
    }

    function maximizeWindow(windowId) {
        const $window = $('#' + windowId);
        if (!$window.length) return;
        const isMaximized = $window.data('maximized');
        if (!isMaximized) {
            $window.data('originalPosition', $window.position());
            $window.data('originalSize', { width: $window.width(), height: $window.height() });
            $window.addClass('maximized').css({ top: '0', left: '0', width: '100%', height: '100%' });
            if ($window.data('ui-draggable')) $window.draggable('disable');
            if ($window.data('ui-resizable')) $window.resizable('disable');
            $window.find('.window-maximize').text('❐');
            $window.data('maximized', true);
        } else {
            const originalPosition = $window.data('originalPosition');
            const originalSize = $window.data('originalSize');
            $window.removeClass('maximized').css({
                top: originalPosition.top + 'px',
                left: originalPosition.left + 'px',
                width: originalSize.width + 'px',
                height: originalSize.height + 'px'
            });
            if ($window.data('ui-draggable')) $window.draggable('enable');
            if ($window.data('ui-resizable')) $window.resizable('enable');
            $window.find('.window-maximize').text('◻');
            $window.data('maximized', false);
        }
    }

	// --- Initial Page Load Logic ---
    function setDesktopHeight() {
        const navbarHeightValue = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height');
        const navbarHeight = parseFloat(navbarHeightValue) || 0;
        const statusbarHeightValue = getComputedStyle(document.documentElement).getPropertyValue('--statusbar-height');
        const statusbarHeight = parseFloat(statusbarHeightValue) || 0;
        const desktopElement = document.getElementById('desktop');

        if (desktopElement) {
            let availableHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            let finalDesktopHeight;

            // Conditionally subtract statusbarHeight only on mobile devices
            if (isMobileDevice()) {
                finalDesktopHeight = availableHeight - navbarHeight - statusbarHeight;
            } else {
                finalDesktopHeight = availableHeight - navbarHeight;
            }

            desktopElement.style.setProperty('--desktop-height', `${finalDesktopHeight}px`);
        }
    }
    
    // A more robust way to toggle full screen
	function toggleFullScreen() {
		if (!document.fullscreenElement) {
			// Request to enter fullscreen
			document.documentElement.requestFullscreen();
		} else {
			// Request to exit fullscreen
			document.exitFullscreen();
		}
	}

	// Listen for the 'fullscreenchange' event to update the icon
	document.addEventListener('fullscreenchange', function() {
		// Select the SVG element and then the <use> element within it.
		const fullscreenIconUse = document.querySelector('.fullscreen-icon-use');

		if (document.fullscreenElement) {
			fullscreenIconUse.setAttribute('href', '/assets/icon-sheet.svg#fullscreen-exit-icon');
		} else {
			fullscreenIconUse.setAttribute('href', '/assets/icon-sheet.svg#fullscreen-icon');
		}
	});

    $('body').on('click', '.fullscreen-button', function() {
        toggleFullScreen();
    });
	
    // --- Clipboard Helper Functions ---
    function copySelection(textToCopy) {
        if (textToCopy.length > 0) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => { console.log('Text successfully copied!'); })
                .catch(err => { console.error('Could not copy text: ', err); });
        } else {
            console.warn('No text is currently selected to copy.');
        }
    }

    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            console.log('Text successfully pasted:', text);
            return text;
        } catch (err) {
            console.error('Could not paste text: ', err);
            return null;
        }
    }
	
	// --- App Drawer and Mobile UI Functions ---
	// This new function will update the mobile app drawer with all open apps.
	function updateAppDrawer() {
		const $appDrawerList = $('#open-apps-list');
		$appDrawerList.empty();

		// Loop through all open windows and add a button for each.
		$('.window').each(function() {
			const windowId = $(this).attr('id');
			const title = $(this).find('.window-title').text();
			const iconSrc = $(this).find('.window-icon').attr('src');
			const isMinimized = $(this).attr('data-window-state') === 'minimized';
			
			const sanitizedTitle = sanitizeForClass(title);

			const $appButton = $(`<button class="app-drawer-button icon-${sanitizedTitle}" data-window-id="${windowId}">
				<div class="icon-wrapper">
					<img class="icon-visual" src="${iconSrc}" alt="${title} icon">
				</div>
				<span>${title}</span>
			</button>`);

			if (isMinimized) {
				$appButton.addClass('minimized');
			}

			$appDrawerList.append($appButton);
		});
	}
    
    // --- Event Handlers ---
    // App launcher click handler.
	$('body').on('click', '.app-launcher', function(e) {
		
		e.preventDefault();
		const $this = $(this);
		const url = $this.data('url');
		const title = $this.data('title') || $this.text();
		const icon = $this.data('icon') || '/assets/heart-basic.png';

		const windowId = getUrlId(url);
		const $existingWindow = $('#' + windowId);

		if ($existingWindow.length) {
			setActiveWindow($existingWindow);
		} else {
			createWindow(windowId, title, url, 'general', icon);
		}
		
		if (isMobileDevice()) {
			updateAppDrawer();
		}
	});
	// --- Event Handlers for App Names ---
    $('body').on('click', '.app-icon', function(e) {
        // Prevent the click from launching the window right away
        e.stopPropagation();

        const $this = $(this);
        // Toggle the class to show/hide the full name
        $this.toggleClass('show-full-name');
        
        // Hide the full name if the user clicks anywhere else on the desktop
        $('#desktop').one('click', function() {
            $this.removeClass('show-full-name');
        });
    });
	
	$('body').on('click', '.status-icon', function(e) {
		  e.preventDefault();
		  const message = $(this).data('message');

		  const popup = $('#message-popup');
		  const popupText = $('#popup-text');

		  popupText.html(message);
		  popup.addClass('visible');

		  // Hide the popup after a few seconds
		  setTimeout(function() {
			popup.removeClass('visible');
		  }, 3000); // Hides after 3 seconds
	});
	
	// Sub-navigation Link Click Handler
	$('body').on('click', '.subnav-link', function(e) {
	  e.preventDefault();
	  const targetId = $(this).data('target');
	  const $window = $(this).closest('.window');

	  $window.find('.sub-content-section.active').removeClass('active');
	  $window.find(`#${targetId}`).addClass('active');
	});
	
    // Universal link click handler.
    $('body').on('click', 'a', function(e) {
        const $this = $(this);
        const href = $this.attr('href');
        const windowTarget = $this.data('window-target');

        if (!href) return true;

        const shouldBeHandledByWindowSystem = !($this.attr('target') === '_blank' ||
            $this.data('open-new-tab') === true ||
            href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') ||
            href.startsWith('javascript:') || $this.data('no-window') || $this.hasClass('custom-lightbox-trigger'));
        
        if (!shouldBeHandledByWindowSystem) return true;

        e.preventDefault();
        e.stopPropagation();

        const isPostLink = href.startsWith('/posts/');
        const blogPostWindowId = 'window-blog-post';
        
        const finalWindowTitle = $this.data('title') || $this.text() || 'New Window';

        if (isPostLink) {
            const $existingBlogPostWindow = $('#' + blogPostWindowId);
            if ($existingBlogPostWindow.length) {
                loadContentAndPositionWindow($existingBlogPostWindow, href, "Blog Post", false);
                setActiveWindow($existingBlogPostWindow);
            } else {
                createWindow(blogPostWindowId, "Blog Post", href, 'post');
            }
            return;
        }

        const windowId = getUrlId(href);
        const $existingWindow = $('#' + windowId);
        const $activeWindow = $('.window.active');
        const isWindowActive = $activeWindow.length > 0;
        
        const linkData = navbarLinks.find(link => link.url === href);
        const icon = linkData ? linkData.icon : '/assets/heart-basic.png';
        
        if (windowTarget === 'current' && isWindowActive) {
            loadContentAndPositionWindow($activeWindow, href, finalWindowTitle, false);
        } else if ($existingWindow.length) {
            setActiveWindow($existingWindow);
        } else {
            createWindow(windowId, finalWindowTitle, href, 'general', icon);
        }
    });

    // Window control buttons and navbar button click handlers.
    $('body').on('click', '.window-close, .window-minimize, .window-maximize, .mobile-back-button, .app-drawer-button, #mobile-home-button, #drawer-clear-all, #drawer-close, #mobile-app-drawer-button', function() {
		const $this = $(this);

		if ($this.hasClass('window-close')) {
			const $window = $(this).closest('.window');
			const windowId = $window.attr('id');
			$(`.navbar-button[data-window-id="${windowId}"]`).remove();
			$window.remove();
			if (isMobileDevice()) updateAppDrawer();
		} else if ($this.hasClass('window-minimize')) {
			const $window = $(this).closest('.window');
			const windowId = $window.attr('id');
			$window.addClass('minimized');
			$window.removeClass('active');
			$window.attr('data-window-state', 'minimized');
			if (!isMobileDevice()) {
				$(`.navbar-button[data-window-id="${windowId}"]`).addClass('minimized').removeClass('active');
			} else {
				updateAppDrawer();
			}
		} else if ($this.hasClass('window-maximize')) {
			const $window = $(this).closest('.window');
			maximizeWindow($window.attr('id'));
		} else if ($this.hasClass('navbar-button')) {
			// ... (existing code for desktop navbar buttons)
		} else if ($this.attr('id') === 'mobile-app-drawer-button') {
			$('#app-drawer').toggleClass('visible');
			if ($('#app-drawer').hasClass('visible')) {
				updateAppDrawer();
			}
		} else if ($this.hasClass('app-drawer-button')) {
			const windowId = $(this).data('window-id');
			const $targetWindow = $('#' + windowId);
			if ($targetWindow.length) {
				if ($targetWindow.attr('data-window-state') === 'minimized') {
					setActiveWindow($targetWindow);
				} else {
					setActiveWindow($targetWindow);
				}
				$('#app-drawer').removeClass('visible');
			}
		} else if ($this.attr('id') === 'mobile-home-button') {
			$('.window').each(function() {
				const windowId = $(this).attr('id');
				minimizeWindowById(windowId);
			});
			$('#app-drawer').removeClass('visible');
		} else if ($this.attr('id') === 'drawer-clear-all') {
			closeAllWindows();
			if (isMobileDevice()) updateAppDrawer();
			$('#app-drawer').removeClass('visible');
		}
	});
	
	$('body').on('click', '#mobile-back-button', function() {
        const $appDrawer = $('#app-drawer');
        const $activeWindow = $('.window.active');

        // Check if the app drawer is open first.
        if ($appDrawer.hasClass('visible')) {
            // If the app drawer is open, close it.
            $appDrawer.removeClass('visible');
        } else if ($activeWindow.length) {
            // If the app drawer is not open, close the active window.
            closeWindowById($activeWindow.attr('id'));
            
            if (isMobileDevice()) {
                updateAppDrawer();
            }
        }
    });
	
	// Create a new, dedicated event handler for the desktop navbar buttons.
	$('body').on('click', '.navbar-button', function() {
		const windowId = $(this).data('window-id');
		const $targetWindow = $('#' + windowId);
		
		if ($targetWindow.length) {
			if ($targetWindow.attr('data-window-state') === 'minimized') {
				setActiveWindow($targetWindow);
			} else if ($targetWindow.hasClass('active')) {
				$targetWindow.addClass('minimized').removeClass('active').attr('data-window-state', 'minimized');
				$(this).removeClass('active').addClass('minimized');
			} else {
				setActiveWindow($targetWindow);
			}
		}
	});
    
    // --- Context Menu and Close All Windows Functions ---
    function closeWindowById(windowId) {
		const $windowToClose = $('#' + windowId);
		
		// Check if the window to be closed is the active one
		const wasActive = $windowToClose.hasClass('active');

		// Remove the window and its corresponding navbar button
		$windowToClose.remove();
		$(`.navbar-button[data-window-id="${windowId}"]`).remove();

		// If the window that was just closed was the active one,
		// find the next one to make active.
		if (wasActive) {
			// Find all remaining open windows, sorted by z-index in descending order
			const $remainingWindows = $('.window').sort(function(a, b) {
				return $(b).css('z-index') - $(a).css('z-index');
			});

			// If there's at least one window left, make the one with the highest z-index active
			if ($remainingWindows.length > 0) {
				setActiveWindow($remainingWindows.first());
			}
		}

		// Always update the app drawer to reflect the change
		if (isMobileDevice()) {
			updateAppDrawer();
		}
	}

    function minimizeWindowById(windowId) {
        const $window = $('#' + windowId);
        if ($window.length) {
            $window.addClass('minimized').removeClass('active').attr('data-window-state', 'minimized');
            $(`.navbar-button[data-window-id="${windowId}"]`).addClass('minimized').removeClass('active');
        }
    }
    
    function closeAllWindows() {
        $('#desktop .window').remove();
        $('.navbar-button[data-window-id]').remove();
		
		if (isMobileDevice()) {
			updateAppDrawer();
		}
    }

    $('body').on('contextmenu', function(e) {
        e.preventDefault();
        const $target = $(e.target);
        const menu = $('#context-menu');
        $('#context-menu-copy, #context-menu-paste, #copy-paste-divider, #context-menu-minimize, #context-menu-maximize, #min-max-divider, #context-menu-close').hide();
        const isInsideWindow = $target.closest('.window').length > 0;
        const isDesktopBackground = $target.closest('#desktop').length > 0;
        const hasSelection = window.getSelection().toString().length > 0;
        const isEditable = $target.is('input, textarea') || $target.is('[contenteditable="true"]');
        let windowId = null;
        if (isInsideWindow) {
            windowId = $target.closest('.window').attr('id');
            menu.data('targetWindowId', windowId);
            $('#context-menu-close, #context-menu-minimize, #context-menu-maximize, #min-max-divider').show();
            positionMenu(e, menu);
            const $window = $('#' + windowId);
            if ($window.length && $window.data('maximized') === true) {
                $('#context-menu-maximize').text('Restore');
            } else {
                $('#context-menu-maximize').text('Maximize');
            }
        } else if (isDesktopBackground) {
            menu.data('targetWindowId', null);
            $('#context-menu-close-all').show();
            positionMenu(e, menu);
        } else {
            menu.hide();
            return;
        }
        if (hasSelection) {
            lastSelectedText = window.getSelection().toString();
            $('#context-menu-copy, #copy-paste-divider').show();
        }
        if (isEditable) {
            contextMenuTarget = e.target;
            $('#context-menu-paste, #copy-paste-divider').show();
        }
    });

    // Handle clicks on the context menu items
    $('#close-all-windows').on('click', function() {
        closeAllWindows();
        $('#context-menu').hide();
    });

    $('#context-menu-close').on('click', function() {
        const windowId = $('#context-menu').data('targetWindowId');
        if (windowId) { closeWindowById(windowId); }
        $('#context-menu').hide();
    });

    $('#context-menu-minimize').on('click', function() {
        const windowId = $('#context-menu').data('targetWindowId');
        if (windowId) { minimizeWindowById(windowId); }
        $('#context-menu').hide();
    });
    
    $('#context-menu-copy').on('click', function() {
        copySelection(lastSelectedText);
        $('#context-menu').hide();
        lastSelectedText = '';
    });

    $('#context-menu-paste').on('click', async function() {
        const pastedText = await pasteFromClipboard();
        if (pastedText && contextMenuTarget) {
            const $activeInput = $(contextMenuTarget);
            if ($activeInput.is('input, textarea')) {
                const currentText = $activeInput.val();
                const caretPos = $activeInput[0].selectionStart;
                const textBefore = currentText.substring(0, caretPos);
                const textAfter = currentText.substring(caretPos, currentText.length);
                $activeInput.val(textBefore + pastedText + textAfter);
                $activeInput[0].selectionStart = $activeInput[0].selectionEnd = caretPos + pastedText.length;
            } else if ($activeInput.is('[contenteditable="true"]')) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    selection.getRangeAt(0).insertNode(document.createTextNode(pastedText));
                }
            }
        }
        $('#context-menu').hide();
        contextMenuTarget = null;
    });
    
    $('#context-menu-maximize').on('click', function() {
        const windowId = $('#context-menu').data('targetWindowId');
        if (windowId) { maximizeWindow(windowId); }
        $('#context-menu').hide();
    });

    $('#context-menu-close-all').on('click', function() {
        closeAllWindows();
        $('#context-menu').hide();
    });
    
    $(document).on('click', function(e) {
        if (e.which === 1 && !$(e.target).closest('#context-menu').length) {
            $('#context-menu').hide();
        }
    });

    $('#navbar-close-all').on('click', function() {
        closeAllWindows();
    });
    
    function positionMenu(e, menu) {
        const x = e.clientX;
        const y = e.clientY;
        const winWidth = $(window).width();
        const winHeight = $(window).height();
        const menuWidth = menu.outerWidth();
        const menuHeight = menu.outerHeight();
        let finalX = x;
        let finalY = y;
        
        if (x + menuWidth > winWidth) {
            finalX = winWidth - menuWidth;
        }
        if (y + menuHeight > winHeight) {
            finalY = winHeight - menuHeight;
        }
        
        menu.css({
            top: finalY + 'px',
            left: finalX + 'px'
        }).show();
    }
    
    // --- Initial Page Load & Dynamic Sizing/Positioning ---
    // Start by setting the desktop height and creating the welcome window.
    setDesktopHeight();
	initializeDesktopIcons();
	
	// Check for a URL parameter immediately and open the window if found.
    const windowUrl = getQueryParameter('openwindow');
    if (windowUrl) {
        // The fix is here: we explicitly use 'window.desktopApps'
        const windowInfo = window.desktopApps.find(app => app.url === windowUrl);
        if (windowInfo) {
            createWindow(getUrlId(windowUrl), windowInfo.title, windowUrl, 'general', windowInfo.icon);
        }
    } else if (!isMobileDevice()) {
        createWindow('window-welcome', 'Welcome!', '/welcome/');
    }

    // Event listeners for window resizing and orientation changes.
    $(window).on('resize', function() {
        setDesktopHeight();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            $('.window').each(function() {
                const $window = $(this);
                if (isMobileDevice()) {
                    if ($window.data('ui-draggable')) { $window.draggable('destroy'); }
                    if ($window.data('ui-resizable')) { $window.resizable('destroy'); }
                } else {
                    if (!$window.data('ui-draggable')) {
                        $window.draggable({
                            handle: ".window-header",
                            containment: "#desktop",
                            start: function() { setActiveWindow($(this)); }
                        });
                    }
                    if (!$window.data('ui-resizable')) {
                        $window.resizable({
                            minHeight: 150,
                            minWidth: 250,
                            handles: "n, e, s, w, ne, se, sw, nw",
                            containment: "#desktop",
                            start: function() { setActiveWindow($(this)); }
                        });
                    }
                }
            });
        }, 250);
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', setDesktopHeight);
    }
    window.addEventListener('orientationchange', setDesktopHeight);
});