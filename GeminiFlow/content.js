/* GeminiFlow Content Script Orchestrator */

console.log("GeminiFlow Content Script Loaded");

class GeminiFlowOrchestrator {
  constructor() {
    this.ui = new window.GeminiFlowUI();
    this.db = window.GeminiFlowDB;
    this.dom = new window.GeminiFlowDOMActions();

    this.currentFlow = null;
    this.currentStepIndex = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.delayTimer = null;

    // Bind UI callbacks
    this.ui.callbacks.onStartFlow = this.startFlow.bind(this);
    this.ui.callbacks.onPauseFlow = this.pauseFlow.bind(this);
    this.ui.callbacks.onStopFlow = this.stopFlow.bind(this);
    this.ui.callbacks.onSkipStep = this.skipStep.bind(this);
  }

  async startFlow(flowId) {
    this.currentFlow = await this.db.getFlow(flowId);
    if (!this.currentFlow || !this.currentFlow.steps || this.currentFlow.steps.length === 0) {
      alert("Invalid flow or no steps found.");
      return;
    }

    this.currentStepIndex = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.ui.setRunningState(true);

    this.executeStep();
  }

  pauseFlow() {
    this.isPaused = !this.isPaused;
    this.ui.container.querySelector('#gf-pause-btn').innerText = this.isPaused ? "Resume" : "Pause";
    this.ui.updateStatus(this.isPaused ? "Paused" : "Running");
    if (!this.isPaused) {
      // If we resumed while waiting for delay, we should just let the timer finish or continue
      // For simplicity, we just unpause. The execution loop checks `this.isPaused`.
      // Further refinement: true resume logic
    }
  }

