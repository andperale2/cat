window.onload = async function () {
    // Initialize focusable elements
    let focusableElements = document.querySelectorAll('.focusable');
    let currentIndex = 0;

    // Fetch real data
    await loadData();

    // Tizen TV Key Codes
    const tvKey = {
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39,
        ENTER: 13,
        RETURN: 10009 // Tizen back key
    };

    // Helper to add 'focused' class and remove from others
    function setFocus(index) {
        // Remove focused class from all
        focusableElements.forEach(el => el.classList.remove('focused'));

        // Add focused class to the current element
        if (focusableElements[index]) {
            focusableElements[index].classList.add('focused');
            // Scroll into view if needed (basic implementation)
            focusableElements[index].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
    }

    // Re-query focusable elements when DOM changes
    function updateFocusableElements() {
        focusableElements = document.querySelectorAll('.focusable');
    }

    // Load data from AnimeFLV and populate UI
    async function loadData() {
        try {
            document.getElementById('carousel-trending').innerHTML = 'Cargando...';
            document.getElementById('carousel-popular').innerHTML = 'Cargando...';

            const trending = await AnimeFLV.getTrendingShows();
            const latest = await AnimeFLV.getLatestEpisodes();

            renderCarousel('carousel-trending', trending.slice(0, 5));
            renderCarousel('carousel-popular', latest.slice(0, 5));

            // Setup focus again now that items exist
            updateFocusableElements();

            // Focus first item in menu by default if not set
            if (focusableElements.length > 0) {
                setFocus(currentIndex);
            }

        } catch (e) {
            console.error("Error loading data:", e);
            document.getElementById('carousel-trending').innerHTML = 'Error loading (CORS?)';
            document.getElementById('carousel-popular').innerHTML = 'Error loading (CORS?)';
        }
    }

    function renderCarousel(containerId, items) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear

        if (items.length === 0) {
            container.innerHTML = 'No data available';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item focusable';
            div.setAttribute('data-id', item.id);
            div.setAttribute('title', item.title); // For tooltip/accessibility

            if (item.poster) {
                div.style.backgroundImage = `url('${item.poster}')`;
                div.style.backgroundSize = 'cover';
                div.style.backgroundPosition = 'center';
            } else {
                div.innerHTML = `<div class="placeholder-poster">${item.title}</div>`;
            }

            container.appendChild(div);
        });
    }

    // Simplified spatial navigation logic
    function handleKeyDown(e) {
        const currentElement = focusableElements[currentIndex];
        const isMenu = currentElement.tagName.toLowerCase() === 'li';

        // Find elements grouped by rows/columns conceptually
        const menuItems = Array.from(document.querySelectorAll('.menu li'));
        const trendingItems = Array.from(document.querySelectorAll('#carousel-trending .item'));
        const popularItems = Array.from(document.querySelectorAll('#carousel-popular .item'));

        let newIndex = currentIndex;

        switch (e.keyCode) {
            case tvKey.RIGHT:
                if (isMenu) {
                    // Move from menu to trending carousel first item
                    if(trendingItems.length > 0) newIndex = Array.from(focusableElements).indexOf(trendingItems[0]);
                } else if (trendingItems.includes(currentElement)) {
                    // Move right in trending
                    let idx = trendingItems.indexOf(currentElement);
                    if (idx < trendingItems.length - 1) {
                        newIndex = Array.from(focusableElements).indexOf(trendingItems[idx + 1]);
                    }
                } else if (popularItems.includes(currentElement)) {
                    // Move right in popular
                    let idx = popularItems.indexOf(currentElement);
                    if (idx < popularItems.length - 1) {
                        newIndex = Array.from(focusableElements).indexOf(popularItems[idx + 1]);
                    }
                }
                break;

            case tvKey.LEFT:
                if (trendingItems.includes(currentElement)) {
                    // Move left in trending
                    let idx = trendingItems.indexOf(currentElement);
                    if (idx > 0) {
                        newIndex = Array.from(focusableElements).indexOf(trendingItems[idx - 1]);
                    } else {
                        // Go back to menu
                        newIndex = Array.from(focusableElements).indexOf(menuItems[0]); // Go to first menu item as fallback, or save last menu position
                    }
                } else if (popularItems.includes(currentElement)) {
                    // Move left in popular
                    let idx = popularItems.indexOf(currentElement);
                    if (idx > 0) {
                        newIndex = Array.from(focusableElements).indexOf(popularItems[idx - 1]);
                    } else {
                        // Go back to menu
                        newIndex = Array.from(focusableElements).indexOf(menuItems[0]);
                    }
                }
                break;

            case tvKey.DOWN:
                if (isMenu) {
                    let idx = menuItems.indexOf(currentElement);
                    if (idx < menuItems.length - 1) {
                        newIndex = Array.from(focusableElements).indexOf(menuItems[idx + 1]);
                    }
                } else if (trendingItems.includes(currentElement)) {
                    // Move from trending to popular, keep roughly same column
                    let idx = trendingItems.indexOf(currentElement);
                    let targetIdx = Math.min(idx, popularItems.length - 1);
                    if (popularItems.length > 0) newIndex = Array.from(focusableElements).indexOf(popularItems[targetIdx]);
                }
                break;

            case tvKey.UP:
                if (isMenu) {
                    let idx = menuItems.indexOf(currentElement);
                    if (idx > 0) {
                        newIndex = Array.from(focusableElements).indexOf(menuItems[idx - 1]);
                    }
                } else if (popularItems.includes(currentElement)) {
                    // Move from popular to trending
                    let idx = popularItems.indexOf(currentElement);
                    let targetIdx = Math.min(idx, trendingItems.length - 1);
                    if(trendingItems.length > 0) newIndex = Array.from(focusableElements).indexOf(trendingItems[targetIdx]);
                }
                break;

            case tvKey.ENTER:
                // Handle Enter press
                console.log("Enter pressed on:", currentElement);
                if (isMenu) {
                    document.getElementById('page-title').innerText = currentElement.innerText;
                } else {
                    alert("Selected item ID: " + currentElement.getAttribute('data-id'));
                }
                break;

            case tvKey.RETURN:
                // Exit app on Tizen TV when return is pressed on main screen
                try {
                    tizen.application.getCurrentApplication().exit();
                } catch (error) {
                    console.log('Not running on Tizen device or tizen API not available');
                }
                break;
        }

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < focusableElements.length) {
            currentIndex = newIndex;
            setFocus(currentIndex);
            e.preventDefault(); // Prevent default scrolling behavior
        }
    }

    // Attach event listener for TV remote keys
    document.addEventListener('keydown', handleKeyDown);
};
