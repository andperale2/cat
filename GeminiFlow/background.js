/* GeminiFlow Background Service Worker */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_IMAGE") {
    // Fetch image from URL, bypassing CORS as background workers have greater privileges
    fetch(request.url)
      .then(response => {
        if (!response.ok) throw new Error(\`Network response was not ok: \${response.status}\`);
        return response.blob();
      })
      .then(blob => {
        // Convert blob to Base64 data URL to send back to content script
        return blob.arrayBuffer().then(buffer => {
          // Convert arrayBuffer to Base64
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          const mimeType = blob.type || 'image/jpeg';
          sendResponse({ success: true, data: `data:${mimeType};base64,${base64}` });
        });
      })
      .catch(error => {
        console.error("GeminiFlow Background Fetch Error:", error);
        sendResponse({ success: false, error: error.toString() });
      });

    // Return true to indicate we wish to send a response asynchronously
    return true;
  }
});
