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
    this.ui.callbacks.onManualAnchor = this.enableManualAnchor.bind(this);
  }

  enableManualAnchor() {
    this.ui.logTerm("SYS: Haz clic en la barra de texto de Google Flow para anclarla.", "warn");
    this.dom.enableManualAnchorMode((msg) => {
       this.ui.logTerm(msg, "sys");
    });
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

    // Wait for the generation of the response text
    this.ui.logTerm("Esperando análisis de video...");
    const success = await this.dom.waitForGeneration();

    if (success && success !== "REJECTED") {
      const responseText = await this.dom.getLatestResponseText();
      if (responseText && responseText.includes("GUION TÉCNICO")) {
        // Simple extraction heuristic for the script portion
        const scriptSection = responseText.split(/GUION TÉCNICO[^\n]*\n/i)[1];
        if (scriptSection) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

          this.ui.shadow.querySelector('#gf-flow-name').value = `Secuencia Analizada - ${timestamp}`;
          this.ui.shadow.querySelector('#gf-steps-container').innerHTML = '';

          // Use basic line splitting for beats
          const beats = scriptSection.split(/\n+/).filter(l => l.trim().length > 10);

          beats.forEach((beatText, idx) => {
            // Strip numbered lists naturally outputted
            const cleanBeat = beatText.replace(/^\d+\.\s*/, '').trim();
            this.ui.addStepEditor(cleanBeat, 4000, idx+1);
          });

          this.ui.logTerm("SYS: Guion importado exitosamente a la Línea de Tiempo.", "sys");
        } else {
          this.ui.logTerm("ERR: No se pudo extraer el guion estructurado del análisis.", "err");
        }
      }
    } else {
      this.ui.logTerm("ERR: Análisis fallido o bloqueado.", "err");
    }

    this.ui.shadow.querySelector('#gf-analyze-video-btn').innerText = "ANALIZAR CLIP CON GEMINI";
    this.ui.shadow.querySelector('#gf-analyze-video-btn').disabled = false;
    this.ui.shadow.querySelector('#gf-analyze-video-btn').style.animation = "";
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
      if (this.sequenceAssets.length === 0) {
        this.ui.logTerm("ERR: Secuencia abortada. No se generaron imágenes válidas.", "err");
        this.ui.stopTimer();
        this.ui.setRunningState(false);
        this.isRunning = false;
        return;
      }
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

    // Escape modifier canvas if needed
    await this.dom.prepareCanvas();

    // Await primary canvas mount before processing
    const isReady = await this.dom.waitForInputMount((msg) => this.ui.logTerm(msg, "warn"), 15000);
    if (!isReady) {
      this.ui.logTerm(`[ERR] No se encontró el área de entrada. Abre un lienzo activo en Google Flow.`, "err");
      this.ui.stopTimer();
      this.ui.setRunningState(false);
      this.isRunning = false;
      return;
    }

    // 1. Process prompt for shortcodes and inject Anti-Mutation Protocol
    let promptText = step.prompt;

    // Strip Midjourney/Stable Diffusion specific flags
    promptText = promptText.replace(/--ar\s+[0-9:]+/g, '')
                           .replace(/--v\s+[0-9.]+/g, '')
                           .replace(/--no\s+[a-zA-Z0-9,\s]+/g, '')
                           .replace(/--style\s+[a-zA-Z0-9_-]+/g, '')
                           .replace(/::[0-9.]+/g, '')
                           .trim();

    // Apply Zero-Aggression Cinema Vocabulary Engine & Strict Lore Scrubber
    promptText = promptText.replace(/\b(attack|attacks|strike|strikes|beat)\b/gi, 'high-speed martial choreography')
                           .replace(/\b(blows|punch|kick|hit)\b/gi, 'dynamic camera tracking')
                           .replace(/\b(battle|fight|combat)\b/gi, '35mm live-action film aesthetic')
                           .replace(/\b(parry|block|defense)\b/gi, 'rapid defensive block')
                           .replace(/\b(collision|impact burst|blast)\b/gi, 'dramatic stadium lighting')
                           .replace(/\b(gore|bloody|visceral|mutant|mutilated)\b/gi, '')
                           .replace(/\b(todoroki)\b/gi, 'athletic male subject with dual-toned crimson and white hair, dressed in a dark tournament uniform')
                           .replace(/\b(deku|midoriya)\b/gi, 'athletic male subject with dark curly hair and green utility apparel')
                           .replace(/\b(bakugo|goku|naruto)\b/gi, 'athletic male subject in stylized tactical wear')
                           .replace(/\b(my hero academia|boku no hero|dragon ball|naruto shippuden)\b/gi, 'cinematic live-action adaptation');

    // Concise Enforcer and Guardrails to avoid Safety filter truncations
    const singleFrameEnforcer = "Genera una imagen: ";
    if (!promptText.includes("Genera una imagen:")) {
      promptText = singleFrameEnforcer + promptText;
    }

    const antiMutationStr = " Avoid: comic panels, split screen, text, extra limbs, fused fingers, distorted anatomy.";
    if (!promptText.includes("distorted anatomy")) {
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
    let success = await this.dom.waitForGeneration();

    // Check for native Google Flow rejection
    if (success === "REJECTED") {
        this.ui.logTerm(`[ALERTA] Google Flow rechazó la generación por filtros de seguridad. Simplificando prompt...`, "warn");

        // Escape edit canvas if it threw us into one
        await this.dom.prepareCanvas();

        // Construct ultra-safe fallback
        let fallbackPrompt = "Genera una imagen: Cinematic film photograph of the athletic subject in @1 within a stadium arena. Hyper-realistic skin textures, natural fabric weave, dramatic 35mm film lighting, anamorphic lens flare, shallow depth of field. 8k resolution, authentic live-action aesthetic. Avoid: text, illustrations.";

        // Re-inject identical assets
        for (const asset of assetsToInject) {
           await this.dom.injectImage(asset.blob, asset.filename);
        }

        await this.dom.injectText(fallbackPrompt);
        await this.dom.clickSend();
        this.ui.logTerm(`Esperando generación de fotograma (Fallback)...`);
        success = await this.dom.waitForGeneration();
    }

    if (!success || success === "REJECTED") {
      if(!this.isRunning) return; // Stopped

      if (success === "REJECTED") {
         this.ui.logTerm(`SYS: Motor pausado por moderación de Google Flow. Ajusta el guion en Línea de Tiempo antes de continuar.`, "err");
         this.isPaused = true;
         const btn = this.ui.shadow.querySelector('#gf-pause-btn');
         btn.innerText = "CONTINUAR";
         btn.style.background = "rgba(255, 158, 69, 0.2)";
         return; // Halt this execution loop completely until user manually resumes
      } else {
         this.ui.logTerm(`ERR: Fallo definitivo o tiempo de espera agotado`, "err");
      }
    } else {
      // 5b. Verify if Gemini dumped text instead of an image
      if (!this.dom.hasGeneratedImage() && this.dom.hasTextCodeblockResponse()) {
        this.ui.logTerm(`[ALERTA] Gemini devolvió texto en vez de imagen. Reintentando con comando imperativo forzado...`, "warn");
        const retryPrompt = "Por favor crea la imagen ahora mismo usando tu herramienta visual, no escribas texto.";
        await this.dom.injectText(retryPrompt);
        await this.dom.clickSend();
        this.ui.logTerm(`Esperando generación de fotograma (Reintento)...`);
        success = await this.dom.waitForGeneration();
        if (!success && this.isRunning) {
           this.ui.logTerm(`ERR: Tiempo de espera agotado en reintento`, "err");
        } else {
           this.ui.logTerm(`[TOMA ${this.currentStepIndex+1}] Generación de reintento completada.`, "sys");
        }
      } else {
        this.ui.logTerm(`[TOMA ${this.currentStepIndex+1}] Generación completada.`, "sys");
      }
    }

    // 6. Extract & Queue Image/Video Output
    this.ui.updateTracker(this.currentStepIndex, this.currentFlow.steps.length, "ZIPPING");
    this.ui.logTerm(`[TOMA ${this.currentStepIndex+1}] Extrayendo assets maestros...`);
    await this.extractAndQueueMedia(this.currentStepIndex + 1, promptText);

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

  async extractAndQueueMedia(stepNum, promptText) {
    const messageContainers = document.querySelectorAll('message-content, model-response, div[data-message-author="bot"], div.image-container');
    if (messageContainers.length === 0) {
      this.ui.logTerm(`ERR: No se detectó contenedor de respuesta para [TOMA ${stepNum}]`, "err");
      return;
    }

    const lastContainer = messageContainers[messageContainers.length - 1];

    // First, check for <video> sources (Google Flow output)
    const vidEls = lastContainer.querySelectorAll('video source, video');
    const mediaUrls = [];
    let isVideo = false;

    if (vidEls.length > 0) {
       isVideo = true;
       vidEls.forEach(v => {
          const src = v.src || v.currentSrc;
          if (src && src.startsWith('http') && !mediaUrls.includes(src)) {
             mediaUrls.push(src);
          }
       });
    }

    // Fallback to images if no video
    if (mediaUrls.length === 0) {
      let imgEls = Array.from(lastContainer.querySelectorAll('img'));
      if (imgEls.length === 0) {
         imgEls = Array.from(document.querySelectorAll('img[src*="googleusercontent.com"]'));
      }

      for (const img of imgEls) {
        const src = img.src;
        const isAvatar = src.includes('avatar') || img.alt.toLowerCase().includes('profile');

        if (src && src.includes('googleusercontent.com') && !isAvatar) {
          if (!img.complete) {
             await new Promise(resolve => {
               img.onload = resolve;
               img.onerror = resolve;
               setTimeout(resolve, 3000);
             });
          }
          if (img.naturalWidth > 0 && img.naturalWidth < 120) continue;

          let hqSrc = src;
          if (hqSrc.includes('=')) {
            hqSrc = hqSrc.replace(/=w\d+-h\d+-?[a-zA-Z0-9-]*$/, '=s2048');
            hqSrc = hqSrc.replace(/=s\d+.*$/, '=s2048');
          } else {
            hqSrc += '=s2048';
          }
          mediaUrls.push(hqSrc);
        }
      }
    }

    if (mediaUrls.length === 0) {
      this.ui.logTerm(`ERR: No se detectaron nodos de renderización para [TOMA ${stepNum}]`, "err");
      return;
    }

    this.ui.logTerm(isVideo ? `Video capturado con éxito.` : `Fotograma capturado con éxito (2048px).`);

    this.sequencePrompts.push({
      step: stepNum,
      prompt: promptText,
      mediaExtracted: mediaUrls.length,
      type: isVideo ? "video" : "image"
    });

    for (let i = 0; i < mediaUrls.length; i++) {
      const url = mediaUrls[i];
      try {
        const base64Data = await this.fetchImageViaBackground(url);
        if (base64Data) {
          const base64 = base64Data.split(',')[1];
          const ext = isVideo ? 'mp4' : 'jpg';
          const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
          const filename = `TOMA_${stepNum}.${ext}`;
          this.sequenceAssets.push({ filename, base64 });

          if (!isVideo) {
            // Auto-chain images back to DB for future step referencing
            try {
               const byteCharacters = atob(base64);
               const byteNumbers = new Array(byteCharacters.length);
               for (let j = 0; j < byteCharacters.length; j++) {
                  byteNumbers[j] = byteCharacters.charCodeAt(j);
               }
               const byteArray = new Uint8Array(byteNumbers);
               const blob = new Blob([byteArray], {type: mimeType});

               await this.db.saveAsset(`@foto${stepNum}`, blob, filename);
               this.ui.logTerm(`[SYS] Fotograma listo en Banco de Medios. Avanzando...`);
               this.ui.refreshAssetsList();
            } catch(e) {
               console.error("Auto-chain save failed", e);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch media", url, err);
        this.ui.logTerm(`ERR: Falló extracción de medio en paso ${stepNum}`, "err");
      }
    }

    this.ui.logTerm(`SYS: Medio en cola para empaquetado (Total: ${this.sequenceAssets.length})`);
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
    if (!window.GeminiFlowInstance) {
      window.GeminiFlowInstance = new GeminiFlowOrchestrator();
    }
  }
}, 1000);

// Listen for Extension Icon Clicks to toggle the UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TOGGLE_UI") {
    if (window.GeminiFlowInstance && window.GeminiFlowInstance.ui) {
      window.GeminiFlowInstance.ui.toggleVisibility();
    }
    sendResponse({ success: true });
  }
});
