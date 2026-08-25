// Tizen TV Remote Control and App Setup Manager

var STORAGE_KEY = 'dango_server_url';

document.addEventListener('DOMContentLoaded', function () {
    registerTizenKeys();
    initFocusManagement();
    checkSavedServer();
});

function registerTizenKeys() {
    try {
        if (window.tizen && window.tizen.tvinputdevice) {
            var keys = [
                'MediaPlay', 'MediaPause', 'MediaStop', 'MediaFastForward', 'MediaRewind',
                'MediaPlayPause', 'Caption', 'Extra'
            ];
            keys.forEach(function (keyName) {
                try {
                    tizen.tvinputdevice.registerKey(keyName);
                } catch (e) {
                    console.log('Failed to register key:', keyName, e);
                }
            });
        }
    } catch (err) {
        console.log('Tizen API not available or error registering keys:', err);
    }

    document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
    switch (e.keyCode) {
        case 10009: // Tizen TV Return / Back key
            handleBackKey(e);
            break;
        case 37: // Arrow Left
        case 38: // Arrow Up
        case 39: // Arrow Right
        case 40: // Arrow Down
            handleDirectionalNavigation(e.keyCode);
            break;
    }
}

function handleBackKey(e) {
    var webviewContainer = document.getElementById('webview-container');
    var setupContainer = document.getElementById('setup-container');

    if (!webviewContainer.classList.contains('hidden')) {
        // If webview is active, prompt or return to setup
        if (confirm('¿Deseas volver a la configuración del servidor?')) {
            webviewContainer.classList.add('hidden');
            setupContainer.classList.remove('hidden');
            document.getElementById('server-url').focus();
        }
    } else {
        try {
            if (window.tizen && window.tizen.application) {
                tizen.application.getCurrentApplication().exit();
            }
        } catch (err) {
            console.log('Exit app error:', err);
        }
    }
}

function handleDirectionalNavigation(keyCode) {
    var focusables = Array.from(document.querySelectorAll('.focusable'));
    var activeElement = document.activeElement;
    var currentIndex = focusables.indexOf(activeElement);

    if (currentIndex === -1) {
        if (focusables.length > 0) focusables[0].focus();
        return;
    }

    if (keyCode === 38 || keyCode === 37) { // Up or Left
        var prevIndex = (currentIndex - 1 + focusables.length) % focusables.length;
        focusables[prevIndex].focus();
    } else if (keyCode === 40 || keyCode === 39) { // Down or Right
        var nextIndex = (currentIndex + 1) % focusables.length;
        focusables[nextIndex].focus();
    }
}

function initFocusManagement() {
    var input = document.getElementById('server-url');
    if (input) {
        input.focus();
    }
}

function checkSavedServer() {
    var savedUrl = localStorage.getItem(STORAGE_KEY);
    if (savedUrl) {
        document.getElementById('server-url').value = savedUrl;
        connectToServer(savedUrl);
    }
}

function saveAndConnect(e) {
    if (e) e.preventDefault();
    var urlInput = document.getElementById('server-url').value.trim();

    if (!urlInput) {
        alert('Por favor ingresa una URL válida.');
        return;
    }

    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
        urlInput = 'http://' + urlInput;
    }

    localStorage.setItem(STORAGE_KEY, urlInput);
    connectToServer(urlInput);
}

function connectToServer(url) {
    var setupContainer = document.getElementById('setup-container');
    var webviewContainer = document.getElementById('webview-container');
    var frame = document.getElementById('dango-frame');

    frame.src = url;
    setupContainer.classList.add('hidden');
    webviewContainer.classList.remove('hidden');
}

function clearSettings() {
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('server-url').value = '';
    alert('Configuración restablecida.');
    document.getElementById('server-url').focus();
}
