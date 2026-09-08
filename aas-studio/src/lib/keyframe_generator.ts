/**
 * keyframe_generator.ts
 * Stage 0: Client-side video frame extraction using native HTML5 Video APIs.
 */

export async function extractRawKeyframe(videoFile: File, timeInSeconds: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(videoFile);

    video.src = objectUrl;
    video.crossOrigin = "anonymous";
    video.muted = true;

    // Once metadata is loaded, seek to the exact time
    video.onloadedmetadata = () => {
      // Clamp time safely within duration
      video.currentTime = Math.min(timeInSeconds, video.duration - 0.1);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get 2D context");
        }

        // Draw the current frame onto the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Export as JPEG Data URI
        const dataUri = canvas.toDataURL("image/jpeg", 0.9);

        // Cleanup
        URL.revokeObjectURL(objectUrl);
        video.remove();
        canvas.remove();

        resolve(dataUri);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Video loading failed."));
    };
  });
}
