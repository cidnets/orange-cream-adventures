console.log("windows.js has loaded");

$(document).ready(function() {
    // --- Global Variables ---
    let zIndexCounter = 1000;
    const breakpoint = 576; // Mobile breakpoint in pixels.
    let resizeTimer;
    let lastSelectedText = '';
    let contextMenuTarget = null;

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

    // --- Core Window/App Creation and Content Loading Functions ---
    // This is now the only function that creates a new window.
    function createWindow(windowId, title, url, type = 'general', windowIcon = '/assets/heart-basic.png') {
        const uniqueClassName = `window-${sanitizeForClass(title)}`;
        
        const windowHtml = `
            <div class="window ${type}-window ${uniqueClassName}" id="${windowId}" data-window-state="open" data-maximized="false">
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
        
        $newWindow.appendTo('#desktop');

        // Initialize jQuery UI behaviors.
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
        
        const navbarButtonHtml = `<button class="navbar-button" data-window-id="${windowId}"><img src="${windowIcon}" class="window-icon"><span class="window-title">${title}</span></button>`;
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
            }
            if (url === '/search/') {
                if (typeof window.loadPagefindScript === 'function' && typeof window.initializePagefindUI === 'function') {
                    await window.loadPagefindScript();
                    window.initializePagefindUI();
                }
            } else if ($(this).find('.gallery-container').length) {
                if (typeof initializeGalleryGrid === 'function' && typeof initializeLightbox === 'function') {
                    initializeGalleryGrid();
                    initializeLightbox();
                }
            }
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
        const desktopElement = document.getElementById('desktop');
        if (desktopElement) {
            let availableHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const finalDesktopHeight = availableHeight - navbarHeight;
            desktopElement.style.setProperty('--desktop-height', `${finalDesktopHeight}px`);
        }
    }

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
    
    // --- Event Handlers ---
    // App launcher click handler.
    $('body').on('click', '.app-launcher', function(e) {
        console.log("App launcher clicked!", this);
        e.preventDefault();
        const $this = $(this);
        const url = $this.data('url');
        const title = $this.data('title') || $this.text();
        const windowId = getUrlId(url);
        const $existingWindow = $('#' + windowId);

        if ($existingWindow.length) {
            console.log("Window already exists, activating it.");
            setActiveWindow($existingWindow);
        } else {
            console.log("Creating a new window...");
            createWindow(windowId, title, url);
            console.log("Attempted to create window with ID:", windowId);
        }
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
        
        if (windowTarget === 'current' && isWindowActive) {
            loadContentAndPositionWindow($activeWindow, href, finalWindowTitle, false);
        } else if ($existingWindow.length) {
            setActiveWindow($existingWindow);
        } else {
            createWindow(windowId, finalWindowTitle, href);
        }
    });

    // Window control buttons and navbar button click handlers.
    $('body').on('click', '.window-close, .window-minimize, .window-maximize, .mobile-back-button, .navbar-button', function() {
        const $this = $(this);
        if ($this.hasClass('window-close')) {
            const $window = $(this).closest('.window');
            const windowId = $window.attr('id');
            $(`.navbar-button[data-window-id="${windowId}"]`).remove();
            $window.remove();
        } else if ($this.hasClass('window-minimize')) {
            const $window = $(this).closest('.window');
            const windowId = $window.attr('id');
            $window.addClass('minimized');
            $window.removeClass('active');
            $window.attr('data-window-state', 'minimized');
            $(`.navbar-button[data-window-id="${windowId}"]`).addClass('minimized').removeClass('active');
        } else if ($this.hasClass('window-maximize')) {
            const $window = $(this).closest('.window');
            maximizeWindow($window.attr('id'));
        } else if ($this.hasClass('mobile-back-button')) {
             console.error("The mobile-back-button handler is not needed in this version of the script.");
        } else if ($this.hasClass('navbar-button')) {
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
    if (!isMobileDevice()) {
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