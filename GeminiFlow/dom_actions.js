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
              document.querySelector('.send-button');

    if (!btn) {
      // Find mat-icon that contains "send" text
      const icons = document.querySelectorAll('button mat-icon');
      const icon = Array.from(icons).find(el => el.textContent.trim() === 'send');
      if (icon) {
        btn = icon.closest('button');
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
    return new Promise((resolve) => {
      let attempts = 0;

      const tryClick = () => {
        attempts++;
        const btn = this.getSendButton();

        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== "true") {
          btn.click();
          resolve(true);
        } else if (attempts < 30) { // 15 seconds max (30 * 500ms)
          setTimeout(tryClick, 500);
        } else {
          // Fallback to Enter key
          console.log("Send button not ready, trying Enter key fallback");
          const editor = this.getEditor();
          if (editor) {
            editor.dispatchEvent(new KeyboardEvent('keydown', { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
          }
          resolve(false);
        }
      };

      tryClick();
    });
  }

  async waitForGeneration() {
    return new Promise((resolve) => {
      let generationStarted = false;
      let checkInterval;

      const checkState = () => {
        // Look for the "Stop generating" indicator
        let stopBtn = document.querySelector('button[aria-label*="Stop generating"]');
        if (!stopBtn) {
          const icons = document.querySelectorAll('button mat-icon, mat-icon');
          stopBtn = Array.from(icons).find(el => el.textContent.trim() === 'stop_circle');
        }

        // Look for generic loading dots/spinners inside message containers
        const loadingIndicators = document.querySelectorAll('.loading-indicator, [class*="shimmer"], [class*="skeleton"]');

        const isGenerating = !!stopBtn || loadingIndicators.length > 0;

        if (isGenerating) {
          generationStarted = true;
        } else if (generationStarted && !isGenerating) {
          // Extra verification: Check if send button is re-enabled to confirm generation is TRULY finished
          const btn = this.getSendButton();
          const isButtonReady = btn && !btn.disabled && btn.getAttribute('aria-disabled') !== "true";

          if (isButtonReady) {
            clearInterval(checkInterval);
            // Wait a tiny bit extra for DOM to completely settle images
            setTimeout(() => resolve(true), 2500);
          }
        }
      };

      // Poll every 500ms
      checkInterval = setInterval(checkState, 500);

      // Safety timeout: extended to 3 minutes for long generation delays
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false); // timeout
      }, 180000);
    });
  }

  stopDetection() {
     // Called if user stops flow while waiting. Handled via orchestrator flag usually, but we could clear intervals here if tracked globally.
  }
}

window.GeminiFlowDOMActions = GeminiFlowDOMActions;
