/**
 * Main Application Controller for Kino-Light Tizen TV
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log('[Kino-Light] Initializing Tizen TV App...');
    setupEventListeners();
    await loadCategories();
    await loadCatalog('all');
}

function setupEventListeners() {
    window.navEngine.on('closeDetail', () => closeDetailModal());
    window.navEngine.on('backFromPlayer', () => window.player.close());

    const btnPlay = document.getElementById('btn-play-now');
    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            const currentItem = btnPlay.dataset.currentItem ? JSON.parse(btnPlay.dataset.currentItem) : null;
            if (currentItem) {
                playMediaItem(currentItem);
            }
        });
    }

    const btnCloseDetail = document.getElementById('btn-close-detail');
    if (btnCloseDetail) {
        btnCloseDetail.addEventListener('click', () => closeDetailModal());
    }
}

async function loadCategories() {
    try {
        const categories = await window.kinoApi.getCategories();
        const navContainer = document.getElementById('category-nav');
        navContainer.innerHTML = '';

        categories.forEach((cat, index) => {
            const btn = document.createElement('button');
            btn.className = `nav-item focusable ${index === 0 ? 'active' : ''}`;
            btn.textContent = cat.name;
            btn.dataset.id = cat.id;

            btn.addEventListener('click', async () => {
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('current-category-title').textContent = cat.name;
                await loadCatalog(cat.id);
            });

            navContainer.appendChild(btn);
        });
    } catch (err) {
        console.error('[Kino-Light] Error loading categories:', err);
    }
}

async function loadCatalog(categoryId = 'all') {
    try {
        const catalog = await window.kinoApi.getCatalog(categoryId);
        const grid = document.getElementById('catalog-grid');
        grid.innerHTML = '';

        catalog.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'media-card focusable';
            card.tabIndex = 0;
            card.dataset.id = item.id;

            card.innerHTML = `
                <img src="${item.poster}" alt="${item.title}" loading="lazy" />
                <div class="card-info">
                    <div class="card-title">${item.title}</div>
                </div>
            `;

            card.addEventListener('click', () => openDetailModal(item.id));
            grid.appendChild(card);
        });

        window.navEngine.setView('main');
    } catch (err) {
        console.error('[Kino-Light] Error loading catalog:', err);
    }
}

async function openDetailModal(id) {
    try {
        const detail = await window.kinoApi.getItemDetail(id);

        document.getElementById('detail-title').textContent = detail.title;
        document.getElementById('detail-synopsis').textContent = detail.synopsis || detail.description;
        document.getElementById('detail-year').textContent = detail.year || '2024';
        document.getElementById('detail-rating').textContent = `★ ${detail.rating || '8.0'}`;
        document.getElementById('detail-duration').textContent = detail.duration || '120 min';

        const backdrop = document.getElementById('detail-backdrop');
        if (detail.backdrop || detail.poster) {
            backdrop.style.backgroundImage = `url('${detail.backdrop || detail.poster}')`;
        }

        const btnPlay = document.getElementById('btn-play-now');
        btnPlay.dataset.currentItem = JSON.stringify(detail);

        document.getElementById('detail-modal').classList.remove('hidden');
        window.navEngine.setView('detail');
    } catch (err) {
        console.error('[Kino-Light] Error opening item detail:', err);
    }
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
    window.navEngine.setView('main');
}

async function playMediaItem(item) {
    try {
        closeDetailModal();
        window.navEngine.setView('player');

        const streamInfo = await window.kinoApi.getStreamUrl(item.id);
        const streamUrl = streamInfo.streamUrl || item.streamUrl;

        window.player.playStream(streamUrl, item.title);
    } catch (err) {
        console.error('[Kino-Light] Error playing item:', err);
    }
}
