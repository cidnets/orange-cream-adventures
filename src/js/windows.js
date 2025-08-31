$(document).ready(function() {
    // --- Global Variables ---
    let zIndexCounter = 1000;
    const breakpoint = 576; // Mobile breakpoint
    let resizeTimer;
    let lastSelectedText = '';
    let contextMenuTarget = null;

    // --- Helper Functions ---
    function isMobileDevice() {
        const hasTouchEvents = ('ontouchstart' in window);
        const hasMaxTouchPoints = (navigator.maxTouchPoints > 0);
        return hasTouchEvents || hasMaxTouchPoints;
    }

    function isSmallScreen() {
        return $(window).width() <= breakpoint;
    }

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

    // --- NEW: Function to set the active window (MOVED HERE) ---
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

    // --- Welcome Window Function ---
    function createWelcomeWindow() {
        const windowId = 'window-welcome';
        const title = 'Welcome!';
        const url = '/welcome/';
        createWindow(windowId, title, url);
    }
    createWelcomeWindow();
    
    // --- Initial Page Load Logic ---
    function setDesktopHeight() {
        const navbarHeightValue = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height');
        const navbarHeight = parseFloat(navbarHeightValue) || 0;
        const desktopElement = document.getElementById('desktop');

        if (desktopElement) {
            let availableHeight;
            if (window.visualViewport) {
                availableHeight = window.visualViewport.height;
            } else {
                availableHeight = window.innerHeight;
            }
            const finalDesktopHeight = availableHeight - navbarHeight;
            desktopElement.style.setProperty('--desktop-height', `${finalDesktopHeight}px`);
        }
    }

    // --- New Clipboard Helper Functions ---
    function copySelection(textToCopy) {
        if (textToCopy.length > 0) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    console.log('Text successfully copied to clipboard!');
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        } else {
            console.warn('No text is currently selected to copy.');
        }
    }

    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            console.log('Text successfully pasted from clipboard:', text);
            return text;
        } catch (err) {
            console.error('Could not paste text: ', err);
            return null;
        }
    }

    // --- Initialization and Event Listeners ---
    setDesktopHeight();

    $(window).on('resize', function() {
        setDesktopHeight();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            $('.window').each(function() {
                const $window = $(this);
                if (isSmallScreen()) {
                    $window.css({ 'width': '', 'height': '', 'top': '', 'left': '' });
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

    // --- Window Content Loading ---
    async function loadContentAndPositionWindow($window, url, title, isInitialLoad = true) {
		const $windowContent = $window.find('.window-content');
		const $windowBody = $window.find('.window-body');

        $windowContent.html('<p>Loading...</p>');
		if (title) {
			$window.find('.window-title').text(title);
			const windowId = $window.attr('id');
			$(`.navbar-button[data-window-id="${windowId}"]`).text(title);
		}

       if (!isSmallScreen()) {
			// Set a wide width to allow the browser to calculate the content's natural width
			$window.css({ 'opacity': 0, 'position': 'absolute', 'width': '10000px', 'height': 'auto' });
		}

        $windowContent.load(url + ' #page-content', async function(response, status, xhr) {
            if (status === "error") {
                $(this).html(`
                    <div class="error-content">
                        <p>Sorry, an error occurred loading this content: ${xhr.status} ${xhr.statusText}.</p>
                        <button class="reload-content-button" data-url="${url}" data-title="${title}">Try Again</button>
                    </div>
                `);
                $(this).find('.reload-content-button').on('click', function() {
                    const reloadUrl = $(this).data('url');
                    const reloadTitle = $(this).data('title');
                    loadContentAndPositionWindow($window, reloadUrl, reloadTitle, false);
                });
            }

            if (url.includes('/gemini/zeta/')) {
                const geminiAppContainer = $(this).find('.gemini-app-container')[0];
                if (geminiAppContainer && typeof window.initializeGeminiChat === 'function') {
                    console.log("Found Gemini app container. Initializing chat...");
                    window.initializeGeminiChat(geminiAppContainer);
                } else {
                    console.warn("Gemini app container not found or initializeGeminiChat function missing.", geminiAppContainer, typeof window.initializeGeminiChat);
                }
            }

            if (url === '/search/') {
                try {
                    await loadPagefindScript();
                    initializePagefindUI();
                } catch (e) {
                    console.error('Failed to load Pagefind script:', e);
                }
            }
            
            if (status === "success") {
                if ($(this).find('.gallery-container').length) {
                    if (typeof window.initializeGalleryGrid === 'function') {
                        initializeGalleryGrid();
                    }
                    if (typeof window.initializeLightbox === 'function') {
                        initializeLightbox();
                    }
                    console.log("Gallery and Lightbox initialized!");
                }
            }
            
            // After content is loaded and any images are loaded, call the sizing function.
			const contentImages = $window.find('img');
			if (contentImages.length) {
				let imagesLoaded = 0;
				contentImages.each(function() {
					$(this).on('load', function() {
						imagesLoaded++;
						if (imagesLoaded === contentImages.length) {
							applyDynamicSizingAndPositioning($window); // Pass the window element
						}
					});
					if (this.complete) {
						imagesLoaded++;
						if (imagesLoaded === contentImages.length) {
							applyDynamicSizingAndPositioning($window);
						}
					}
				});
			} else {
				// If there are no images, just apply the sizing immediately.
				applyDynamicSizingAndPositioning($window); // Pass the window element
			}

			function applyDynamicSizingAndPositioning($window) {
				// These min and max values are important for the window's behavior
				const minDynamicWidth = 250; 
				const minDynamicHeight = 150;
				
				// Get desktop dimensions to set the max size
				const desktopWidth = $('#desktop').width();
				const desktopHeight = $('#desktop').height();
				const padding = 20;
				const maxDesktopFitWidth = desktopWidth - (padding * 2);
				const maxDesktopFitHeight = desktopHeight - (padding * 2);

				// Create a temporary, invisible container
				const $tempContainer = $('<div></div>')
					.css({
						'position': 'absolute',
						'visibility': 'hidden',
						'height': 'auto'
					})
					.appendTo('body');
				
				// Clone the content and append it to the temp container
				const $clonedContent = $window.find('.window-content').clone();
				$clonedContent.appendTo($tempContainer);
				
				// Ensure the content wraps naturally by giving the temp container a width
				// This is the key to fixing the scrollWidth issue
				$tempContainer.css('width', Math.min(desktopWidth / 2, 700) + 'px');

				const naturalContentWidth = $tempContainer.outerWidth();
				const naturalContentHeight = $tempContainer.outerHeight();
				
				$tempContainer.remove();

				// The rest of the logic remains the same
				let baseCalculatedWidth = Math.max(naturalContentWidth, minDynamicWidth);
				let baseCalculatedHeight = Math.max(naturalContentHeight, minDynamicHeight);
				
				let finalCalculatedWidth = Math.min(baseCalculatedWidth, maxDesktopFitWidth);
				let finalCalculatedHeight = Math.min(baseCalculatedHeight, maxDesktopFitHeight);
				
				if ($window.data('ui-resizable')) {
					const resizableMinHeight = $window.resizable("option", "minHeight");
					const resizableMinWidth = $window.resizable("option", "minWidth");
					finalCalculatedWidth = Math.max(finalCalculatedWidth, resizableMinWidth);
					finalCalculatedHeight = Math.max(finalCalculatedHeight, resizableMinHeight);
				}

				$window.css('width', finalCalculatedWidth + 'px');
				$window.css('height', finalCalculatedHeight + 'px');

				const centerX = (desktopWidth / 2) - (finalCalculatedWidth / 2);
				const centerY = (desktopHeight / 2) - (finalCalculatedHeight / 2);

				$window.css({ 'top': centerY + 'px', 'left': centerX + 'px', 'opacity': 1 });
				setActiveWindow($window);
			}
        });
        
    }
    
    // --- Link Click Handling ---
    // Universal ID generation function
    function getUrlId(url) {
        const normalizedUrl = url.split('#')[0].replace(/\/$/, '');
        return 'window-' + btoa(normalizedUrl).replace(/=/g, '');
    }
    
    // --- Specific ID for blog posts
    const blogPostWindowId = 'window-blog-post';

    $('body').on('click', '.app-launcher', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const $this = $(this);
        const url = $this.data('url');
        const title = $this.data('title') || $this.text();
        const windowId = getUrlId(url);
        const $existingWindow = $('#' + windowId);

        if ($existingWindow.length) {
            setActiveWindow($existingWindow);
        } else {
            createWindow(windowId, title, url);
        }
    });

    $('body').on('click', 'a', function(e) {
        const $this = $(this);
        const href = $this.attr('href');
        const windowTarget = $this.data('window-target');
        
        if (!href) { return true; }

        // Combine all conditions into a single check
        const shouldBeHandledByWindowSystem = !($this.attr('target') === '_blank' ||
            $this.data('open-new-tab') === true ||
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('javascript:') ||
            $this.data('no-window') ||
            $this.hasClass('custom-lightbox-trigger'));

        if (!shouldBeHandledByWindowSystem) {
            return true;
        }

        e.preventDefault();
        e.stopPropagation();
        
        const isPostLink = href.startsWith('/posts/');
        
        // NEW FIX: Special handling for all blog post links
        if (isPostLink) {
            const $existingBlogPostWindow = $('#' + blogPostWindowId);
            if ($existingBlogPostWindow.length) {
                loadContentAndPositionWindow($existingBlogPostWindow, href, "Blog Post", false);
                setActiveWindow($existingBlogPostWindow);
            } else {
                createWindow(blogPostWindowId, "Blog Post", href, 'post');
            }
            return; // Exit the function after handling blog posts
        }

        // Existing logic for other links remains the same
        const windowId = getUrlId(href);
        const $existingWindow = $('#' + windowId);
        const $activeWindow = $('.window.active');
        const isWindowActive = $activeWindow.length > 0;
        
        let originalLinkTitle = $this.data('title') || $this.text() || 'New Window';
        let finalWindowTitle = originalLinkTitle;

        if (windowTarget === 'current' && isWindowActive) {
            loadContentAndPositionWindow($activeWindow, href, finalWindowTitle, false);
        } else if ($existingWindow.length) {
            setActiveWindow($existingWindow);
        } else {
            createWindow(windowId, finalWindowTitle, href);
        }
    });

    // --- NEW: Window Creation Function ---
    function createWindow(windowId, title, url, type = 'general', windowIcon = '/assets/heart-basic.png') {
        const sanitizedTitle = title.toLowerCase().replace(/\s/g, '-');
        const windowClass = `window-${sanitizedTitle}`;
        const minWidthValue = 100; // Define a flexible minimum width here

        const windowHtml = `
            <div class="window ${type}-window ${windowClass}" id="${windowId}" data-window-state="open" data-maximized="false">
                <div class="window-header">
                    <img src="${windowIcon}" class="window-icon">
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

        if (!isSmallScreen()) {
            $newWindow.css({ 'opacity': 0, 'position': 'absolute', 'width': 'auto', 'height': 'auto' });
            
            $newWindow.draggable({
                handle: ".window-header",
                containment: "#desktop",
                start: function() { setActiveWindow($(this)); }
            });
            $newWindow.resizable({
                minHeight: 150,
                // minWidth: minWidthValue, // Use the new variable here
                handles: "n, e, s, w, ne, se, sw, nw",
                containment: "#desktop",
                start: function() { setActiveWindow($(this)); }
            });
        } else {
            $newWindow.css({ 'opacity': 0, 'position': 'absolute' });
        }

        $newWindow.appendTo('#desktop');
        loadContentAndPositionWindow($newWindow, url, title, true);

        const navbarButtonHtml = `<button class="navbar-button" data-window-id="${windowId}"><img src="${windowIcon}" class="window-icon"><span class="window-title">${title}</span></button>`;
        $(navbarButtonHtml).insertAfter('#navbar .start-divider');
        
        $newWindow.on('mousedown', function() { setActiveWindow($(this)); });
    }
    
    // --- Window Controls ---
    $('body').on('click', '.window-close', function() {
        const $window = $(this).closest('.window');
        const windowId = $window.attr('id');
        $(`.navbar-button[data-window-id="${windowId}"]`).remove();
        $window.remove();
    });

    $('body').on('click', '.window-minimize', function() {
        const $window = $(this).closest('.window');
        const windowId = $window.attr('id');
        $window.addClass('minimized');
        $window.removeClass('active');
        $window.attr('data-window-state', 'minimized');
        $(`.navbar-button[data-window-id="${windowId}"]`).addClass('minimized').removeClass('active');
    });

    // --- New Maximize Button Click Handler ---
    $('body').on('click', '.window-maximize', function() {
        const $window = $(this).closest('.window');
        const windowId = $window.attr('id');
        maximizeWindow(windowId);
    });
    
    $('body').off('click', '.navbar-button').on('click', '.navbar-button', function() {
        const windowId = $(this).data('window-id');
        const $targetWindow = $('#' + windowId);

        if ($targetWindow.length) {
            if ($targetWindow.attr('data-window-state') === 'minimized') {
                setActiveWindow($targetWindow);
            } else if ($targetWindow.attr('data-window-state') === 'open' && $targetWindow.hasClass('active')) {
                $targetWindow.addClass('minimized');
                $targetWindow.removeClass('active');
                $targetWindow.attr('data-window-state', 'minimized');
                $(this).removeClass('active').addClass('minimized');
            } else {
                setActiveWindow($targetWindow);
            }
        }
    });
    
    // --- Context Menu and Close All Windows Functions ---
    function closeWindowById(windowId) {
        $('#' + windowId).remove();
        $(`.navbar-button[data-window-id="${windowId}"]`).remove();
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
    }
    
    // --- New Maximize/Restore Function ---
    function maximizeWindow(windowId) {
        const $window = $('#' + windowId);
        if (!$window.length) return;

        const isMaximized = $window.data('maximized') === true;

        if (!isMaximized) {
            // Save current position and size
            $window.data('originalPosition', $window.position());
            $window.data('originalSize', {
                width: $window.width(),
                height: $window.height()
            });

            // Set to maximized state
            $window.addClass('maximized');
            $window.css({
                top: '0',
                left: '0',
                width: '100%',
                height: '100%'
            });

            // Disable dragging and resizing
            if ($window.data('ui-draggable')) { $window.draggable('disable'); }
            if ($window.data('ui-resizable')) { $window.resizable('disable'); }
            $window.find('.window-maximize').text('❐'); // Change button to restore icon
            $window.data('maximized', true);
        } else {
            // Restore original position and size
            const originalPosition = $window.data('originalPosition');
            const originalSize = $window.data('originalSize');

            $window.removeClass('maximized');
            $window.css({
                top: originalPosition.top + 'px',
                left: originalPosition.left + 'px',
                width: originalSize.width + 'px',
                height: originalSize.height + 'px'
            });

            // Re-enable dragging and resizing
            if ($window.data('ui-draggable')) { $window.draggable('enable'); }
            if ($window.data('ui-resizable')) { $window.resizable('enable'); }
            $window.find('.window-maximize').text('◻'); // Change button back to maximize icon
            $window.data('maximized', false);
        }
    }
    
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
    
    // Right-click event listener for the context menu
    $('body').on('contextmenu', function(e) {
        e.preventDefault();
        const $target = $(e.target);
        const menu = $('#context-menu');

        // Default to hiding all options first
        $('#context-menu-copy, #context-menu-paste, #copy-paste-divider, #context-menu-minimize, #context-menu-maximize, #min-max-divider, #context-menu-close').hide();

        const isInsideWindow = $target.closest('.window').length > 0;
        const isDesktopBackground = $target.closest('#desktop').length > 0;
        const hasSelection = window.getSelection().toString().length > 0;
        const isEditable = $target.is('input, textarea') || $target.is('[contenteditable="true"]');

        let windowId = null;

        // First, determine if the right-click is inside a window or on the desktop background
        if (isInsideWindow) {
            windowId = $target.closest('.window').attr('id');
            menu.data('targetWindowId', windowId);
            $('#context-menu-close, #context-menu-minimize, #context-menu-maximize, #min-max-divider').show();
            positionMenu(e, menu);
            // Update the Maximize/Restore text
            const $window = $('#' + windowId);
            if ($window.length && $window.data('maximized') === true) {
                $('#context-menu-maximize').text('Minimize');
            } else {
                $('#context-menu-maximize').text('Maximize');
            }
        } else if (isDesktopBackground) {
            menu.data('targetWindowId', null);
            $('#context-menu-close-all').show();
            positionMenu(e, menu);
        } else {
            // Hide the menu if the click is not on a window or the desktop
            menu.hide();
            return;
        }

        // Independently check for copy/paste conditions and their divider
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
    
    // --- New Copy/Paste Handlers ---
    $('#context-menu-copy').on('click', function() {
        copySelection(lastSelectedText);
        $('#context-menu').hide();
        lastSelectedText = ''; // Clear the variable
    });

    // --- New Copy/Paste Handlers ---
    $('#context-menu-paste').on('click', async function() {
        const pastedText = await pasteFromClipboard();
        if (pastedText) {
            // Use the captured element as the target for pasting
            const $activeInput = $(contextMenuTarget);
            
            if ($activeInput.is('input, textarea')) {
                // Logic for input and textarea fields
                const currentText = $activeInput.val();
                const caretPos = $activeInput[0].selectionStart;
                const textBefore = currentText.substring(0, caretPos);
                const textAfter = currentText.substring(caretPos, currentText.length);
                $activeInput.val(textBefore + pastedText + textAfter);
                $activeInput[0].selectionStart = $activeInput[0].selectionEnd = caretPos + pastedText.length;
            } else if ($activeInput.is('[contenteditable="true"]')) {
                // Logic for content-editable divs
                $activeInput.append(pastedText);
            }
        }
        $('#context-menu').hide();
        contextMenuTarget = null; // Clear the variable after use
    });
    
    // New context menu handler for maximize
    $('#context-menu-maximize').on('click', function() {
        const windowId = $('#context-menu').data('targetWindowId');
        if (windowId) { maximizeWindow(windowId); }
        $('#context-menu').hide();
    });

    $('#context-menu-close-all').on('click', function() {
        closeAllWindows();
        $('#context-menu').hide();
    });
    
    // Hide the context menu if a user clicks anywhere else
    $(document).on('click', function(e) {
        if (e.which === 1) {
            if (!$(e.target).closest('#context-menu').length) {
                $('#context-menu').hide();
            }
        }
    });
    
    // Additional event listener for the "Close All Windows" button in the navbar
    $('#navbar-close-all').on('click', function() {
        closeAllWindows();
    });
});