/**
 * Kino-Light API Service
 * Handles API authentication, content discovery, details, and stream URLs.
 */

class KinoApiService {
    constructor(baseUrl = 'https://api.kino-light.example.com') {
        this.baseUrl = baseUrl;
        this.token = null;
        this.useMock = true; // Default to mock mode until real backend URL is configured
        this.defaultHeaders = {
            'User-Agent': 'KinoLight-TizenTV/1.0 (SmartTV; Tizen OS)',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, '');
        this.useMock = false;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }

    async authenticate(credentials = {}) {
        if (this.useMock) {
            this.token = 'mock-jwt-token-kino-light';
            this.setToken(this.token);
            return { success: true, token: this.token, user: { id: 1, name: 'Tizen User' } };
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            if (data.token) {
                this.setToken(data.token);
            }
            return data;
        } catch (error) {
            console.error('[KinoApi] Auth error:', error);
            throw error;
        }
    }

    async getCategories() {
        if (this.useMock) {
            return [
                { id: 'all', name: 'Todo' },
                { id: 'movies', name: 'Películas' },
                { id: 'series', name: 'Series' },
                { id: 'anime', name: 'Anime' },
                { id: 'trending', name: 'Tendencias' }
            ];
        }

        const response = await fetch(`${this.baseUrl}/api/v1/categories`, {
            headers: this.defaultHeaders
        });
        return await response.json();
    }

    async getCatalog(categoryId = 'all', page = 1) {
        if (this.useMock) {
            return this._getMockCatalog(categoryId);
        }

        const response = await fetch(`${this.baseUrl}/api/v1/catalog?category=${categoryId}&page=${page}`, {
            headers: this.defaultHeaders
        });
        return await response.json();
    }

    async getItemDetail(id) {
        if (this.useMock) {
            const catalog = this._getMockCatalog('all');
            const item = catalog.find(i => String(i.id) === String(id)) || catalog[0];
            return {
                ...item,
                synopsis: item.description,
                genres: ['Acción', 'Aventura', 'Sci-Fi'],
                year: '2024',
                duration: '120 min',
                rating: '8.5',
                episodes: item.type === 'series' ? [
                    { id: `${id}_e1`, episodeNumber: 1, title: 'Episodio 1: El Comienzo', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
                    { id: `${id}_e2`, episodeNumber: 2, title: 'Episodio 2: El Descubrimiento', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' }
                ] : null
            };
        }

        const response = await fetch(`${this.baseUrl}/api/v1/items/${id}`, {
            headers: this.defaultHeaders
        });
        return await response.json();
    }

    async getStreamUrl(id) {
        if (this.useMock) {
            // Public test HLS stream
            return {
                streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                type: 'hls'
            };
        }

        const response = await fetch(`${this.baseUrl}/api/v1/stream/${id}`, {
            headers: this.defaultHeaders
        });
        return await response.json();
    }

    _getMockCatalog(category) {
        const mockItems = [
            {
                id: '1',
                title: 'Cyberpunk Odyssey',
                type: 'movie',
                category: 'movies',
                poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop',
                backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop',
                description: 'En un futuro distópico, un hacker lucha por descubrir la verdad tras la simulación.',
                streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
            },
            {
                id: '2',
                title: 'Starlight Vanguard',
                type: 'series',
                category: 'series',
                poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop',
                backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop',
                description: 'Una tripulación espacial explora los confines del universo conocido.',
                streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
            },
            {
                id: '3',
                title: 'Kitsune Legend',
                type: 'anime',
                category: 'anime',
                poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop',
                backdrop: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop',
                description: 'La leyenda de un espíritu zorro que protege la aldea oculta.',
                streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
            },
            {
                id: '4',
                title: 'Neon Horizon',
                type: 'movie',
                category: 'trending',
                poster: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop',
                backdrop: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop',
                description: 'Carreras clandestinas en las calles iluminadas por neón.',
                streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
            },
            {
                id: '5',
                title: 'Chronos Paradox',
                type: 'movie',
                category: 'movies',
                poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop',
                backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop',
                description: 'Viajes en el tiempo y ramificaciones temporales imprevistas.',
                streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
            },
            {
                id: '6',
                title: 'Shadow Realm',
                type: 'series',
                category: 'series',
                poster: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=500&auto=format&fit=crop',
                backdrop: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=1200&auto=format&fit=crop',
                description: 'Sombras misteriosas acechan en el mundo oscuro.',
                streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
            }
        ];

        if (!category || category === 'all') {
            return mockItems;
        }
        return mockItems.filter(item => item.category === category || category === 'trending');
    }
}

window.kinoApi = new KinoApiService();
