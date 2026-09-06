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
    this.ui.callbacks.onAnalyzeVideo = this.analyzeVideo.bind(this);
  }

  async analyzeVideo(videoFile) {
    this.ui.logTerm("SYS: Iniciando Análisis de Director...", "sys");

    // Inject the video file into Gemini's input bar
    try {
      await this.dom.injectFile(videoFile);
      this.ui.logTerm("Clip de video cargado en el prompt.");
    } catch (e) {
      this.ui.logTerm("ERR: Falló la inyección del video", "err");
      return;
    }

    // Inject the rigid Director breakdown prompt
    const directorPrompt = `Actúa como un Director de Fotografía y Productor Técnico de Cine de clase mundial (especialista en adaptación Live-Action 35mm estilo Alter Anime Studio).
Analiza meticulosamente este clip de video de referencia. NO inventes acciones, personajes ni poderes que no ocurran en el clip.

Realiza un desglose cronológico exacto cuadro a cuadro:
1. LISTA DE ENTIDADES:
   - @1: Personaje A (rol y vestuario exacto)
   - @2: Personaje B (rol y vestuario exacto)
   - @ARENA: Escenario / entorno con iluminación física real.

2. DESGLOSE TÉCNICO DE PLANOS (Timecodes exactos 0-2s, 2-4s, etc.):
   - Tipo de plano (primer plano, plano medio, picado, tracking).
   - Movimiento exacto de cámara (handheld sutil, órbita, whip-pan, push-in).
   - Gestos y microexpresiones reales de los actores (mirada, parpadeo, tensión muscular).
   - Coreografía física (dirección exacta de golpes, bloqueos, trayectoria de pies).
   - Física de efectos (cuándo aparece y desaparece exactamente el hielo/energía, sin efectos permanentes).

3. GUION TÉCNICO LISTO PARA EJECUCIÓN:
   Entrega los prompts estructurados listos para replicar este clip exacto en imagen fotorrealista y secuencia de video.`;

    await this.dom.injectText(directorPrompt);
    this.ui.logTerm("Prompt de Director IA inyectado.");

    // Execute send
    this.ui.logTerm("Solicitando desglose técnico a Gemini...");
    await this.dom.clickSend();
  }

  async startFlow(flowId) {
    this.currentFlow = await this.db.getFlow(flowId);
    if (!this.currentFlow || !this.currentFlow.steps || this.currentFlow.steps.length === 0) {
      this.ui.logTerm("ERR: Secuencia inválida o línea de tiempo vacía", "err");
      return;
    }

    this.currentStepIndex = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.sequenceAssets = [];
    this.sequencePrompts = [];

    this.ui.setRunningState(true);
    this.ui.resetTimer();
    this.ui.startTimer();

    this.ui.logTerm(`SYS: Motor Iniciado -> ${this.currentFlow.name}`, "sys");
    this.executeStep();
  }

  pauseFlow() {
    this.isPaused = !this.isPaused;
    const btn = this.ui.shadow.querySelector('#gf-pause-btn');
    btn.innerText = this.isPaused ? "CONTINUAR" : "PAUSAR";
    btn.style.background = this.isPaused ? "rgba(255, 158, 69, 0.2)" : "transparent";

    if (this.isPaused) {
       this.ui.stopTimer();
    } else {
       this.ui.startTimer();
    }

    this.ui.logTerm(`SYS: Motor ${this.isPaused ? 'En Espera...' : 'Reanudado'}`, "warn");
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
    this.ui.stopTimer();
    this.ui.logTerm("SYS: Secuencia Cancelada", "err");
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
      this.ui.logTerm("SYS: SECUENCIA MAESTRA COMPLETADA", "sys");
      await this.packageFullSequence();
      this.ui.stopTimer();
      this.ui.setRunningState(false);
      this.isRunning = false;
      return;
    }

    const step = this.currentFlow.steps[this.currentStepIndex];
    this.ui.updateTracker(this.currentStepIndex, this.currentFlow.steps.length, "RUNNING");
    this.ui.logTerm(`[TOMA ${this.currentStepIndex+1}] Cargando en búfer del motor...`);

    // 1. Process prompt for shortcodes and inject Anti-Mutation Protocol
    let promptText = step.prompt;

    // Enforce single-frame output natively for Gemini image generation
    const singleFrameEnforcer = "SINGLE CINEMATIC SHOT. Full bleed frame, zero panels, zero borders, zero split-screen, zero collage, zero storyboard layout. ";
    if (!promptText.includes("SINGLE CINEMATIC SHOT")) {
      promptText = singleFrameEnforcer + promptText;
    }

    // Inject Anatomical Guardrails non-negotiable anchors
    const antiMutationStr = " Avoid: storyboard, contact sheet, comic panels, split screen, multiple frames, text overlays, timecode stamps, labels, subtitles, extra arms, third leg, floating limbs, duplicate head, fused hands, distorted spine, unnatural joints, anatomical glitches. Maintain static composed stance, feet planted on ground for all secondary characters.";
    if (!promptText.includes("extra arms")) {
      promptText += antiMutationStr;
    }

    // Extract strictly unique shortcodes using word boundaries to prevent substring overlap
    const rawMatches = promptText.match(/\@[a-zA-Z0-9_-]+\b/g) || [];
    const uniqueShortcodes = [...new Set(rawMatches)];

    // Fetch assets from DB
    const assetsToInject = [];
    for (const code of uniqueShortcodes) {
      const asset = await this.db.getAsset(code);
      if (asset) {
        assetsToInject.push(asset);
        // Cleanse prompt text globally of this shortcode to avoid text leakage
        promptText = promptText.split(code).join('').trim();
      }
    }

    // 2. Inject text
    this.ui.logTerm(`Inyectando datos de guion para [TOMA ${this.currentStepIndex+1}]...`);
    await this.dom.injectText(promptText);

    // 3. Inject images
    if (assetsToInject.length > 0) {
      this.ui.logTerm(`Subiendo referencia visual única (${assetsToInject.length} keyframes)...`);
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
    this.ui.logTerm(`[TOMA ${this.currentStepIndex+1}] Activando Red Neuronal...`);
    await this.dom.clickSend();

    // 5. Wait for generation
    this.ui.logTerm(`Esperando generación de fotograma...`);
    const success = await this.dom.waitForGeneration();
    if (!success) {
      if(!this.isRunning) return; // Stopped
      this.ui.logTerm(`ERR: Tiempo de espera agotado`, "err");
    } else {
      this.ui.logTerm(`[TOMA ${this.currentStepIndex+1}] Generación completada.`, "sys");
    }

    // 6. Extract & Queue Image
    this.ui.updateTracker(this.currentStepIndex, this.currentFlow.steps.length, "ZIPPING");
    this.ui.logTerm(`[TOMA ${this.currentStepIndex+1}] Extrayendo fotogramas maestros...`);
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
             this.ui.logTerm(`SYS: Enfriamiento de motor [${remaining}s]...`);
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
      this.ui.logTerm(`ERR: No se detectó contenedor de respuesta para [TOMA ${stepNum}]`, "err");
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
      this.ui.logTerm(`ERR: No se detectaron nodos de renderización para [TOMA ${stepNum}]`, "err");
      return;
    }

    this.ui.logTerm(`Fotograma capturado con éxito (2048px).`);

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
        this.ui.logTerm(`ERR: Falló extracción de imagen en paso ${stepNum}`, "err");
      }
    }

    this.ui.logTerm(`SYS: Fotograma en cola para empaquetado (Total: ${this.sequenceAssets.length})`);
  }

  async packageFullSequence() {
    if (this.sequenceAssets.length === 0) {
       this.ui.logTerm("ERR: No se recolectaron fotogramas para empaquetar.", "err");
       this.ui.updateTracker(0, this.currentFlow.steps.length, "IDLE");
       return;
    }

    this.ui.logTerm(`Generando archivo comprimido .ZIP...`);
    const zip = new JSZip();

    // Add images
    this.sequenceAssets.forEach(asset => {
      zip.file(asset.filename, asset.base64, {base64: true});
    });

    // Add metadata
    zip.file("sequence_metadata.json", JSON.stringify(this.sequencePrompts, null, 2));

    this.ui.logTerm(`[EXPORT] Escribiendo secuencia completa en disco local...`);
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

    this.ui.logTerm("Secuencia completa descargada.", "sys");
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