  stopFlow() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.delayTimer) clearTimeout(this.delayTimer);
    this.ui.setRunningState(false);
    this.ui.updateStatus("Stopped", "-", null);
    this.dom.stopDetection();
  }

  skipStep() {
    if (!this.isRunning) return;
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.currentStepIndex++;
      this.executeStep();
    } else {
      // If currently waiting for generation, stop detection and move on
      this.dom.stopDetection();
      this.currentStepIndex++;
      this.executeStep();
    }
  }

  async executeStep() {
    if (!this.isRunning) return;

    if (this.currentStepIndex >= this.currentFlow.steps.length) {
      this.ui.updateStatus("Flow Complete!", "-", null);
      this.ui.setRunningState(false);
      this.isRunning = false;
      return;
    }

    const step = this.currentFlow.steps[this.currentStepIndex];
    this.ui.updateStatus("Injecting Prompt", \`\${this.currentStepIndex + 1} of \${this.currentFlow.steps.length}\`, null);

    // 1. Process prompt for shortcodes
    let promptText = step.prompt;
    const shortcodeMatches = promptText.match(/@[a-zA-Z0-9_]+/g) || [];

    // Fetch assets from DB
    const assetsToInject = [];
    for (const code of shortcodeMatches) {
      const asset = await this.db.getAsset(code);
      if (asset) {
        assetsToInject.push(asset);
        promptText = promptText.replace(code, '').trim(); // Remove shortcode from text
      }
    }

    // 2. Inject text
    this.ui.updateStatus("Typing...", null, null);
    await this.dom.injectText(promptText);

    // 3. Inject images
    if (assetsToInject.length > 0) {
      this.ui.updateStatus("Injecting Images...", null, null);
      for (const asset of assetsToInject) {
         await this.dom.injectImage(asset.blob, asset.filename);
      }
    }

    // Wait if paused
    while (this.isPaused) {
      await new Promise(r => setTimeout(r, 1000));
      if (!this.isRunning) return;
    }

    // 4. Send
    this.ui.updateStatus("Sending...", null, null);
    await this.dom.clickSend();

    // 5. Wait for generation
    this.ui.updateStatus("Generating...", null, null);
    const success = await this.dom.waitForGeneration();
    if (!success) {
      if(!this.isRunning) return; // Stopped
      console.warn("Generation detection failed or timed out.");
    }

    // 6. Extract & Package
    this.ui.updateStatus("Extracting Images...", null, null);
    await this.extractAndPackageImages(this.currentStepIndex + 1);

    // 7. Delay before next step
    if (this.isRunning) {
      const delayMs = step.delay || 3000;
      await this.waitWithCountdown(delayMs);

      if (this.isRunning && !this.isPaused) {
        this.currentStepIndex++;
        this.executeStep();
      }
    }
  }

  async waitWithCountdown(ms) {
    let remaining = Math.ceil(ms / 1000);
    this.ui.updateStatus("Waiting...", null, remaining);

    return new Promise(resolve => {
      const tick = () => {
        if (!this.isRunning) {
          resolve();
          return;
        }
        if (this.isPaused) {
          setTimeout(tick, 1000);
          return;
        }

        remaining--;
        if (remaining <= 0) {
          this.ui.updateStatus("Waiting...", null, null);
          resolve();
        } else {
          this.ui.updateStatus("Waiting...", null, remaining);
          this.delayTimer = setTimeout(tick, 1000);
        }
      };
      this.delayTimer = setTimeout(tick, 1000);
    });
  }

  async extractAndPackageImages(stepNum) {
    // Look for the latest response container
    // Gemini often wraps responses in specific tags. We look for images in the most recent model-response.
    const messageContainers = document.querySelectorAll('message-content');
    if (messageContainers.length === 0) return;

    const lastContainer = messageContainers[messageContainers.length - 1];

    // Find images (ignoring avatars, icons)
    // Often generated images are in <img> tags with URLs from googleusercontent
    const imgEls = lastContainer.querySelectorAll('img');
    const imageUrls = [];

    imgEls.forEach(img => {
      const src = img.src;
      // Filter heuristic: googleusercontent and not small avatar
      if (src && src.includes('googleusercontent.com') && !src.includes('avatar')) {
        // Upscale: replace or append =s2048
        let hqSrc = src;
        if (hqSrc.includes('=')) {
          hqSrc = hqSrc.replace(/=s\d+.*$/, '=s2048');
        } else {
          hqSrc += '=s2048';
        }
        imageUrls.push(hqSrc);
      }
    });

    if (imageUrls.length === 0) {
      console.log("No generated images found in this step.");
      return;
    }

    this.ui.updateStatus(\`Downloading \${imageUrls.length} images...\`, null, null);

    const zip = new JSZip();

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      try {
        // Ask background script to fetch to bypass CORS
        const base64Data = await this.fetchImageViaBackground(url);
        if (base64Data) {
          // base64Data is in format "data:image/jpeg;base64,....."
          const base64 = base64Data.split(',')[1];
          zip.file(\`step\${stepNum}_image\${i+1}.jpg\`, base64, {base64: true});
        }
      } catch (err) {
        console.error("Failed to fetch image", url, err);
      }
    }

    this.ui.updateStatus("Zipping...", null, null);
    const zipBlob = await zip.generateAsync({type: "blob"});
    const objectUrl = URL.createObjectURL(zipBlob);

    // Trigger download directly from content script context using synthetic anchor
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = \`GeminiFlow_Step\${stepNum}.zip\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 10000);
  }

  fetchImageViaBackground(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "FETCH_IMAGE", url: url }, (response) => {
        if (response && response.success) {
          resolve(response.data); // data URL
        } else {
          reject(response ? response.error : "Unknown error in background fetch");
        }
      });
    });
  }
}

// Wait a brief moment to ensure DOM/DB are ready, then init
setTimeout(() => {
  if (typeof window.GeminiFlowDB !== 'undefined' && typeof window.GeminiFlowUI !== 'undefined') {
    window.GeminiFlowInstance = new GeminiFlowOrchestrator();
  }
}, 1000);
