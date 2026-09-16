/**
 * Hybrid Video Player: Uses Samsung Tizen AVPlay API when available,
 * with standard HTML5 <video> / hls.js fallback for web browser testing.
 */

class HybridPlayer {
    constructor() {
        this.videoElement = null;
        this.hls = null;
        this.isAvplay = false;
        this.isPlaying = false;
        this.duration = 0;
        this.currentTime = 0;
        this.controlsTimeout = null;

        this.init();
    }

    init() {
        this.videoElement = document.getElementById('html5-video');
        this.isAvplay = typeof webapis !== 'undefined' && typeof webapis.avplay !== 'undefined';
        console.log(`[Player] Initialized. Mode: ${this.isAvplay ? 'Tizen AVPlay' : 'HTML5 / HLS.js'}`);

        if (window.navEngine) {
            window.navEngine.on('playerKey', (keyCode, event) => this.handleKey(keyCode, event));
        }
    }

    playStream(url, title = 'Video') {
        document.getElementById('player-title').textContent = title;
        document.getElementById('player-container').classList.remove('hidden');
        this.showControls();

        if (this.isAvplay) {
            this.playWithAvplay(url);
        } else {
            this.playWithHTML5(url);
        }
    }

    playWithAvplay(url) {
        try {
            webapis.avplay.open(url);
            webapis.avplay.setDisplayRect(0, 0, window.innerWidth, window.innerHeight);
            webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');

            const listener = {
                onbufferingstart: () => this.setStatus('Cargando...'),
                onbufferingprogress: (percent) => this.setStatus(`Cargando (${percent}%)...`),
                onbufferingcomplete: () => this.setStatus(''),
                oncurrentplaytime: (time) => {
                    this.currentTime = time / 1000;
                    this.updateProgress();
                },
                onevent: (type, data) => console.log('[AVPlay] Event:', type, data),
                onerror: (error) => console.error('[AVPlay] Error:', error),
                onstreamcompleted: () => this.close()
            };

            webapis.avplay.setListener(listener);
            webapis.avplay.prepareAsync(() => {
                this.duration = webapis.avplay.getDuration() / 1000;
                webapis.avplay.play();
                this.isPlaying = true;
                this.updatePlayPauseButton();
            }, (err) => {
                console.error('[AVPlay] Prepare error, falling back to HTML5:', err);
                this.playWithHTML5(url);
            });
        } catch (e) {
            console.error('[AVPlay] Open error, falling back to HTML5:', e);
            this.playWithHTML5(url);
        }
    }

    playWithHTML5(url) {
        this.videoElement.classList.remove('hidden');

        if (window.Hls && Hls.isSupported()) {
            if (this.hls) {
                this.hls.destroy();
            }
            this.hls = new Hls();
            this.hls.loadSource(url);
            this.hls.attachMedia(this.videoElement);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.videoElement.play();
                this.isPlaying = true;
                this.updatePlayPauseButton();
            });
        } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoElement.src = url;
            this.videoElement.play();
            this.isPlaying = true;
            this.updatePlayPauseButton();
        } else {
            this.videoElement.src = url;
            this.videoElement.play();
            this.isPlaying = true;
            this.updatePlayPauseButton();
        }

        this.videoElement.ontimeupdate = () => {
            this.currentTime = this.videoElement.currentTime;
            this.duration = this.videoElement.duration || 0;
            this.updateProgress();
        };

        this.videoElement.onended = () => this.close();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.isAvplay) {
            try { webapis.avplay.play(); } catch(e){}
        } else if (this.videoElement) {
            this.videoElement.play();
        }
        this.isPlaying = true;
        this.updatePlayPauseButton();
    }

    pause() {
        if (this.isAvplay) {
            try { webapis.avplay.pause(); } catch(e){}
        } else if (this.videoElement) {
            this.videoElement.pause();
        }
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    seek(seconds) {
        let newTime = this.currentTime + seconds;
        if (newTime < 0) newTime = 0;
        if (this.duration && newTime > this.duration) newTime = this.duration;

        if (this.isAvplay) {
            try { webapis.avplay.seekTo(newTime * 1000); } catch(e){}
        } else if (this.videoElement) {
            this.videoElement.currentTime = newTime;
        }
        this.currentTime = newTime;
        this.updateProgress();
        this.showControls();
    }

    close() {
        if (this.isAvplay) {
            try {
                webapis.avplay.stop();
                webapis.avplay.close();
            } catch(e){}
        } else if (this.videoElement) {
            this.videoElement.pause();
            if (this.hls) {
                this.hls.destroy();
                this.hls = null;
            }
            this.videoElement.classList.add('hidden');
        }

        document.getElementById('player-container').classList.add('hidden');
        this.isPlaying = false;
        if (window.navEngine) {
            window.navEngine.setView('main');
        }
    }

    handleKey(keyCode, event) {
        this.showControls();
        const keys = window.navEngine ? window.navEngine.KEY_CODES : {};

        switch (keyCode) {
            case keys.ENTER:
            case keys.PLAY_PAUSE:
                this.togglePlayPause();
                return true;
            case keys.PLAY:
                this.play();
                return true;
            case keys.PAUSE:
                this.pause();
                return true;
            case keys.STOP:
                this.close();
                return true;
            case keys.RIGHT:
            case keys.FF:
                this.seek(10);
                return true;
            case keys.LEFT:
            case keys.REWIND:
                this.seek(-10);
                return true;
            case keys.BACK:
                this.close();
                return true;
        }
        return false;
    }

    updateProgress() {
        const progressBar = document.getElementById('player-progress-bar');
        const timeDisplay = document.getElementById('player-time');

        if (this.duration > 0) {
            const percent = (this.currentTime / this.duration) * 100;
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (timeDisplay) {
                timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;
            }
        } else if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(this.currentTime);
        }
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('btn-play-pause');
        if (btn) {
            btn.textContent = this.isPlaying ? '❚❚ Pausa' : '► Reproducir';
        }
    }

    setStatus(text) {
        const statusEl = document.getElementById('player-status');
        if (statusEl) statusEl.textContent = text;
    }

    showControls() {
        const controls = document.getElementById('player-controls');
        if (controls) controls.classList.remove('fade-out');

        clearTimeout(this.controlsTimeout);
        this.controlsTimeout = setTimeout(() => {
            if (this.isPlaying && controls) {
                controls.classList.add('fade-out');
            }
        }, 4000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

window.player = new HybridPlayer();
