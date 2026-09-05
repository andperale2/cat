/* GeminiFlow UI Implementation */

class GeminiFlowUI {
  constructor() {
    this.container = null;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.callbacks = {
      onStartFlow: null,
      onPauseFlow: null,
      onStopFlow: null,
      onSkipStep: null,
    };

    this.init();
  }

  init() {
    if (document.getElementById('geminiflow-ui-container')) return;

    this.container = document.createElement('div');
    this.container.id = 'geminiflow-ui-container';
    this.container.innerHTML = `
      <div id="gf-header">
        <span class="gf-title">GeminiFlow</span>
        <button id="gf-toggle-btn">_</button>
      </div>
      <div id="gf-body">
        <div class="gf-tabs">
          <button class="gf-tab active" data-target="gf-exec">Run</button>
          <button class="gf-tab" data-target="gf-flows">Flows</button>
          <button class="gf-tab" data-target="gf-assets">Assets</button>
        </div>

        <div id="gf-exec" class="gf-tab-content active">
          <select id="gf-flow-select">
            <option value="">Select a flow...</option>
          </select>
          <div class="gf-controls">
            <button id="gf-start-btn" disabled>Start</button>
            <button id="gf-pause-btn" disabled>Pause</button>
            <button id="gf-stop-btn" disabled>Stop</button>
            <button id="gf-skip-btn" disabled>Skip Step</button>
          </div>
          <div id="gf-status-panel">
            <div id="gf-status-text">Status: Idle</div>
            <div id="gf-step-text">Step: -</div>
            <div id="gf-countdown"></div>
          </div>
        </div>

        <div id="gf-flows" class="gf-tab-content" style="display: none;">
          <div class="gf-flow-manager" style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ccc;">
            <strong>Saved Flows</strong>
            <ul id="gf-flow-list" style="list-style: none; padding: 0; margin-top: 5px;"></ul>
          </div>
          <div class="gf-flow-editor">
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
              <button id="gf-load-aas-btn" style="flex: 1; background: #e8f0fe; color: #1a73e8; border: 1px solid #1a73e8;">Load Anime to Live-Action Preset</button>
            </div>
            <input type="text" id="gf-flow-name" placeholder="Flow Name">
            <div id="gf-steps-container"></div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
              <button id="gf-add-step-btn">+ Add Step</button>
              <button id="gf-save-flow-btn" style="background: #1a73e8; color: white;">Save Flow</button>
            </div>
          </div>
        </div>

        <div id="gf-assets" class="gf-tab-content" style="display: none;">
          <div class="gf-asset-upload">
            <input type="text" id="gf-asset-shortcode" placeholder="Shortcode (e.g. @foto1)">
            <input type="file" id="gf-asset-file" accept="image/png, image/jpeg, image/webp">
            <button id="gf-upload-asset-btn">Upload</button>
          </div>
          <ul id="gf-asset-list"></ul>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
    this.makeDraggable();
    this.refreshAssetsList();
    this.refreshFlowsList();
  }

  bindEvents() {
    // Tabs
    const tabs = this.container.querySelectorAll('.gf-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        const contents = this.container.querySelectorAll('.gf-tab-content');
        contents.forEach(c => c.style.display = 'none');

        const targetId = e.target.getAttribute('data-target');
        this.container.querySelector('#' + targetId).style.display = 'block';
      });
    });

    // Toggle minimize
    const toggleBtn = this.container.querySelector('#gf-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      const body = this.container.querySelector('#gf-body');
      if (body.style.display === 'none') {
        body.style.display = 'block';
        toggleBtn.innerText = '_';
      } else {
        body.style.display = 'none';
        toggleBtn.innerText = '□';
      }
    });

    // Flow Selection State
    const flowSelect = this.container.querySelector('#gf-flow-select');
    flowSelect.addEventListener('change', async (e) => {
      const flowId = e.target.value;
      const startBtn = this.container.querySelector('#gf-start-btn');
      if (flowId) {
        startBtn.disabled = false;
        startBtn.style.background = "#1a73e8";
        startBtn.style.color = "white";
        // Show step count
        const flow = await window.GeminiFlowDB.getFlow(parseInt(flowId, 10));
        if (flow) {
          this.updateStatus("Ready", `0 / ${flow.steps.length}`, null);
        }
      } else {
        startBtn.disabled = true;
        startBtn.style.background = "";
        startBtn.style.color = "";
        this.updateStatus("Idle", "-", null);
      }
    });

    // Exec Controls
    this.container.querySelector('#gf-start-btn').addEventListener('click', () => {
      const flowId = this.container.querySelector('#gf-flow-select').value;
      if (flowId && this.callbacks.onStartFlow) {
        this.callbacks.onStartFlow(parseInt(flowId, 10));
      }
    });
    this.container.querySelector('#gf-pause-btn').addEventListener('click', () => {
      if (this.callbacks.onPauseFlow) this.callbacks.onPauseFlow();
    });
    this.container.querySelector('#gf-stop-btn').addEventListener('click', () => {
      if (this.callbacks.onStopFlow) this.callbacks.onStopFlow();
    });
    this.container.querySelector('#gf-skip-btn').addEventListener('click', () => {
      if (this.callbacks.onSkipStep) this.callbacks.onSkipStep();
    });

    // Flows Editor
    this.container.querySelector('#gf-load-aas-btn').addEventListener('click', () => {
      this.container.querySelector('#gf-flow-name').value = "Anime to Live-Action (AAS)";
      this.container.querySelector('#gf-steps-container').innerHTML = '';
      const aasSteps = [
        { prompt: "Live-action realistic version of this frame, photographic, true-to-life skin and textures. Keep the original composition and pose of @1. A focused character stands in @2, calm and resolute expression. Medium shot, slight low angle. Cinematic atmosphere, cold ambient base, warm practical highlights, subtle fog in background, fine film grain, shallow depth of field. Avoid: anime, cartoon, illustration, distorted hands, extra limbs, plastic skin, on-screen text.", delay: 4000 },
        { prompt: "SCENE @1 vs @2 | SHOT 1 5S I2V. REFS: @1 the attacker, @2 the defender, @3 the arena plate. @1 attacks relentlessly with rapid strikes; @2 remains completely still with arms crossed. At the exact instant of each blow, a sharp impact particle burst snaps up to parry then immediately vanishes. Dynamic handheld camera orbiting the fighters with slight whip-in on impact. Granular weight and thuds. COLOR GRADE: cinematic film, cool desaturated base, warm practical highlights, filmic contrast, subtle teal-orange, fine grain, anamorphic. AVOID: deformed limbs, fused fingers, permanent standing shields, weightless particles, @2 moving his body.", delay: 4000 },
        { prompt: "SCENE @1 vs @2 | 15S SEQUENCE. OPENING (0-2s): High overhead shot of @2 standing alone in center of @3. STRIKE 1 (2-4s): @1 blurs in at high speed behind @2. RAPID FLURRY (4-12s): Relentless assault from alternating angles; sand parries later and harder each time. FINISH (12-15s): @1 lands a decisive clean hit flush on target, whip-pan with micro slow-motion on impact. COLOR GRADE: cinematic film, cool desaturated base, fine grain. AVOID: cartoon look, duplicate limbs, floating particles, melting faces.", delay: 4000 }
      ];
      aasSteps.forEach(step => this.addStepEditor(step.prompt, step.delay));
    });

    this.container.querySelector('#gf-add-step-btn').addEventListener('click', () => {
      this.addStepEditor();
    });

    this.container.querySelector('#gf-save-flow-btn').addEventListener('click', async () => {
      const name = this.container.querySelector('#gf-flow-name').value;
      if (!name) return alert('Flow name is required');

      const stepEls = this.container.querySelectorAll('.gf-step-editor');
      const steps = Array.from(stepEls).map((el, index) => {
        return {
          step: index + 1,
          prompt: el.querySelector('.gf-step-prompt').value,
          delay: parseInt(el.querySelector('.gf-step-delay').value, 10) || 3000
        };
      });

      if (steps.length === 0) return alert('Add at least one step');

      const flow = { name, steps };
      await window.GeminiFlowDB.saveFlow(flow);
      alert('Flow saved!');
      this.container.querySelector('#gf-flow-name').value = '';
      this.container.querySelector('#gf-steps-container').innerHTML = '';
      this.refreshFlowsList();
    });

    // Assets Upload
    this.container.querySelector('#gf-upload-asset-btn').addEventListener('click', async () => {
      const shortcode = this.container.querySelector('#gf-asset-shortcode').value;
      const fileInput = this.container.querySelector('#gf-asset-file');
      const file = fileInput.files[0];

      if (!shortcode || !shortcode.startsWith('@')) return alert('Shortcode must start with @ (e.g. @foto1)');
      if (!file) return alert('Please select a file');

      await window.GeminiFlowDB.saveAsset(shortcode, file, file.name);
      alert('Asset saved!');
      this.container.querySelector('#gf-asset-shortcode').value = '';
      fileInput.value = '';
      this.refreshAssetsList();
    });
  }

  addStepEditor(promptText = '', delayValue = 4000) {
    const container = this.container.querySelector('#gf-steps-container');
    const stepCount = container.children.length + 1;
    const stepDiv = document.createElement('div');
    stepDiv.className = 'gf-step-editor';

    // Safely inject text
    const textarea = document.createElement('textarea');
    textarea.className = 'gf-step-prompt';
    textarea.placeholder = "Prompt text (e.g. A cat @foto1)";
    textarea.value = promptText;

    stepDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <strong class="gf-step-label">Step ${stepCount}</strong>
        <button class="gf-remove-step-btn" style="background:#ea4335; color:white; border:none; border-radius:3px; padding:2px 6px;">X</button>
      </div>
      <div class="gf-step-textarea-container"></div>
      <input type="number" class="gf-step-delay" placeholder="Delay (ms)" value="${delayValue}">
    `;

    stepDiv.querySelector('.gf-step-textarea-container').appendChild(textarea);

    stepDiv.querySelector('.gf-remove-step-btn').addEventListener('click', () => {
      stepDiv.remove();
      this.reindexSteps();
    });

    container.appendChild(stepDiv);
  }

