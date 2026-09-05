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
            <button id="gf-start-btn">Start</button>
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
          <div class="gf-flow-editor">
            <input type="text" id="gf-flow-name" placeholder="Flow Name">
            <div id="gf-steps-container"></div>
            <button id="gf-add-step-btn">+ Add Step</button>
            <button id="gf-save-flow-btn">Save Flow</button>
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

  addStepEditor() {
    const container = this.container.querySelector('#gf-steps-container');
    const stepDiv = document.createElement('div');
    stepDiv.className = 'gf-step-editor';
    stepDiv.innerHTML = `
      <textarea class="gf-step-prompt" placeholder="Prompt text (e.g. A cat @foto1)"></textarea>
      <input type="number" class="gf-step-delay" placeholder="Delay (ms) e.g. 3000" value="3000">
      <button class="gf-remove-step-btn">X</button>
    `;
    stepDiv.querySelector('.gf-remove-step-btn').addEventListener('click', () => stepDiv.remove());
    container.appendChild(stepDiv);
  }

  async refreshAssetsList() {
    const assets = await window.GeminiFlowDB.getAllAssets();
    const list = this.container.querySelector('#gf-asset-list');
    list.innerHTML = '';
    assets.forEach(asset => {
      const li = document.createElement('li');
      li.innerText = `${asset.shortcode} (${asset.filename})`;
      const delBtn = document.createElement('button');
      delBtn.innerText = 'Del';
      delBtn.onclick = async () => {
        await window.GeminiFlowDB.deleteAsset(asset.shortcode);
        this.refreshAssetsList();
      };
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  }

  async refreshFlowsList() {
    const flows = await window.GeminiFlowDB.getAllFlows();
    const select = this.container.querySelector('#gf-flow-select');
    select.innerHTML = '<option value="">Select a flow...</option>';
    flows.forEach(flow => {
      const option = document.createElement('option');
      option.value = flow.id;
      option.innerText = flow.name;
      select.appendChild(option);
    });
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
