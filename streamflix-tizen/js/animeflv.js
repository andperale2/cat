/**
 * AnimeFlv JavaScript Extractor
 * Migrated from the Android Kotlin provider.
 */

const AnimeFLV = {
    baseUrl: "https://www3.animeflv.net",

    /**
     * Fetch standard page content and parse it using DOMParser.
     * Note: In a Tizen Web App, Cross-Origin Resource Sharing (CORS) rules apply.
     * To bypass this in a TV environment or testing, we may need a CORS proxy
     * or ensure Tizen config.xml <access origin="*" /> handles it (it usually does on device).
     */
    async fetchHtml(path) {
        try {
            const response = await fetch(`${this.baseUrl}${path}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            const parser = new DOMParser();
            return parser.parseFromString(text, "text/html");
        } catch (error) {
            console.error("Error fetching AnimeFLV:", error);
            return null;
        }
    },

    /**
     * Gets the latest episodes from the home page.
     */
    async getLatestEpisodes() {
        const doc = await this.fetchHtml('/');
        if (!doc) return [];

        const items = doc.querySelectorAll('ul.ListEpisodios li');
        const episodes = [];

        items.forEach(item => {
            const linkElement = item.querySelector('a');
            if (!linkElement) return;

            let showUrl = linkElement.getAttribute('href');
            if (!showUrl) return;

            // e.g. /ver/boku-no-hero-academia-1
            showUrl = showUrl.replace('/ver/', '/anime/');
            const lastDashIndex = showUrl.lastIndexOf('-');
            showUrl = showUrl.substring(0, lastDashIndex); // /anime/boku-no-hero-academia

            const id = showUrl.substring(showUrl.lastIndexOf('/') + 1);
            const titleEl = item.querySelector('strong.Title');
            const title = titleEl ? titleEl.textContent.trim() : "";

            const imgEl = item.querySelector('span.Image img');
            let poster = imgEl ? imgEl.getAttribute('src') : "";
            if (poster && !poster.startsWith('http')) {
                poster = `${this.baseUrl}${poster}`;
            }
            poster = poster.replace('thumbs', 'covers');

            episodes.push({
                id: id,
                title: title,
                poster: poster
            });
        });

        // Filter duplicates by id
        return Array.from(new Map(episodes.map(item => [item.id, item])).values());
    },

    /**
     * Gets trending/added shows.
     */
    async getTrendingShows() {
        const doc = await this.fetchHtml('/browse?order=added&page=1');
        if (!doc) return [];

        const items = doc.querySelectorAll('ul.ListAnimes li article');
        const shows = [];

        items.forEach(item => {
            const button = item.querySelector('div.Description a.Button');
            if (!button) return;

            const url = button.getAttribute('href');
            const id = url.substring(url.lastIndexOf('/') + 1);

            const titleEl = item.querySelector('a h3');
            const title = titleEl ? titleEl.textContent.trim() : "";

            const imgEl = item.querySelector('a div.Image figure img');
            let poster = imgEl ? imgEl.getAttribute('src') : "";
            if (poster && !poster.startsWith('http')) {
                poster = `${this.baseUrl}${poster}`;
            }

            shows.push({
                id: id,
                title: title,
                poster: poster
            });
        });

        return shows;
    },

    /**
     * Gets popular shows by rating.
     */
    async getPopularShows() {
        const doc = await this.fetchHtml('/browse?order=rating&page=1');
        if (!doc) return [];

        const items = doc.querySelectorAll('ul.ListAnimes li article');
        const shows = [];

        items.forEach(item => {
            const button = item.querySelector('div.Description a.Button');
            if (!button) return;

            const url = button.getAttribute('href');
            const id = url.substring(url.lastIndexOf('/') + 1);

            const titleEl = item.querySelector('a h3');
            const title = titleEl ? titleEl.textContent.trim() : "";

            const imgEl = item.querySelector('a div.Image figure img');
            let poster = imgEl ? imgEl.getAttribute('src') : "";
            if (poster && !poster.startsWith('http')) {
                poster = `${this.baseUrl}${poster}`;
            }

            shows.push({
                id: id,
                title: title,
                poster: poster
            });
        });

        return shows;
    }
};