  reindexSteps() {
    const container = this.container.querySelector('#gf-steps-container');
    const steps = container.querySelectorAll('.gf-step-editor');
    steps.forEach((step, index) => {
      step.querySelector('.gf-step-label').innerText = `Step ${index + 1}`;
    });
  }

  async refreshAssetsList() {
    const assets = await window.GeminiFlowDB.getAllAssets();
    const list = this.container.querySelector('#gf-asset-list');
    list.innerHTML = '';
    assets.forEach(asset => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';

      const label = document.createElement('span');
      label.innerText = `${asset.shortcode} (${asset.filename})`;

      const btnContainer = document.createElement('div');

      const insertBtn = document.createElement('button');
      insertBtn.innerText = 'Copy';
      insertBtn.style.background = '#34a853';
      insertBtn.style.color = 'white';
      insertBtn.style.border = 'none';
      insertBtn.style.borderRadius = '3px';
      insertBtn.style.padding = '2px 6px';
      insertBtn.style.marginRight = '5px';
      insertBtn.title = 'Copy shortcode to clipboard';
      insertBtn.onclick = () => {
        navigator.clipboard.writeText(asset.shortcode);
        insertBtn.innerText = 'Copied!';
        setTimeout(() => insertBtn.innerText = 'Copy', 2000);
      };

      const delBtn = document.createElement('button');
      delBtn.innerText = 'Del';
      delBtn.style.background = '#ea4335';
      delBtn.style.color = 'white';
      delBtn.style.border = 'none';
      delBtn.style.borderRadius = '3px';
      delBtn.style.padding = '2px 6px';
      delBtn.onclick = async () => {
        if(confirm(`Delete asset ${asset.shortcode}?`)) {
          await window.GeminiFlowDB.deleteAsset(asset.shortcode);
          this.refreshAssetsList();
        }
      };

      btnContainer.appendChild(insertBtn);
      btnContainer.appendChild(delBtn);

      li.appendChild(label);
      li.appendChild(btnContainer);
      list.appendChild(li);
    });
  }

  async refreshFlowsList() {
    const flows = await window.GeminiFlowDB.getAllFlows();

    // Refresh dropdown in Exec Tab
    const select = this.container.querySelector('#gf-flow-select');
    select.innerHTML = '<option value="">Select a flow...</option>';

    // Refresh list in Flows Tab
    const list = this.container.querySelector('#gf-flow-list');
    if(list) list.innerHTML = '';

    flows.forEach(flow => {
      // Add to dropdown
      const option = document.createElement('option');
      option.value = flow.id;
      option.innerText = flow.name;
      select.appendChild(option);

      // Add to manager list
      if(list) {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.padding = '4px 0';
        li.style.borderBottom = '1px solid #eee';
        li.innerText = flow.name;

        const delBtn = document.createElement('button');
        delBtn.innerText = 'Del';
        delBtn.style.background = '#ea4335';
        delBtn.style.color = 'white';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '3px';
        delBtn.style.padding = '2px 6px';
        delBtn.onclick = async () => {
          if(confirm(`Delete flow "${flow.name}"?`)) {
            await window.GeminiFlowDB.deleteFlow(flow.id);
            this.refreshFlowsList();
          }
        };
        li.appendChild(delBtn);
        list.appendChild(li);
      }
    });

    // Trigger change event to update "Run" tab button states based on new options
    select.dispatchEvent(new Event('change'));
  }

  makeDraggable() {
    const header = this.container.querySelector('#gf-header');

    const onMouseMove = (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;

      const rect = this.container.getBoundingClientRect();
      this.container.style.left = rect.left + deltaX + 'px';
      this.container.style.top = rect.top + deltaY + 'px';
      this.container.style.right = 'auto'; // Reset right positioning
      this.container.style.bottom = 'auto'; // Reset bottom positioning

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

  updateStatus(statusText, stepText = null, countdown = null) {
    if (statusText !== null) {
      this.container.querySelector('#gf-status-text').innerText = `Status: ${statusText}`;
    }
    if (stepText !== null) {
      this.container.querySelector('#gf-step-text').innerText = `Step: ${stepText}`;
    }
    const cdEl = this.container.querySelector('#gf-countdown');
    if (countdown !== null) {
      cdEl.innerText = `Wait: ${countdown}s`;
      cdEl.style.display = 'block';
    } else {
      cdEl.style.display = 'none';
    }
  }

  setRunningState(isRunning) {
    this.container.querySelector('#gf-start-btn').disabled = isRunning;
    this.container.querySelector('#gf-pause-btn').disabled = !isRunning;
    this.container.querySelector('#gf-stop-btn').disabled = !isRunning;
    this.container.querySelector('#gf-skip-btn').disabled = !isRunning;
    this.container.querySelector('#gf-flow-select').disabled = isRunning;
  }
}

window.GeminiFlowUI = GeminiFlowUI;
