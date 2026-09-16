/**
 * Spatial Focus and D-Pad Navigation Engine for Tizen TV Remote Control
 */

class NavigationEngine {
    constructor() {
        this.currentView = 'main'; // 'main', 'detail', 'player'
        this.activeFocusIndex = 0;
        this.focusClass = 'focused';
        this.listeners = {};

        this.KEY_CODES = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            ENTER: 13,
            BACK: 10009,
            PLAY: 415,
            PAUSE: 19,
            PLAY_PAUSE: 10252,
            STOP: 413,
            FF: 417,
            REWIND: 412
        };

        this.init();
    }

    init() {
        this.registerTizenKeys();
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    registerTizenKeys() {
        try {
            if (window.tizen && window.tizen.tvinputdevice) {
                const keys = [
                    'MediaPlay', 'MediaPause', 'MediaStop', 'MediaFastForward', 'MediaRewind',
                    'MediaPlayPause', 'Caption', 'Extra'
                ];
                keys.forEach(key => {
                    try {
                        tizen.tvinputdevice.registerKey(key);
                    } catch (err) {
                        // Key register warning suppressed
                    }
                });
            }
        } catch (e) {
            console.log('[Navigation] Tizen inputdevice API not present.');
        }
    }

    setView(viewName) {
        this.currentView = viewName;
        this.updateFocusables();
    }

    getFocusables() {
        const containerSelector = this.currentView === 'detail' ? '#detail-modal' :
                                  this.currentView === 'player' ? '#player-container' : '#main-app';

        const container = document.querySelector(containerSelector) || document.body;
        return Array.from(container.querySelectorAll('.focusable:not([disabled]):not(.hidden)'))
            .filter(el => el.offsetParent !== null);
    }

    updateFocusables(defaultIndex = 0) {
        const focusables = this.getFocusables();
        if (focusables.length === 0) return;

        focusables.forEach(el => el.classList.remove(this.focusClass));

        if (defaultIndex >= focusables.length) {
            this.activeFocusIndex = 0;
        } else {
            this.activeFocusIndex = defaultIndex;
        }

        const target = focusables[this.activeFocusIndex];
        if (target) {
            target.classList.add(this.focusClass);
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }

    handleKeyDown(event) {
        const keyCode = event.keyCode;
        const focusables = this.getFocusables();

        if (this.currentView === 'player') {
            if (this.emit('playerKey', keyCode, event)) {
                return;
            }
        }

        switch (keyCode) {
            case this.KEY_CODES.LEFT:
                this.navigateDirection('left', focusables);
                event.preventDefault();
                break;
            case this.KEY_CODES.RIGHT:
                this.navigateDirection('right', focusables);
                event.preventDefault();
                break;
            case this.KEY_CODES.UP:
                this.navigateDirection('up', focusables);
                event.preventDefault();
                break;
            case this.KEY_CODES.DOWN:
                this.navigateDirection('down', focusables);
                event.preventDefault();
                break;
            case this.KEY_CODES.ENTER:
                if (focusables[this.activeFocusIndex]) {
                    focusables[this.activeFocusIndex].click();
                }
                event.preventDefault();
                break;
            case this.KEY_CODES.BACK:
                this.handleBackKey(event);
                break;
        }
    }

    navigateDirection(dir, focusables) {
        if (!focusables.length) return;

        const currentEl = focusables[this.activeFocusIndex];
        if (!currentEl) {
            this.updateFocusables(0);
            return;
        }

        const currentRect = currentEl.getBoundingClientRect();
        let bestCandidate = null;
        let bestDistance = Infinity;

        focusables.forEach((el, index) => {
            if (index === this.activeFocusIndex) return;

            const rect = el.getBoundingClientRect();
            let isCandidate = false;

            if (dir === 'left' && rect.right <= currentRect.left + 5) isCandidate = true;
            if (dir === 'right' && rect.left >= currentRect.right - 5) isCandidate = true;
            if (dir === 'up' && rect.bottom <= currentRect.top + 5) isCandidate = true;
            if (dir === 'down' && rect.top >= currentRect.bottom - 5) isCandidate = true;

            if (isCandidate) {
                const dx = (rect.left + rect.width / 2) - (currentRect.left + currentRect.width / 2);
                const dy = (rect.top + rect.height / 2) - (currentRect.top + currentRect.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCandidate = index;
                }
            }
        });

        if (bestCandidate !== null) {
            currentEl.classList.remove(this.focusClass);
            this.activeFocusIndex = bestCandidate;
            const newTarget = focusables[this.activeFocusIndex];
            newTarget.classList.add(this.focusClass);
            newTarget.focus();
            newTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }

    handleBackKey(event) {
        if (this.currentView === 'player') {
            this.emit('backFromPlayer');
            event.preventDefault();
        } else if (this.currentView === 'detail') {
            this.emit('closeDetail');
            event.preventDefault();
        } else {
            try {
                if (window.tizen && window.tizen.application) {
                    tizen.application.getCurrentApplication().exit();
                }
            } catch (err) {
                console.log('[Navigation] Exit app error:', err);
            }
        }
    }

    on(event, handler) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(handler);
    }

    emit(event, ...args) {
        if (this.listeners[event]) {
            let handled = false;
            this.listeners[event].forEach(handler => {
                if (handler(...args) === true) handled = true;
            });
            return handled;
        }
        return false;
    }
}

window.navEngine = new NavigationEngine();
