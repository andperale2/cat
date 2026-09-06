/* GeminiFlow Shadow DOM UI Implementation - DaVinci Studio Overhaul */

class GeminiFlowUI {
  constructor() {
    this.hostContainer = null;
    this.shadow = null;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.callbacks = {
      onStartFlow: null,
      onPauseFlow: null,
      onStopFlow: null,
      onSkipStep: null,
      onAnalyzeVideo: null,
      onManualAnchor: null
    };

    // Maintain state for asset URLs to revoke them
    this.objectUrls = [];

    // Live timecode simulation
    this.tcInterval = null;
    this.tcFrames = 0;

    this.init();
  }

  init() {
    if (document.getElementById('geminiflow-studio-host')) return;

    this.hostContainer = document.createElement('div');
    this.hostContainer.id = 'geminiflow-studio-host';
    this.hostContainer.style.position = 'fixed';
    this.hostContainer.style.top = '20px';
    this.hostContainer.style.right = '20px';
    this.hostContainer.style.zIndex = '999999';

    // Attach Shadow DOM
    this.shadow = this.hostContainer.attachShadow({ mode: 'open' });

    const css = `
      :host {
        display: block;
        width: 480px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        color: #C9D1D9;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      }

      * { box-sizing: border-box; }

      .studio-panel {
        background: #0D1117;
        border: 1px solid #30363D;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Header & Toolbar */
      .header-toolbar {
        background: #161B22;
        border-bottom: 1px solid #30363D;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        user-select: none;
      }

      .rec-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 11px;
        color: #8B949E;
        letter-spacing: 0.5px;
      }

      .rec-dot {
        width: 8px;
        height: 8px;
        background: #FF4D4D;
        border-radius: 50%;
        box-shadow: 0 0 8px #FF4D4D;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }

      .timecode {
        font-family: "SF Mono", "JetBrains Mono", Consolas, monospace;
        color: #54C8D8;
        background: #090D10;
        padding: 2px 6px;
        border-radius: 3px;
        border: 1px solid #30363D;
        font-size: 11px;
      }

      .window-controls button {
        background: none;
        border: none;
        color: #8B949E;
        cursor: pointer;
        font-size: 14px;
      }
      .window-controls button:hover { color: #FFF; }

      /* Switcher Tabs */
      .tab-switcher {
        display: flex;
        background: #090D10;
        border-bottom: 1px solid #30363D;
      }

      .tab-btn {
        flex: 1;
        background: none;
        border: none;
        color: #8B949E;
        padding: 10px 0;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }

      .tab-btn:hover { color: #C9D1D9; background: #161B22; }
      .tab-btn.active {
        color: #FFF;
        border-bottom: 2px solid #54C8D8;
        background: #161B22;
      }

      /* Content Area */
      .panel-body {
        max-height: 550px;
        overflow-y: auto;
        padding: 15px;
        background: #0D1117;
      }

      .panel-body::-webkit-scrollbar { width: 8px; }
      .panel-body::-webkit-scrollbar-track { background: #090D10; }
      .panel-body::-webkit-scrollbar-thumb { background: #30363D; border-radius: 4px; }

      /* Forms & Inputs */
      input[type="text"], input[type="number"], select {
        width: 100%;
        background: #090D10;
        border: 1px solid #30363D;
        color: #54C8D8;
        padding: 8px;
        border-radius: 4px;
        font-family: "SF Mono", Consolas, monospace;
        font-size: 11px;
        margin-bottom: 10px;
        outline: none;
      }
      input[type="text"]:focus, input[type="number"]:focus, select:focus {
        border-color: #54C8D8;
      }

      /* Asset Dropzone */
      .dropzone {
        border: 1px dashed #54C8D8;
        background: rgba(84, 200, 216, 0.05);
        padding: 15px;
        text-align: center;
        border-radius: 4px;
        margin-bottom: 15px;
      }
      .dropzone-label { color: #54C8D8; font-weight: 600; margin-bottom: 10px; }

      .dropzone.director {
        border-color: #FF9E45;
        background: rgba(255, 158, 69, 0.05);
      }
      .dropzone.director .dropzone-label { color: #FF9E45; }

      /* Media Row (Assets) */
      .media-row {
        background: #161B22;
        border: 1px solid #30363D;
        border-radius: 4px;
        display: flex;
        padding: 8px;
        margin-bottom: 8px;
        align-items: center;
        gap: 12px;
      }
      .media-thumb {
        width: 48px;
        height: 48px;
        background: #000;
        border-radius: 4px;
        object-fit: cover;
        border: 1px solid #30363D;
      }
      .media-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .media-pill {
        display: inline-block;
        background: rgba(84, 200, 216, 0.15);
        color: #54C8D8;
        font-family: "SF Mono", Consolas, monospace;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 10px;
        border: 1px solid rgba(84, 200, 216, 0.3);
      }
      .media-filename { color: #8B949E; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }

      /* Micro Buttons */
      .btn-micro {
        background: none;
        border: 1px solid #30363D;
        color: #C9D1D9;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 10px;
        cursor: pointer;
        font-weight: 600;
      }
      .btn-micro.cyan { color: #54C8D8; border-color: rgba(84, 200, 216, 0.5); }
      .btn-micro.cyan:hover { background: rgba(84, 200, 216, 0.1); }
      .btn-micro.red { color: #FF4D4D; border-color: rgba(255, 77, 77, 0.5); }
      .btn-micro.red:hover { background: rgba(255, 77, 77, 0.1); }

      /* Timeline / Flows */
      .timeline-clip {
        background: #161B22;
        border: 1px solid #30363D;
        border-left: 3px solid #FF9E45;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 12px;
      }
      .clip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .clip-tc {
        background: #090D10;
        color: #FF9E45;
        font-family: "SF Mono", monospace;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        border: 1px solid #30363D;
      }

      .clip-textarea {
        width: 100%;
        height: 70px;
        background: #090D10;
        border: 1px solid #30363D;
        color: #54C8D8;
        padding: 8px;
        border-radius: 4px;
        font-family: "SF Mono", Consolas, monospace;
        font-size: 11px;
        resize: vertical;
        outline: none;
        margin-bottom: 8px;
      }
      .clip-textarea:focus { border-color: #54C8D8; }

      .quick-chips {
        display: flex;
        gap: 5px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .chip {
        background: #30363D;
        color: #C9D1D9;
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-family: "SF Mono", monospace;
      }
      .chip:hover { background: #54C8D8; color: #000; }

      /* Master Deck / Run */
      .master-deck {
        background: #161B22;
        padding: 15px;
        border-radius: 4px;
        border: 1px solid #30363D;
      }

      .btn-master {
        display: block;
        width: 100%;
        padding: 12px;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 10px;
        letter-spacing: 2px;
        text-transform: uppercase;
        transition: all 0.2s;
      }

      .btn-master:disabled { opacity: 0.3; cursor: not-allowed; }

      .btn-render {
        background: #54C8D8;
        color: #000;
        box-shadow: 0 0 10px rgba(84, 200, 216, 0.2);
      }
      .btn-render:hover:not(:disabled) { box-shadow: 0 0 15px rgba(84, 200, 216, 0.5); }

      .btn-hold { background: transparent; border: 1px solid #FF9E45; color: #FF9E45; }
      .btn-hold:hover:not(:disabled) { background: rgba(255, 158, 69, 0.1); }

      .btn-abort { background: transparent; border: 1px solid #FF4D4D; color: #FF4D4D; }
      .btn-abort:hover:not(:disabled) { background: rgba(255, 77, 77, 0.1); }

      /* Tracker / Terminal */
      .tracker {
        display: flex;
        align-items: center;
        gap: 5px;
        font-family: "SF Mono", monospace;
        font-size: 10px;
        color: #8B949E;
        margin-bottom: 15px;
        overflow-x: auto;
        white-space: nowrap;
        padding-bottom: 5px;
      }
      .tracker-node {
        padding: 2px 6px;
        border-radius: 3px;
        border: 1px solid #30363D;
      }
      .tracker-node.active { color: #000; background: #54C8D8; border-color: #54C8D8; }

      .terminal {
        background: #090D10;
        border: 1px solid #30363D;
        border-radius: 4px;
        padding: 8px;
        height: 120px;
        overflow-y: auto;
        font-family: "SF Mono", Consolas, monospace;
        font-size: 10px;
        color: #C9D1D9;
      }
      .terminal p { margin: 0 0 4px 0; }
      .term-warn { color: #FF9E45; }
      .term-err { color: #FF4D4D; }
      .term-sys { color: #54C8D8; }
    `;

    this.shadow.innerHTML = `
      <style>${css}</style>
      <div class="studio-panel">
        <!-- Header -->
        <div class="header-toolbar" id="gf-header">
          <div class="rec-indicator">
            <div class="rec-dot"></div>
            ESTUDIO AAS // MOTOR 2.0
          </div>
          <div class="timecode" id="tc-display">TC [00:00:00]</div>
          <div class="window-controls">
            <button id="gf-toggle-btn">_</button>
          </div>
        </div>

        <div id="gf-body">
          <!-- Switcher -->
          <div class="tab-switcher">
            <button class="tab-btn" data-target="gf-assets">BANCO DE MEDIOS</button>
            <button class="tab-btn" data-target="gf-flows">LÍNEA DE TIEMPO</button>
            <button class="tab-btn active" data-target="gf-exec">CONTROL MAESTRO</button>
          </div>

          <div class="panel-body">
            <!-- TAB: MEDIA POOL -->
            <div id="gf-assets" class="gf-tab-content" style="display: none;">

              <!-- Director Analyzer -->
              <div class="dropzone director">
                <div class="dropzone-label">ANÁLISIS DE VIDEO (DIRECTOR / PRODUCTOR IA)</div>
                <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
                  <input type="file" id="gf-video-director-input" accept="video/mp4,video/webm,video/quicktime" style="font-size:10px; width:100%;">
                  <div id="gf-video-metadata" style="color:#8B949E; font-size:10px; text-align:center; height:12px;"></div>
                  <button id="gf-analyze-video-btn" class="btn-master" style="background:#FF9E45; color:#000; width:100%; margin:0; padding:8px;" disabled>ANALIZAR CLIP CON GEMINI</button>
                </div>
              </div>

              <!-- Media Upload -->
              <div class="dropzone">
                <div class="dropzone-label">Arrastra aquí tus fotogramas o fichas de personaje</div>
                <div style="display:flex; gap:8px;">
                  <input type="text" id="gf-asset-shortcode" placeholder="Etiqueta (ej. @1, @rival, @arena)" style="margin:0;">
                  <input type="file" id="gf-asset-file" accept="image/*" multiple style="font-size:10px; width:150px;" title="Seleccionar archivo">
                  <button id="gf-upload-asset-btn" class="btn-micro cyan">AGREGAR</button>
                </div>
              </div>
              <strong style="display:block; margin-bottom:5px; color:#8B949E; font-size:10px;">Archivos listos para inyección directa</strong>
              <div id="gf-asset-list"></div>
            </div>

            <!-- TAB: TIMELINE -->
            <div id="gf-flows" class="gf-tab-content" style="display: none;">
               <div style="margin-bottom:15px;">
                 <strong style="display:block; margin-bottom:5px; color:#8B949E; font-size:10px;">PLANTILLAS PREDEFINIDAS</strong>
                 <div style="display:flex; gap:5px;">
                   <button id="gf-load-aas-btn" class="btn-micro cyan" style="flex:1;">CARGAR PLANTILLA ANIME A REALISMO (AAS)</button>
                   <button id="gf-load-direct-btn" class="btn-micro" style="flex:1;">REALISMO DIRECTO (SALTA PASO 1)</button>
                 </div>
               </div>

               <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
                  <strong style="color:#8B949E; font-size:10px;">SECUENCIA ACTIVA</strong>
                  <div style="display:flex; gap:5px;">
                     <button id="gf-add-step-btn" class="btn-micro">AGREGAR TOMA</button>
                     <button id="gf-save-flow-btn" class="btn-micro cyan" style="background:#54C8D8; color:#000;">GUARDAR SECUENCIA</button>
                  </div>
               </div>

               <input type="text" id="gf-flow-name" placeholder="Nombre de la secuencia (ej. Batalla Todoroki vs Deku)">
               <div id="gf-steps-container"></div>

               <div style="margin-top:20px; border-top:1px solid #30363D; padding-top:10px;">
                 <strong style="color:#8B949E; font-size:10px; display:block; margin-bottom:5px;">SECUENCIAS GUARDADAS</strong>
                 <div id="gf-flow-list"></div>
               </div>
            </div>

            <!-- TAB: MASTER CONTROL -->
            <div id="gf-exec" class="gf-tab-content active">
              <select id="gf-flow-select">
                <option value="">SELECCIONAR SECUENCIA A RENDERIZAR...</option>
              </select>

              <div class="master-deck">
                <div class="tracker" id="gf-tracker">
                  <!-- Nodes injected dynamically -->
                  <div class="tracker-node">[INACTIVO]</div>
                </div>

                <button id="gf-start-btn" class="btn-master btn-render" disabled>INICIAR RENDERIZADO</button>
                <div style="display:flex; gap:10px;">
                  <button id="gf-pause-btn" class="btn-master btn-hold" disabled>PAUSAR</button>
                  <button id="gf-skip-btn" class="btn-master" style="background:#30363D; color:#C9D1D9;" disabled>SALTAR TOMA</button>
                  <button id="gf-stop-btn" class="btn-master btn-abort" disabled>CANCELAR</button>
                </div>
              </div>

              <div style="margin-top:15px;">
                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                   <strong style="color:#8B949E; font-size:10px;">TERMINAL DEL SISTEMA</strong>
                   <button id="gf-manual-anchor-btn" class="btn-micro" style="border-color:#FF9E45; color:#FF9E45;" title="Fuerza la selección manual de la barra de entrada de texto">[SELECCIONAR CAMPO MANUALMENTE]</button>
                 </div>
                 <div class="terminal" id="gf-terminal">
                   <p class="term-sys">> Sistema listo.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.hostContainer);
    this.bindEvents();
    this.makeDraggable();

    // We defer the DB loads slightly to ensure DB init finishes
    setTimeout(() => {
      this.refreshAssetsList();
      this.refreshFlowsList();
    }, 500);
  }

  resetTimer() {
    this.stopTimer();
    this.tcSeconds = 0;
    this.shadow.querySelector('#tc-display').innerText = `TC [00:00:00]`;
  }

  startTimer() {
    if (this.tcInterval) return;
    this.tcInterval = setInterval(() => {
      this.tcSeconds++;
      const s = this.tcSeconds % 60;
      const m = Math.floor(this.tcSeconds / 60) % 60;
      const h = Math.floor(this.tcSeconds / 3600);

      const pad = (n) => n.toString().padStart(2, '0');
      this.shadow.querySelector('#tc-display').innerText = `TC [${pad(h)}:${pad(m)}:${pad(s)}]`;
    }, 1000);
  }

  stopTimer() {
    if (this.tcInterval) {
      clearInterval(this.tcInterval);
      this.tcInterval = null;
    }
  }

  logTerm(msg, type="sys") {
    const term = this.shadow.querySelector('#gf-terminal');
    const p = document.createElement('p');
    p.className = `term-${type}`;

    // Format timestamp
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;

    p.innerText = `[${ts}] > ${msg}`;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
  }

  updateTracker(stepIndex, total, status = "RUNNING") {
    const tracker = this.shadow.querySelector('#gf-tracker');
    tracker.innerHTML = '';

    if (total === 0) {
      tracker.innerHTML = `<div class="tracker-node">[INACTIVO]</div>`;
      return;
    }

    for (let i = 0; i < total; i++) {
      const node = document.createElement('div');
      node.className = `tracker-node ${i === stepIndex ? 'active' : ''}`;
      node.innerText = `[TOMA ${i+1}]`;
      tracker.appendChild(node);

      if (i < total - 1) {
        const arrow = document.createElement('div');
        arrow.innerText = ' ──> ';
        tracker.appendChild(arrow);
      }
    }

    if (status === "ZIPPING") {
      const arrow = document.createElement('div');
      arrow.innerText = ' ──> ';
      tracker.appendChild(arrow);

      const zipNode = document.createElement('div');
      zipNode.className = 'tracker-node active';
      zipNode.innerText = '[EXPORTAR ZIP]';
      tracker.appendChild(zipNode);
    }
  }

  // --- We will append the rest of the ui.js functionality in the next step ---

  bindEvents() {
    // Video Analyzer
    const vidInput = this.shadow.querySelector('#gf-video-director-input');
    const analyzeBtn = this.shadow.querySelector('#gf-analyze-video-btn');
    const metaLabel = this.shadow.querySelector('#gf-video-metadata');

    vidInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) {
         analyzeBtn.disabled = true;
         metaLabel.innerText = '';
         return;
      }

      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
         URL.revokeObjectURL(video.src);
         const dur = video.duration.toFixed(1);
         if (video.duration > 15) {
            metaLabel.innerHTML = `<span style="color:#FF4D4D;">ADVERTENCIA: ${dur}s exceden límite de 15s | ${sizeMB} MB</span>`;
         } else {
            metaLabel.innerHTML = `Clip válido: ${dur}s | ${sizeMB} MB`;
         }
         analyzeBtn.disabled = false;
      };
      video.src = URL.createObjectURL(file);
    });

    analyzeBtn.addEventListener('click', () => {
       const file = vidInput.files[0];
       if (file && this.callbacks.onAnalyzeVideo) {
          analyzeBtn.innerText = "ANALIZANDO...";
          analyzeBtn.disabled = true;
          // Add pulse animation roughly
          analyzeBtn.style.animation = "pulse 1.5s infinite";
          this.callbacks.onAnalyzeVideo(file);

          setTimeout(() => {
             analyzeBtn.innerText = "ANALIZAR CLIP CON GEMINI";
             analyzeBtn.disabled = false;
             analyzeBtn.style.animation = "";
             vidInput.value = '';
             metaLabel.innerText = '';
          }, 4000); // Visual reset buffer
       }
    });

    // Switcher Tabs
    const tabs = this.shadow.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        const contents = this.shadow.querySelectorAll('.gf-tab-content');
        contents.forEach(c => c.style.display = 'none');

        const targetId = e.target.getAttribute('data-target');
        this.shadow.querySelector('#' + targetId).style.display = 'block';
      });
    });

    // Window controls
    const toggleBtn = this.shadow.querySelector('#gf-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      const body = this.shadow.querySelector('#gf-body');
      if (body.style.display === 'none') {
        body.style.display = 'block';
        toggleBtn.innerText = '_';
      } else {
        body.style.display = 'none';
        toggleBtn.innerText = '□';
      }
    });

    // Asset Upload (Bulk Support)
    this.shadow.querySelector('#gf-upload-asset-btn').addEventListener('click', async () => {
      const inputShortcode = this.shadow.querySelector('#gf-asset-shortcode').value.trim();
      const fileInput = this.shadow.querySelector('#gf-asset-file');
      const files = fileInput.files;

      if (files.length === 0) {
        this.logTerm('ERR: Missing media files', 'err');
        return;
      }

      const existingAssets = await window.GeminiFlowDB.getAllAssets();
      let autoIndex = existingAssets.length + 1;

      for (let i = 0; i < files.length; i++) {
         const file = files[i];
         let tag = inputShortcode;

         if (!tag) {
            tag = `@${autoIndex}`;
            autoIndex++;
         } else if (files.length > 1) {
            tag = `${inputShortcode}_${i+1}`;
         }

         if (!tag.startsWith('@')) tag = `@${tag}`;

         await window.GeminiFlowDB.saveAsset(tag, file, file.name);
         this.logTerm(`SYS: Ingested media [${tag}]`);
      }

      this.shadow.querySelector('#gf-asset-shortcode').value = '';
      fileInput.value = '';
      this.refreshAssetsList();
    });

    // Timeline Load Preset
    this.shadow.querySelector('#gf-load-aas-btn').addEventListener('click', () => {
      this.shadow.querySelector('#gf-flow-name').value = "Anime to Live-Action (AAS)";
      this.shadow.querySelector('#gf-steps-container').innerHTML = '';
      const aasSteps = [
        { prompt: "Cinematic film photograph of the athletic subject in @1 standing in an arena. Photorealistic human features, natural fabric textures, dramatic studio lighting, 35mm film grain, shallow depth of field, anamorphic framing.", delay: 4000 },
        { prompt: "Cinematic film photograph of the athletic subject in @2 standing in an arena. Photorealistic human features, natural fabric textures, dramatic studio lighting, 35mm film grain, shallow depth of field, anamorphic framing.", delay: 4000 },
        { prompt: "Cinematic choreographed sequence of @foto1 and @foto2 in motion within the arena plate. Rapid athletic movement, dynamic low-angle tracking camera with smooth orbit, atmospheric mist, high-contrast film lighting. Zero distortion, photorealistic.", delay: 4000 }
      ];
      aasSteps.forEach((step, idx) => this.addStepEditor(step.prompt, step.delay, idx+1));
      this.logTerm(`SYS: AAS Preset Loaded to Timeline`);
    });

    this.shadow.querySelector('#gf-load-direct-btn').addEventListener('click', () => {
      this.shadow.querySelector('#gf-flow-name').value = "Direct Photoreal Sequence";
      this.shadow.querySelector('#gf-steps-container').innerHTML = '';
      const directSteps = [
        { prompt: "Cinematic film photograph of the athletic subject in @1 standing in an arena. Photorealistic human features, natural fabric textures, dramatic studio lighting, 35mm film grain, shallow depth of field, anamorphic framing.", delay: 4000 },
        { prompt: "Cinematic choreographed sequence of @foto1 and @foto2 in motion within the arena plate. Rapid athletic movement, dynamic low-angle tracking camera with smooth orbit, atmospheric mist, high-contrast film lighting. Zero distortion, photorealistic.", delay: 4000 }
      ];
      directSteps.forEach((step, idx) => this.addStepEditor(step.prompt, step.delay, idx+1));
      this.logTerm(`SYS: Direct Preset Loaded to Timeline`);
    });

    // Add Clip
    this.shadow.querySelector('#gf-add-step-btn').addEventListener('click', () => {
      this.addStepEditor();
    });

    // Save Timeline
    this.shadow.querySelector('#gf-save-flow-btn').addEventListener('click', async () => {
      const name = this.shadow.querySelector('#gf-flow-name').value.trim();
      if (!name) {
        this.logTerm('ERR: Sequence name required', 'err');
        return;
      }

      const stepEls = this.shadow.querySelectorAll('.gf-step-editor');
      const steps = Array.from(stepEls).map((el, index) => {
        return {
          step: index + 1,
          prompt: el.querySelector('.clip-textarea').value,
          delay: parseInt(el.querySelector('.gf-step-delay').value, 10) || 4000
        };
      });

      if (steps.length === 0) {
        this.logTerm('ERR: Empty timeline', 'err');
        return;
      }

      await window.GeminiFlowDB.saveFlow({ name, steps });
      this.logTerm(`SYS: Timeline [${name}] saved to storage`);
      this.shadow.querySelector('#gf-flow-name').value = '';
      this.shadow.querySelector('#gf-steps-container').innerHTML = '';
      this.refreshFlowsList();
    });

    // Run Tab Selection
    const flowSelect = this.shadow.querySelector('#gf-flow-select');
    flowSelect.addEventListener('change', async (e) => {
      const flowId = e.target.value;
      const startBtn = this.shadow.querySelector('#gf-start-btn');
      if (flowId) {
        startBtn.disabled = false;
        const flow = await window.GeminiFlowDB.getFlow(parseInt(flowId, 10));
        if (flow) {
          this.updateTracker(0, flow.steps.length, "IDLE");
          this.logTerm(`SYS: Loaded Sequence [${flow.name}] (${flow.steps.length} Clips)`);
        }
      } else {
        startBtn.disabled = true;
        this.updateTracker(0, 0, "IDLE");
      }
    });

    // Manual Anchor
    this.shadow.querySelector('#gf-manual-anchor-btn').addEventListener('click', () => {
      if (this.callbacks.onManualAnchor) {
         this.callbacks.onManualAnchor();
      }
    });

    // Transport Controls
    this.shadow.querySelector('#gf-start-btn').addEventListener('click', () => {
      const flowId = this.shadow.querySelector('#gf-flow-select').value;
      if (flowId && this.callbacks.onStartFlow) {
        this.callbacks.onStartFlow(parseInt(flowId, 10));
      }
    });
    this.shadow.querySelector('#gf-pause-btn').addEventListener('click', () => {
      if (this.callbacks.onPauseFlow) this.callbacks.onPauseFlow();
    });
    this.shadow.querySelector('#gf-stop-btn').addEventListener('click', () => {
      if (this.callbacks.onStopFlow) this.callbacks.onStopFlow();
    });
    this.shadow.querySelector('#gf-skip-btn').addEventListener('click', () => {
      if (this.callbacks.onSkipStep) this.callbacks.onSkipStep();
    });
  }

  addStepEditor(promptText = '', delayValue = 4000, forceIndex = null) {
    const container = this.shadow.querySelector('#gf-steps-container');
    const stepCount = forceIndex || (container.children.length + 1);
    const stepDiv = document.createElement('div');
    stepDiv.className = 'timeline-clip gf-step-editor';

    // Quick chips
    const chips = ['@1', '@2', '@3', 'CUT:', 'COLOR GRADE:'].map(c =>
      `<span class="chip" onclick="this.parentElement.nextElementSibling.value += ' ${c}'">${c}</span>`
    ).join('');

    stepDiv.innerHTML = `
      <div class="clip-header">
        <span class="clip-tc gf-step-label">TOMA ${stepCount}</span>
        <button class="btn-micro red gf-remove-step-btn">ELIMINAR</button>
      </div>
      <div class="quick-chips">${chips}</div>
      <textarea class="clip-textarea" placeholder="Escribe las acciones, movimientos de cámara y sonido...">${promptText}</textarea>
      <div style="display:flex; align-items:center; gap:5px;">
        <span style="color:#8B949E; font-size:10px;">ESPERA (MS)</span>
        <input type="number" class="gf-step-delay" value="${delayValue}" style="margin:0; width:80px;">
      </div>
    `;

    stepDiv.querySelector('.gf-remove-step-btn').addEventListener('click', () => {
      stepDiv.remove();
      this.reindexSteps();
    });

    container.appendChild(stepDiv);
  }

  reindexSteps() {
    const container = this.shadow.querySelector('#gf-steps-container');
    const steps = container.querySelectorAll('.gf-step-editor');
    steps.forEach((step, index) => {
      step.querySelector('.gf-step-label').innerText = `TOMA ${index + 1}`;
    });
  }

  async refreshAssetsList() {
    const assets = await window.GeminiFlowDB.getAllAssets();
    const list = this.shadow.querySelector('#gf-asset-list');
    list.innerHTML = '';

    // Cleanup previous blob URLs
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];

    assets.forEach(asset => {
      const blobUrl = URL.createObjectURL(asset.blob);
      this.objectUrls.push(blobUrl);

      const sizeKB = Math.round(asset.blob.size / 1024);
      const row = document.createElement('div');
      row.className = 'media-row';

      row.innerHTML = `
        <img src="${blobUrl}" class="media-thumb">
        <div class="media-info">
          <div><span class="media-pill">${asset.shortcode}</span></div>
          <div class="media-filename">${asset.filename} | ${sizeKB} KB</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <button class="btn-micro cyan gf-inject-btn">INSERTAR</button>
          <button class="btn-micro red gf-del-btn">ELIMINAR</button>
        </div>
      `;

      row.querySelector('.gf-inject-btn').addEventListener('click', () => {
        // Attempt to insert into the active timeline textarea, else copy to clipboard
        const editors = this.shadow.querySelectorAll('.clip-textarea');
        if (editors.length > 0) {
           const last = editors[editors.length - 1];
           last.value += ` ${asset.shortcode}`;
           this.logTerm(`SYS: Injected ${asset.shortcode} into Timeline`);
        } else {
           navigator.clipboard.writeText(asset.shortcode);
           this.logTerm(`SYS: Tag ${asset.shortcode} copied to clipboard`);
        }
      });

      row.querySelector('.gf-del-btn').addEventListener('click', async () => {
        if(confirm(`Delete media [${asset.shortcode}]?`)) {
          await window.GeminiFlowDB.deleteAsset(asset.shortcode);
          this.logTerm(`SYS: Deleted media [${asset.shortcode}]`, "warn");
          this.refreshAssetsList();
        }
      });

      list.appendChild(row);
    });
  }

  async refreshFlowsList() {
    const flows = await window.GeminiFlowDB.getAllFlows();

    const select = this.shadow.querySelector('#gf-flow-select');
    select.innerHTML = '<option value="">SELECT SEQUENCE TO RENDER...</option>';

    const list = this.shadow.querySelector('#gf-flow-list');
    if(list) list.innerHTML = '';

    flows.forEach(flow => {
      const option = document.createElement('option');
      option.value = flow.id;
      option.innerText = flow.name;
      select.appendChild(option);

      if(list) {
        const row = document.createElement('div');
        row.className = 'media-row';
        row.innerHTML = `
          <div class="media-info">
             <div><span style="color:#FFF; font-weight:bold; font-size:11px;">${flow.name}</span></div>
             <div class="media-filename">${flow.steps.length} Clips Total</div>
          </div>
          <button class="btn-micro red gf-del-flow-btn">ELIMINAR</button>
        `;

        row.querySelector('.gf-del-flow-btn').addEventListener('click', async () => {
          if(confirm(`Delete sequence "${flow.name}"?`)) {
            await window.GeminiFlowDB.deleteFlow(flow.id);
            this.logTerm(`SYS: Dropped sequence [${flow.name}]`, "warn");
            this.refreshFlowsList();
          }
        });
        list.appendChild(row);
      }
    });

    select.dispatchEvent(new Event('change'));
  }

  makeDraggable() {
    const header = this.shadow.querySelector('#gf-header');

    const onMouseMove = (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;

      const rect = this.hostContainer.getBoundingClientRect();
      this.hostContainer.style.left = rect.left + deltaX + 'px';
      this.hostContainer.style.top = rect.top + deltaY + 'px';
      this.hostContainer.style.right = 'auto';
      this.hostContainer.style.bottom = 'auto';

      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    };

    const onMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    header.addEventListener('mousedown', (e) => {
      if(e.target.id === 'gf-toggle-btn') return;
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  setRunningState(isRunning) {
    this.shadow.querySelector('#gf-start-btn').disabled = isRunning;
    this.shadow.querySelector('#gf-pause-btn').disabled = !isRunning;
    this.shadow.querySelector('#gf-stop-btn').disabled = !isRunning;
    this.shadow.querySelector('#gf-skip-btn').disabled = !isRunning;
    this.shadow.querySelector('#gf-flow-select').disabled = isRunning;
  }
}

// Attach globally
window.GeminiFlowUI = GeminiFlowUI;
