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
            { step: 1, prompt: "Cinematic 35mm photograph of the character in @1. Photorealistic human skin, authentic fabric, natural studio lighting, anamorphic lens contrast, shallow depth of field. Avoid: anime drawing, plastic CGI skin, text, illustrations.", delay: 4000 },
            { step: 2, prompt: "Cinematic 35mm photograph of the character in @2. Photorealistic human skin, authentic fabric, natural studio lighting, anamorphic lens contrast, shallow depth of field. Avoid: anime drawing, plastic CGI skin, text, illustrations.", delay: 4000 },
            { step: 3, prompt: "Cinematic sequence: @foto1 attacks with rapid kinetic strikes; @foto2 remains still, parrying. Sharp impact particle burst on collision. Dynamic camera orbiting with slight whip-in. @foto1 lands a decisive clean hit, whip-pan with slow-motion impact. Cinematic film grading.", delay: 4000 }
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
