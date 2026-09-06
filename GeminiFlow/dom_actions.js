/* GeminiFlow DOM Actions (dom_actions.js) */

class GeminiFlowDOMActions {
  constructor() {
    this.observer = null;
    this.cachedEditor = null;
  }

  enableManualAnchorMode(callback) {
    // Change cursor
    document.body.style.cursor = 'crosshair';

    const clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Look for closest likely input
      const target = e.target.closest('textarea, div[contenteditable="true"], input[type="text"]');
      if (target) {
        this.cachedEditor = target;
        callback(`[SYS] Campo anclado manualmente: ${target.tagName}`);
      } else {
        // Fallback to exactly what was clicked
        this.cachedEditor = e.target;
        callback(`[SYS] Elemento anclado manualmente: ${e.target.tagName}`);
      }

      // Cleanup
      document.body.style.cursor = 'default';
      document.removeEventListener('click', clickHandler, true);
    };

    // Use capture phase to intercept before native Google handlers
    document.addEventListener('click', clickHandler, true);
  }

  async prepareCanvas() {
    // Check if we are currently stuck in an editing/modification view instead of the root creation view
    const textareas = document.querySelectorAll('textarea');
    const isEditMode = Array.from(textareas).some(ta => {
      const label = ta.getAttribute('aria-label') || '';
      return label.toLowerCase().includes('cambiar') || label.toLowerCase().includes('change');
    });

    if (isEditMode) {
      // Find the "+" or "Nuevo" button to escape edit mode
      const buttons = document.querySelectorAll('button, div[role="button"]');
      const resetBtn = Array.from(buttons).find(el => {
         const txt = el.textContent.trim().toLowerCase();
         const label = (el.getAttribute('aria-label') || '').toLowerCase();
         return txt === 'nuevo' || txt === 'new' || label.includes('nuevo') || label.includes('new');
      });
      if (resetBtn) {
         resetBtn.click();
         await new Promise(r => setTimeout(r, 1000));
      }
    }

    this.dismissErrors();
  }

  dismissErrors() {
    // Actively hide or clear Google Flow error toasts so they don't instantly trip the next fallback observer
    const errorNodes = document.querySelectorAll('div, span, p');
    Array.from(errorNodes).forEach(el => {
      const txt = el.textContent.trim().toLowerCase();
      if (txt.includes('no se pudo completar la acción') || txt.includes('no se pudo generar la imagen')) {
         el.style.display = 'none'; // visually hide
         el.innerText = ''; // clear text to prevent future querySelector matches
      }
    });
  }

  async bypassModal() {
    const buttons = document.querySelectorAll('button, div[role="button"]');
    const btn = Array.from(buttons).find(el => el.textContent.trim().includes('Entendido') || (el.getAttribute('aria-label') && el.getAttribute('aria-label').includes('Entendido')));
    if (btn) {
      btn.click();
      await new Promise(r => setTimeout(r, 800)); // wait for modal transition
    }
  }

  async configureVideoSettings() {
    // Attempt to locate formatting pill to force Video mode
    const configPill = document.querySelector('button[aria-label*="Video"], div[role="button"][aria-label*="Video"], button[aria-label*="Imagen"], button[aria-label*="Image"]');
    if (configPill) {
      configPill.click();
      await new Promise(r => setTimeout(r, 500));
      const items = document.querySelectorAll('li, div');

      // Force "Video" if currently on "Imagen"
      const videoBtn = Array.from(items).find(el => {
        const text = el.textContent.trim().toLowerCase();
        return text === 'vídeo' || text === 'video' || text.includes('video · 720p');
      });
      if (videoBtn) videoBtn.click();
      await new Promise(r => setTimeout(r, 500));

      // Force 10s if setting is available
      const durationBtn = Array.from(document.querySelectorAll('li, div')).find(el => el.textContent.trim() === '10s');
      if (durationBtn) {
         durationBtn.click();
      } else {
         document.body.click(); // close menu
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // Toggle Agente mode ON if available in the UI
    const toggleButtons = document.querySelectorAll('button[role="switch"], div[role="switch"]');
    const agentToggle = Array.from(toggleButtons).find(el => {
       const label = (el.getAttribute('aria-label') || '').toLowerCase();
       return label.includes('agente') || label.includes('agent');
    });

    if (agentToggle) {
       const isOn = agentToggle.getAttribute('aria-checked') === 'true';
       if (!isOn) {
          agentToggle.click();
          await new Promise(r => setTimeout(r, 300));
       }
    }
  }

  getEditor() {
    if (this.cachedEditor) return this.cachedEditor;

    // Google Flow / Gemini Input command bar
    return document.querySelector('textarea[placeholder*="crear"]') ||
           document.querySelector('textarea[placeholder*="create"]') ||
           document.querySelector('textarea[aria-label*="Qué quieres crear"]') ||
           document.querySelector('textarea[aria-label*="What do you want to create"]') ||
           document.querySelector('input[type="text"][placeholder*="crear"]') ||
           document.querySelector('[data-placeholder*="crear"]') ||
           document.querySelector('div[contenteditable="true"]') ||
           document.querySelector('rich-textarea') ||
           document.querySelector('.ql-editor');
  }

  async waitForInputMount(logCallback, timeoutMs = 15000) {
    let elapsed = 0;
    const interval = 500;

    while (elapsed < timeoutMs) {
      const editor = this.getEditor();
      if (editor) return true;

      // If missing after 3 seconds, attempt to click initialization canvas triggers
      // Google Flow frequently hides the prompt input behind a tile "Edita un video con Omni" or a bottom "+" button
      // Or Material FABs (Floating Action Buttons) on mobile/scaled views
      if (elapsed === 3000 || elapsed === 8000) {
         if (logCallback && elapsed === 3000) logCallback(`[SYS] Reabriendo contenedor de prompt (Lienzo cerrado)...`);

         const buttons = document.querySelectorAll('button, div[role="button"], a, div.action-tile, .primary-action, .fab, .mat-fab');
         const initBtn = Array.from(buttons).find(el => {
            const txt = el.textContent.trim().toLowerCase();
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            return txt.includes('edita un video con omni') || txt === 'nuevo elemento' || txt === 'crear' || txt === 'crear clip' || txt === 'nuevo' || txt === 'start' || txt === 'añadir' || txt === 'multimedia' || txt === '+' || aria.includes('multimedia') || aria.includes('nuevo') || aria.includes('crear');
         });

         if (initBtn) {
            initBtn.click();
            await new Promise(r => setTimeout(r, 1500)); // allow mount time after click
         }
      }

      await new Promise(r => setTimeout(r, interval));
      elapsed += interval;
    }

    return false;
  }

  getSendButton() {
    let btn = document.querySelector('button[aria-label*="Send"]') ||
              document.querySelector('button[aria-label*="send"]') ||
              document.querySelector('button[aria-label*="Submit"]') ||
              document.querySelector('button[aria-label*="Enviar"]') ||
              document.querySelector('div[role="button"][aria-label*="Send"]') ||
              document.querySelector('div[role="button"][aria-label*="Enviar"]') ||
              document.querySelector('.send-button');

    if (!btn) {
      // Find mat-icon that contains "send" text
      const icons = document.querySelectorAll('button mat-icon, mat-icon');
      const icon = Array.from(icons).find(el => el.textContent.trim() === 'send');
      if (icon) {
        btn = icon.closest('button, div[role="button"]');
      }
    }
    return btn;
  }

  async injectText(text) {
    const editor = this.getEditor();
    if (!editor) {
      console.warn("DOM Action: Target input element not found for text injection");
      return false;
    }

    editor.focus();

    // Clear existing
    document.execCommand("selectAll", false, null);
    document.execCommand("delete", false, null);

    // Insert new text
    document.execCommand("insertText", false, text);

    // Trigger React/Wiz events
    editor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    await new Promise(r => setTimeout(r, 200)); // Small delay for framework state to sync
    return true;
  }

  async injectImage(blob, filename) {
    const file = new File([blob], filename || "ref.png", { type: blob.type || "image/png" });
    return await this.injectFile(file);
  }

  async injectFile(file) {
    // In Google Flow, we bypass Clipboard paste and natively inject into the hidden file input
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const targetInput = Array.from(fileInputs).find(input => {
       const accept = input.getAttribute('accept') || '';
       return accept.includes('image') || accept.includes('video') || input.style.display === 'none';
    });

    if (targetInput) {
       // Create DataTransfer
       const dt = new DataTransfer();
       dt.items.add(file);

       // Assign to native input and dispatch change
       targetInput.files = dt.files;
       targetInput.dispatchEvent(new Event('change', { bubbles: true }));

       // Wait for the thumbnail preview to appear (heuristic)
       await this.waitForThumbnail();
       await new Promise(r => setTimeout(r, 1500));
       return true;
    } else {
       console.warn("DOM Action: Google Flow file input not found. Falling back to paste simulation.");

       const editor = this.getEditor();
       if (!editor) return false;

       editor.focus();
       const dt = new DataTransfer();
       dt.items.add(file);

       const pasteEvent = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt });
       editor.dispatchEvent(pasteEvent);

       await this.waitForThumbnail();
       await new Promise(r => setTimeout(r, 1500));
       return true;
    }
  }

  async waitForThumbnail() {
    // Look for generic thumbnail containers in the input area
    // This varies heavily, but often they add an img or a div with background-image inside the prompt wrapper
    // We'll wait up to 5 seconds
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        // Looking for close buttons or generic image/video thumbnails in the prompt bar
        const thumbnails = document.querySelectorAll('button[aria-label*="Remove image"], button[aria-label*="Quitar"], img[src^="blob:"], video[src^="blob:"]');
        if (thumbnails.length > 0 || attempts > 20) {
          clearInterval(interval);
          resolve(); // Resolve anyway after 5s to avoid complete stall
        }
      }, 250);
    });
  }

  async clickSend() {
    return new Promise(async (resolve) => {
      // 1. Wait for Send button to be enabled (accounting for image upload processing time)
      let btnReady = false;
      let btn = null;
      for (let i = 0; i < 20; i++) { // max 10 seconds (20 * 500ms)
         btn = this.getSendButton();
         if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== "true") {
           btnReady = true;
           break;
         }
         await new Promise(r => setTimeout(r, 500));
      }

      const editor = this.getEditor();
      if (!editor) return resolve(false);

      // Attempt to submit and verify editor clears
      let submitAttempts = 0;
      while (submitAttempts < 3) {
         if (btnReady && btn) {
           btn.click();
         } else {
           // Fallback Enter
           editor.dispatchEvent(new KeyboardEvent('keydown', { key: "Enter", code: "Enter", keyCode: 13, bubbles: true, cancelable: true }));
         }

         await new Promise(r => setTimeout(r, 800)); // buffer for DOM clear

         // Verify submission by checking if editor content was cleared
         if (editor.textContent.trim().length === 0) {
           return resolve(true);
         }

         submitAttempts++;
         btn = this.getSendButton(); // Refresh reference
      }

      // If we exit loop, it might have failed to send
      console.error("DOM Action: Failed to submit prompt after 3 attempts.");
      resolve(false);
    });
  }

  hasGeneratedImage() {
    const containers = document.querySelectorAll('message-content, model-response, div[data-message-author="bot"], div.image-container');
    if (containers.length > 0) {
      const last = containers[containers.length - 1];
      const imgs = last.querySelectorAll('img[src*="googleusercontent.com"]:not([src*="avatar"])');
      const vids = last.querySelectorAll('video'); // Check for Google Flow video renders

      if (vids.length > 0) return true;

      for (let i = 0; i < imgs.length; i++) {
         if (imgs[i].complete && imgs[i].naturalWidth > 300) {
           return true;
         }
      }
    }
    return false;
  }

  hasTextCodeblockResponse() {
    const containers = document.querySelectorAll('message-content, model-response, div[data-message-author="bot"]');
    if (containers.length > 0) {
      const last = containers[containers.length - 1];
      // Check for codeblocks or significant text blocks without images
      const codeblocks = last.querySelectorAll('pre, code');
      if (codeblocks.length > 0) return true;
    }
    return false;
  }

  async getLatestResponseText() {
    const containers = document.querySelectorAll('message-content, model-response, div[data-message-author="bot"]');
    if (containers.length > 0) {
      const last = containers[containers.length - 1];
      return last.innerText || last.textContent;
    }
    return null;
  }

  async waitForGeneration() {
    // Enforce a mandatory minimum sleep at the start to ensure the DOM has time
    // to transition out of input mode and into generation/streaming mode.
    await new Promise(r => setTimeout(r, 5000));

    return new Promise((resolve) => {
      let generationStarted = false;
      let checkInterval;

      const checkState = () => {
        // Handle native platform error cards (Safety rejections, network drops)
        const errorNodes = document.querySelectorAll('div, span, p');
        const hasError = Array.from(errorNodes).some(el => {
          const txt = el.textContent.trim().toLowerCase();
          return txt.includes('no se pudo completar la acción') || txt.includes('no se pudo generar la imagen');
        });

        if (hasError) {
           clearInterval(checkInterval);
           return resolve("REJECTED");
        }

        // Look for the "Stop generating" indicator
        let stopBtn = document.querySelector('button[aria-label*="Stop generating"], button[aria-label*="Detener"]');
        if (!stopBtn) {
          const icons = document.querySelectorAll('button mat-icon, mat-icon');
          stopBtn = Array.from(icons).find(el => el.textContent.trim() === 'stop_circle');
        }

        const loadingIndicators = document.querySelectorAll('.loading-indicator, [class*="shimmer"], [class*="skeleton"]');
        const isGenerating = !!stopBtn || loadingIndicators.length > 0;

        if (isGenerating) {
          generationStarted = true;
        } else {
          // Verify if a generated image already securely mounted in the newest response
          if (this.hasGeneratedImage()) {
             clearInterval(checkInterval);
             return resolve(true); // Image explicitly generated, fast exit
          }

          // Fallback verify the Send Button state
          const btn = this.getSendButton();
          const isButtonReady = btn && !btn.disabled && btn.getAttribute('aria-disabled') !== "true";

          if (isButtonReady) {
            clearInterval(checkInterval);
            setTimeout(() => resolve(true), 2500);
          }
        }
      };

      checkInterval = setInterval(checkState, 500);

      // Safety timeout for image/video generation increased to allow ample time for 10s Google Flow generation
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 120000);
    });
  }

  stopDetection() {
     // Called if user stops flow while waiting. Handled via orchestrator flag usually, but we could clear intervals here if tracked globally.
  }
}

window.GeminiFlowDOMActions = GeminiFlowDOMActions;
