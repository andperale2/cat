// IndexedDB Wrapper for GeminiFlow

const DB_NAME = "GeminiFlowDB";
const DB_VERSION = 1;
const FLOWS_STORE = "flows";
const ASSETS_STORE = "assets"; // Stores shortcodes and their corresponding image blobs

class DB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(FLOWS_STORE)) {
          db.createObjectStore(FLOWS_STORE, { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains(ASSETS_STORE)) {
          // Key is the shortcode (e.g., "@foto1")
          db.createObjectStore(ASSETS_STORE, { keyPath: "shortcode" });
        }
      };
    }).then(async (db) => {
      // Seed default preset if none exist
      const flows = await this.getAllFlows();
      if (flows.length === 0) {
        await this.saveFlow({
          name: "Anime to Live-Action (AAS)",
          steps: [
            { step: 1, prompt: "De-blur, sharpen, and denoise this anime frame into an ultra-crisp studio keyframe. Reconstruct and define clean contours, correct facial symmetry, natural hand structure with exactly 5 fingers per hand, and sharp fabric folds. Preserve the exact composition and color palette of the source. Avoid: blur, pixelation, compression artifacts, distorted anatomy, extra limbs, fused fingers, cartoon smear.", delay: 4000 },
            { step: 2, prompt: "Live-action cinematic photograph based on the restored composition @foto1. Convert into photorealistic human skin texture, authentic fabric, natural hair strands, and physically accurate lighting. Enforce strict human biological proportions: exactly two arms, two legs, and five fingers per hand. Cinematic medium shot, 35mm film grain, anamorphic lens contrast, deep shadows. Avoid: anime drawing, 2D contours, plastic CGI skin, duplicate limbs, third arm, extra legs, fused fingers, body morphing, mutant anatomy.", delay: 4000 },
            { step: 3, prompt: "Cinematic action shot: @foto2 (the attacker) vs @2 (the defender) in a dynamic combat pose at @3 (the arena). @foto2 attacks relentlessly with rapid strikes surrounded by @EFFECT1; @2 remains completely still with arms crossed, projecting @EFFECT2 to parry the blows. Sharp impact particle burst on collision. Dynamic handheld camera angle, slight whip-in effect. Granular weight and thuds. COLOR GRADE: cinematic film, cool desaturated base, warm practical highlights, filmic contrast, fine grain, anamorphic.", delay: 4000 },
            { step: 4, prompt: "Cinematic action shot: @foto2 lands a decisive clean hit flush on target against @2. @foto2 blurs in at high speed, unleashing a massive burst of @EFFECT1. Micro slow-motion impact moment. High overhead or dynamic angle showing the sheer force of the blow. COLOR GRADE: cinematic film, cool desaturated base, fine grain.", delay: 4000 }
          ]
        });
      }
      return db;
    });
  }

  async saveFlow(flow) {
    await this.init();

    // Perform upsert deduplication by checking name if ID isn't provided
    if (!flow.id) {
      const existingFlows = await this.getAllFlows();
      const match = existingFlows.find(f => f.name.trim().toLowerCase() === flow.name.trim().toLowerCase());
      if (match) {
        flow.id = match.id;
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([FLOWS_STORE], "readwrite");
      const store = transaction.objectStore(FLOWS_STORE);

      const request = flow.id ? store.put(flow) : store.add(flow);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFlow(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([FLOWS_STORE], "readonly");
      const store = transaction.objectStore(FLOWS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFlows() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([FLOWS_STORE], "readonly");
      const store = transaction.objectStore(FLOWS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFlow(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([FLOWS_STORE], "readwrite");
      const store = transaction.objectStore(FLOWS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Asset Management (Images)
  async saveAsset(shortcode, blob, filename) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ASSETS_STORE], "readwrite");
      const store = transaction.objectStore(ASSETS_STORE);
      const request = store.put({ shortcode, blob, filename });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAsset(shortcode) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ASSETS_STORE], "readonly");
      const store = transaction.objectStore(ASSETS_STORE);
      const request = store.get(shortcode);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAssets() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ASSETS_STORE], "readonly");
      const store = transaction.objectStore(ASSETS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAsset(shortcode) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([ASSETS_STORE], "readwrite");
      const store = transaction.objectStore(ASSETS_STORE);
      const request = store.delete(shortcode);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Attach DB to window for global access across content scripts
window.GeminiFlowDB = new DB();
