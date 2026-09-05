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

    // Sequence session storage
    this.sequenceAssets = [];
    this.sequencePrompts = [];

    // Bind UI callbacks
    this.ui.callbacks.onStartFlow = this.startFlow.bind(this);
    this.ui.callbacks.onPauseFlow = this.pauseFlow.bind(this);
    this.ui.callbacks.onStopFlow = this.stopFlow.bind(this);
    this.ui.callbacks.onSkipStep = this.skipStep.bind(this);
  }

  async startFlow(flowId) {
    this.currentFlow = await this.db.getFlow(flowId);
    if (!this.currentFlow || !this.currentFlow.steps || this.currentFlow.steps.length === 0) {
      this.ui.logTerm("ERR: Invalid sequence or empty timeline", "err");
      return;
    }

    this.currentStepIndex = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.sequenceAssets = [];
    this.sequencePrompts = [];
    this.ui.setRunningState(true);

    this.ui.logTerm(`SYS: Engine Start -> ${this.currentFlow.name}`, "sys");
    this.executeStep();
  }

  pauseFlow() {
    this.isPaused = !this.isPaused;
    const btn = this.ui.shadow.querySelector('#gf-pause-btn');
    btn.innerText = this.isPaused ? "RESUME" : "HOLD";
    btn.style.background = this.isPaused ? "rgba(255, 158, 69, 0.2)" : "transparent";

    this.ui.logTerm(`SYS: Engine ${this.isPaused ? 'Holding...' : 'Resumed'}`, "warn");
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
    this.ui.logTerm("SYS: Sequence Aborted", "err");
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
      this.ui.logTerm("SYS: MASTER SEQUENCE COMPLETE", "sys");
      await this.packageFullSequence();
      this.ui.setRunningState(false);
      this.isRunning = false;
      return;
    }

    const step = this.currentFlow.steps[this.currentStepIndex];
    this.ui.updateTracker(this.currentStepIndex, this.currentFlow.steps.length, "RUNNING");
    this.ui.logTerm(`[CLIP ${this.currentStepIndex+1}] Loading into engine buffer...`);

    // 1. Process prompt for shortcodes and inject Anti-Mutation Protocol
    let promptText = step.prompt;

    // Inject Anatomical Guardrails non-negotiable anchors
    const antiMutationStr = " Avoid: extra arms, third leg, floating limbs, duplicate head, fused hands, distorted spine, unnatural joints, anatomical glitches. Maintain static composed stance, feet planted on ground for all secondary characters.";
    if (!promptText.includes("extra arms")) {
      promptText += antiMutationStr;
    }

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
    this.ui.logTerm(`[CLIP ${this.currentStepIndex+1}] Injecting screenplay data...`);
    await this.dom.injectText(promptText);

    // 3. Inject images
    if (assetsToInject.length > 0) {
      this.ui.logTerm(`[CLIP ${this.currentStepIndex+1}] Injecting ${assetsToInject.length} visual keyframes...`);
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
    this.ui.logTerm(`[CLIP ${this.currentStepIndex+1}] Engaging Neural Network...`);
    await this.dom.clickSend();

    // 5. Wait for generation
    this.ui.logTerm(`[CLIP ${this.currentStepIndex+1}] Awaiting frame generation...`);
    const success = await this.dom.waitForGeneration();
    if (!success) {
      if(!this.isRunning) return; // Stopped
      this.ui.logTerm(`ERR: Generation Timeout`, "err");
    } else {
      this.ui.logTerm(`[CLIP ${this.currentStepIndex+1}] Generation Complete.`, "sys");
    }

    // 6. Extract & Queue Image
    this.ui.updateTracker(this.currentStepIndex, this.currentFlow.steps.length, "ZIPPING");
    this.ui.logTerm(`[CLIP ${this.currentStepIndex+1}] Extracting Master Plates...`);
    await this.extractAndQueueImages(this.currentStepIndex + 1, promptText);

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
          resolve();
        } else {
          // Log a subtle wait tick occasionally so terminal doesn't spam too hard
          if (remaining % 2 === 0) {
             this.ui.logTerm(`SYS: Engine Cooldown [${remaining}s]...`);
          }
          this.delayTimer = setTimeout(tick, 1000);
        }
      };
      this.delayTimer = setTimeout(tick, 1000);
    });
  }

  async extractAndQueueImages(stepNum, promptText) {
    // Check multiple broad selectors to find the most recent bot response container
    const messageContainers = document.querySelectorAll('message-content, model-response, div[data-message-author="bot"], div.image-container');
    if (messageContainers.length === 0) {
      this.ui.logTerm(`ERR: No response container detected for [CLIP ${stepNum}]`, "err");
      return;
    }

    const lastContainer = messageContainers[messageContainers.length - 1];

    // Fallback: search the entire DOM for images if container is empty, but scoped is safer
    let imgEls = Array.from(lastContainer.querySelectorAll('img'));
    if (imgEls.length === 0) {
       imgEls = Array.from(document.querySelectorAll('img[src*="googleusercontent.com"]'));
    }

    const imageUrls = [];

    for (const img of imgEls) {
      const src = img.src;
      const isAvatar = src.includes('avatar') || img.alt.toLowerCase().includes('profile');

      // Strict filtering
      if (src && src.includes('googleusercontent.com') && !isAvatar) {

        // Wait for image to render to verify dimensions if it's not complete
        if (!img.complete) {
           await new Promise(resolve => {
             img.onload = resolve;
             img.onerror = resolve;
             // Safety timeout 3s per image
             setTimeout(resolve, 3000);
           });
        }

        // Filter out small UI icons/badges
        if (img.naturalWidth > 0 && img.naturalWidth < 120) continue;

        let hqSrc = src;
        if (hqSrc.includes('=')) {
          hqSrc = hqSrc.replace(/=w\d+-h\d+-?[a-zA-Z0-9-]*$/, '=s2048');
          hqSrc = hqSrc.replace(/=s\d+.*$/, '=s2048');
        } else {
          hqSrc += '=s2048';
        }
        imageUrls.push(hqSrc);
      }
    }

    if (imageUrls.length === 0) {
      this.ui.logTerm(`ERR: No valid render nodes detected in DOM for [CLIP ${stepNum}]`, "err");
      return;
    }

    this.ui.logTerm(`SYS: Scraped frame output for [CLIP ${stepNum}] (2048px)`);

    this.sequencePrompts.push({
      step: stepNum,
      prompt: promptText,
      imagesExtracted: imageUrls.length
    });

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      try {
        const base64Data = await this.fetchImageViaBackground(url);
        if (base64Data) {
          const base64 = base64Data.split(',')[1];
          const filename = `foto${stepNum}.jpg`; // Tag it appropriately, e.g. foto1, foto2
          this.sequenceAssets.push({ filename, base64 });
        }
      } catch (err) {
        console.error("Failed to fetch image", url, err);
        this.ui.logTerm(`ERR: Failed to queue image from step ${stepNum}`, "err");
      }
    }

    this.ui.logTerm(`SYS: Queued image for packaging (Total: ${this.sequenceAssets.length})`);
  }

  async packageFullSequence() {
    if (this.sequenceAssets.length === 0) {
       this.ui.logTerm("ERR: No assets collected to package.", "err");
       this.ui.updateTracker(0, this.currentFlow.steps.length, "IDLE");
       return;
    }

    this.ui.logTerm(`[EXPORT] Assembling full sequence into Master Zip...`);
    const zip = new JSZip();

    // Add images
    this.sequenceAssets.forEach(asset => {
      zip.file(asset.filename, asset.base64, {base64: true});
    });

    // Add metadata
    zip.file("sequence_metadata.json", JSON.stringify(this.sequencePrompts, null, 2));

    this.ui.logTerm(`[EXPORT] Flushing complete sequence to local disk...`);
    const zipBlob = await zip.generateAsync({type: "blob"});
    const objectUrl = URL.createObjectURL(zipBlob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `GeminiFlow_FullSequence_${timestamp}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 10000);

    this.ui.logTerm("STATUS: ALL ASSETS PACKAGED (ZIP READY)", "sys");
    this.ui.updateTracker(this.currentFlow.steps.length - 1, this.currentFlow.steps.length, "IDLE");
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
