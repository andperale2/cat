/* GeminiFlow DOM Actions (dom_actions.js) */

class GeminiFlowDOMActions {
  constructor() {
    this.observer = null;
  }

  getEditor() {
    // Gemini's input is typically a contenteditable div
    return document.querySelector('div[contenteditable="true"]') ||
           document.querySelector('rich-textarea') ||
           document.querySelector('.ql-editor');
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
    if (!editor) throw new Error("Could not find prompt editor");

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
  }

  async injectImage(blob, filename) {
    const file = new File([blob], filename || "ref.png", { type: blob.type || "image/png" });
    await this.injectFile(file);
  }

  async injectFile(file) {
    const editor = this.getEditor();
    if (!editor) throw new Error("Could not find prompt editor for file injection");

    editor.focus();

    // Create DataTransfer (fresh instance per injection avoids duplication)
    const dt = new DataTransfer();
    dt.items.clear();
    dt.items.add(file);

    // Create paste event
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: dt
    });

    // Dispatch to editor
    editor.dispatchEvent(pasteEvent);

    // Wait for the thumbnail preview to appear (heuristic)
    await this.waitForThumbnail();

    // Add a tiny buffer so Gemini's React state processes the file before moving to the next
    await new Promise(r => setTimeout(r, 1500));
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
    const containers = document.querySelectorAll('message-content, model-response, div[data-message-author="bot"]');
    if (containers.length > 0) {
      const last = containers[containers.length - 1];
      const imgs = last.querySelectorAll('img[src*="googleusercontent.com"]:not([src*="avatar"])');
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

  async waitForGeneration() {
    // Enforce a mandatory minimum sleep at the start to ensure the DOM has time
    // to transition out of input mode and into generation/streaming mode.
    await new Promise(r => setTimeout(r, 5000));

    return new Promise((resolve) => {
      let generationStarted = false;
      let checkInterval;

      const checkState = () => {
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

      // Safety timeout for image generation: 90 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 90000);
    });
  }

  stopDetection() {
     // Called if user stops flow while waiting. Handled via orchestrator flag usually, but we could clear intervals here if tracked globally.
  }
}

window.GeminiFlowDOMActions = GeminiFlowDOMActions;
