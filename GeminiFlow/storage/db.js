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
            { step: 1, prompt: "Live-action realistic version of this frame, photographic, true-to-life skin and textures. Keep the original composition and pose of @1. A focused character stands in @2, calm and resolute expression. Medium shot, slight low angle. Cinematic atmosphere, cold ambient base, warm practical highlights, subtle fog in background, fine film grain, shallow depth of field. Avoid: anime, cartoon, illustration, distorted hands, extra limbs, plastic skin, on-screen text.", delay: 4000 },
            { step: 2, prompt: "SCENE @1 vs @2 | SHOT 1 5S I2V. REFS: @1 the attacker, @2 the defender, @3 the arena plate. @1 attacks relentlessly with rapid strikes; @2 remains completely still with arms crossed. At the exact instant of each blow, a sharp impact particle burst snaps up to parry then immediately vanishes. Dynamic handheld camera orbiting the fighters with slight whip-in on impact. Granular weight and thuds. COLOR GRADE: cinematic film, cool desaturated base, warm practical highlights, filmic contrast, subtle teal-orange, fine grain, anamorphic. AVOID: deformed limbs, fused fingers, permanent standing shields, weightless particles, @2 moving his body.", delay: 4000 },
            { step: 3, prompt: "SCENE @1 vs @2 | 15S SEQUENCE. OPENING (0-2s): High overhead shot of @2 standing alone in center of @3. STRIKE 1 (2-4s): @1 blurs in at high speed behind @2. RAPID FLURRY (4-12s): Relentless assault from alternating angles; sand parries later and harder each time. FINISH (12-15s): @1 lands a decisive clean hit flush on target, whip-pan with micro slow-motion on impact. COLOR GRADE: cinematic film, cool desaturated base, fine grain. AVOID: cartoon look, duplicate limbs, floating particles, melting faces.", delay: 4000 }
          ]
        });
      }
      return db;
    });
  }

  async saveFlow(flow) {
    await this.init();
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
