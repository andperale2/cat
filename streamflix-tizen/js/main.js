window.onload = function () {
    // Initialize focusable elements
    const focusableElements = document.querySelectorAll('.focusable');
    let currentIndex = 0;

    // Set initial focus
    if (focusableElements.length > 0) {
        setFocus(currentIndex);
    }

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
                    newIndex = Array.from(focusableElements).indexOf(trendingItems[0]);
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
                    newIndex = Array.from(focusableElements).indexOf(popularItems[targetIdx]);
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
                    newIndex = Array.from(focusableElements).indexOf(trendingItems[targetIdx]);
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
