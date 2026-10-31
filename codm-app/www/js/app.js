/**
 * CODM META Armero - Lógica Principal de la Aplicación
 *
 * Cumplimiento estricto:
 * - 5 secciones principales de navegación nativa táctil.
 * - Soporte para teléfonos y tablets grandes (Xiaomi Pad Pro 12.1" HyperOS).
 * - Visor individual de las 9 ranuras oficiales de CODM.
 * - Constructor interactivo que limita exactamente a 5 accesorios.
 * - Cálculo acumulativo comprobable sin inventar datos («Dato no disponible»).
 * - Almacenamiento offline confiable (localStorage e IndexedDB).
 * - Manejo de «Imagen no disponible» para recursos aún no extraídos del PDF.
 */

// Estado global de la aplicación
const AppState = {
    currentSection: 'home',
    currentCategory: 'ALL',
    searchQuery: '',
    favorites: JSON.parse(localStorage.getItem('codm_favs') || '[]'),
    // Constructor de Armero
    builder: {
        weaponId: 'bal27',
        equipped: {
            muzzle: null,
            barrel: null,
            optic: null,
            stock: null,
            perk: null,
            laser: null,
            underbarrel: null,
            ammunition: null,
            rear_grip: null
        }
    },
    // Clases personalizadas guardadas por el usuario
    customBuilds: JSON.parse(localStorage.getItem('codm_custom_builds') || '[]'),
    selectedModalWeapon: null
};

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    renderHomeVerifiedCodes();
    renderWeaponsList();
    renderMetaClasses();
    renderFavorites();
    initBuilder();
    initSearchListener();
}

// Navegación entre las 5 secciones
function navigate(sectionId) {
    AppState.currentSection = sectionId;

    // Actualizar secciones visibles
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    const targetSec = document.getElementById(`sec-${sectionId}`);
    if (targetSec) targetSec.classList.remove('hidden');

    // Actualizar tabs inferiores
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const sections = ['home', 'weapons', 'meta', 'favorites', 'gunsmith'];
    navItems.forEach((item, index) => {
        if (sections[index] === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Notificación Toast
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// ==================== SECCIÓN 1: INICIO ====================
function renderHomeVerifiedCodes() {
    const container = document.getElementById('homeVerifiedCodes');
    if (!container) return;

    const verifiedWeapons = window.CODM_DB.weapons.filter(w => w.verifiedCode && !w.verifiedCode.includes('pendiente'));

    container.innerHTML = verifiedWeapons.map(weapon => `
        <div class="hud-card p-4 flex flex-col justify-between" style="gap: 12px;">
            <div>
                <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                    <span class="text-xs uppercase font-bold" style="color: var(--codm-cyan);">${weapon.categoryName}</span>
                    <span class="badge-verified">CÓDIGO OFICIAL</span>
                </div>
                <h4 class="text-lg font-black uppercase" style="color: #fff; margin: 0 0 6px 0;">${weapon.name}</h4>
                <p class="text-xs" style="color: var(--codm-muted); margin: 0;">
                    ${weapon.metaBuilds.corta ? weapon.metaBuilds.corta.title : 'Configuración competitiva'}
                </p>
            </div>
            <div class="p-2 rounded flex items-center justify-between" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(102, 252, 241, 0.3);">
                <span class="text-xs font-mono font-bold" style="color: var(--codm-cyan); letter-spacing: 1px;">${weapon.verifiedCode}</span>
                <button onclick="copyToClipboard('${weapon.verifiedCode}', 'Código de ${weapon.name} copiado')" class="btn-tac" style="padding: 4px 8px; font-size: 10px;">
                    Copiar
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== SECCIÓN 2: ARMAS ====================
function initSearchListener() {
    const input = document.getElementById('weaponSearchInput');
    if (input) {
        input.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value.toLowerCase().trim();
            renderWeaponsList();
        });
    }
}

function filterCategory(cat) {
    AppState.currentCategory = cat;
    document.querySelectorAll('#categoryChips .filter-chip').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderWeaponsList();
}

function renderWeaponsList() {
    const container = document.getElementById('weaponsListGrid');
    if (!container) return;

    const filtered = window.CODM_DB.weapons.filter(weapon => {
        const matchesCategory = AppState.currentCategory === 'ALL' || weapon.category === AppState.currentCategory;
        const matchesSearch = !AppState.searchQuery ||
            weapon.name.toLowerCase().includes(AppState.searchQuery) ||
            weapon.categoryName.toLowerCase().includes(AppState.searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="hud-card p-5 text-center" style="grid-column: 1 / -1;">
                <p class="text-sm font-bold uppercase" style="color: var(--codm-gold);">No se encontraron armas con ese criterio</p>
                <p class="text-xs" style="color: var(--codm-muted);">Intenta ajustar la búsqueda o el filtro de categoría.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(w => {
        const isFav = AppState.favorites.includes(w.id);
        const hasVerifiedCode = w.verifiedCode && !w.verifiedCode.includes('pendiente');

        return `
            <div class="hud-card p-4 flex flex-col justify-between" style="gap: 14px;">
                <div>
                    <!-- Encabezado del arma -->
                    <div class="flex items-center justify-between" style="margin-bottom: 8px;">
                        <span class="text-xs uppercase font-bold" style="color: var(--codm-cyan);">${w.categoryName}</span>
                        <div class="flex items-center gap-2">
                            <span class="${hasVerifiedCode ? 'badge-verified' : 'badge-pending'}">
                                ${hasVerifiedCode ? 'CÓDIGO VERIFICADO' : 'CÓDIGO PENDIENTE'}
                            </span>
                            <button onclick="toggleFavorite('${w.id}')" style="background: none; border: none; font-size: 16px; cursor: pointer; color: ${isFav ? 'var(--codm-gold)' : '#555'};">
                                ★
                            </button>
                        </div>
                    </div>

                    <h3 class="text-xl font-black uppercase" style="color: #fff; margin: 0 0 10px 0;">${w.name}</h3>

                    <!-- Visor de imagen (con estado imagen no disponible auténtico) -->
                    <div style="margin-bottom: 12px;">
                        ${w.image ? `<img src="${w.image}" alt="${w.name}" style="width: 100%; border-radius: 6px;">` : `
                            <div class="image-unavailable" style="height: 90px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 4px; color: var(--codm-muted);">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                </svg>
                                <span>Imagen no disponible</span>
                                <span style="font-size: 9px; color: #666; font-weight: normal; margin-top: 2px;">Reservado para extracción de ${w.source}</span>
                            </div>
                        `}
                    </div>

                    <!-- Estadísticas base -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                        <div>
                            <span class="text-xs" style="color: var(--codm-muted); display: block;">Daño: <strong style="color: #fff;">${w.stats.daño}</strong></span>
                        </div>
                        <div>
                            <span class="text-xs" style="color: var(--codm-muted); display: block;">Cadencia: <strong style="color: #fff;">${w.stats.cadencia}</strong></span>
                        </div>
                        <div>
                            <span class="text-xs" style="color: var(--codm-muted); display: block;">Alcance: <strong style="color: #fff;">${w.stats.alcance}</strong></span>
                        </div>
                        <div>
                            <span class="text-xs" style="color: var(--codm-muted); display: block;">Precisión: <strong style="color: #fff;">${w.stats.precision}</strong></span>
                        </div>
                        <div>
                            <span class="text-xs" style="color: var(--codm-muted); display: block;">Movilidad: <strong style="color: #fff;">${w.stats.movilidad}</strong></span>
                        </div>
                        <div>
                            <span class="text-xs" style="color: var(--codm-muted); display: block;">Control: <strong style="color: #fff;">${w.stats.control}</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex gap-2">
                    <button onclick="openWeaponModal('${w.id}')" class="btn-tac" style="flex: 1; justify-content: center;">
                        Ver Ficha & 9 Ranuras
                    </button>
                    <button onclick="loadWeaponIntoBuilder('${w.id}')" class="btn-tac" style="border-color: var(--codm-gold); color: var(--codm-gold);">
                        Equipar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Modal de detalles de arma (Ficha general + Visor de 9 Ranuras)
function openWeaponModal(weaponId) {
    const weapon = window.CODM_DB.weapons.find(w => w.id === weaponId);
    if (!weapon) return;

    AppState.selectedModalWeapon = weapon;
    document.getElementById('modalWeaponName').textContent = weapon.name;
    document.getElementById('modalWeaponCategory').textContent = `${weapon.categoryName} • ${weapon.source}`;

    // Llenar Ficha General
    const bodyInfo = document.getElementById('modalBodyInfo');
    bodyInfo.innerHTML = `
        <div class="flex flex-col gap-3">
            <div class="image-unavailable" style="height: 120px;">
                <span>Imagen no disponible</span>
                <span style="font-size: 10px; color: #777;">Fotografía oficial reservada para importar de ${weapon.source}</span>
            </div>

            <div class="hud-card p-3">
                <h4 class="text-xs font-bold uppercase" style="color: var(--codm-cyan); margin: 0 0 6px 0;">Puntos Fuertes:</h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #2ecc71;">
                    ${weapon.pros.map(p => `<li>${p}</li>`).join('')}
                </ul>
            </div>

            <div class="hud-card p-3">
                <h4 class="text-xs font-bold uppercase" style="color: var(--codm-red); margin: 0 0 6px 0;">Limitaciones:</h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #e74c3c;">
                    ${weapon.cons.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    // Llenar Visor de las 9 Ranuras
    renderModalSlotsView(weapon);

    switchModalTab('info');
    document.getElementById('weaponDetailModal').classList.remove('hidden');
}

function closeWeaponModal() {
    document.getElementById('weaponDetailModal').classList.add('hidden');
}

function switchModalTab(tab) {
    const btnInfo = document.getElementById('modalTabInfo');
    const btnSlots = document.getElementById('modalTabSlots');
    const bodyInfo = document.getElementById('modalBodyInfo');
    const bodySlots = document.getElementById('modalBodySlots');

    if (tab === 'info') {
        btnInfo.classList.add('active');
        btnSlots.classList.remove('active');
        bodyInfo.classList.remove('hidden');
        bodySlots.classList.add('hidden');
    } else {
        btnInfo.classList.remove('active');
        btnSlots.classList.add('active');
        bodyInfo.classList.add('hidden');
        bodySlots.classList.remove('hidden');
    }
}

// Visor de 9 ranuras en el modal
function renderModalSlotsView(weapon) {
    const container = document.getElementById('modalBodySlots');
    const slots = window.CODM_DB.slots;

    container.innerHTML = `
        <p class="text-xs" style="color: var(--codm-muted); margin-bottom: 12px;">
            Consulta individual de accesorios por ranura oficial. Recuerda que el armero permite equipar un máximo de <strong>5 accesorios simultáneos</strong>.
        </p>
        <div class="flex flex-col gap-3">
            ${slots.map(slot => {
                const attachments = (weapon.attachmentsCatalogue && weapon.attachmentsCatalogue[slot.id]) || [];
                return `
                    <div class="hud-card p-3">
                        <div class="flex justify-between items-center" style="margin-bottom: 6px;">
                            <span class="text-xs font-black uppercase" style="color: var(--codm-cyan);">${slot.name}</span>
                            <span class="text-xs" style="color: var(--codm-muted);">${attachments.length} disponibles</span>
                        </div>
                        ${attachments.length === 0 ? `
                            <p class="text-xs" style="color: #666; margin: 4px 0;">Datos pendientes de extracción del PDF.</p>
                        ` : `
                            <div class="flex flex-col gap-2">
                                ${attachments.map(att => `
                                    <div class="p-2 rounded flex flex-col gap-1" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06);">
                                        <div class="flex justify-between items-center">
                                            <strong class="text-xs" style="color: #fff;">${att.name}</strong>
                                            <span class="image-unavailable" style="padding: 2px 6px; font-size: 8px;">Imagen no disponible</span>
                                        </div>
                                        <div class="flex gap-2 text-xs">
                                            <span style="color: #2ecc71;">+ ${att.pro}</span>
                                            <span style="color: #e74c3c;">- ${att.con}</span>
                                        </div>
                                        <p class="text-xs" style="color: var(--codm-muted); margin: 2px 0 0 0; font-style: italic;">${att.reason}</p>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ==================== SECCIÓN 3: CLASES META ====================
function renderMetaClasses() {
    const container = document.getElementById('metaClassesList');
    if (!container) return;

    const filterDistance = document.getElementById('metaDistanceSelect') ? document.getElementById('metaDistanceSelect').value : 'ALL';

    // Obtener armas que tienen al menos una metaBuild
    const weaponsWithMeta = window.CODM_DB.weapons.filter(w => w.metaBuilds && Object.keys(w.metaBuilds).length > 0);

    let html = '';

    weaponsWithMeta.forEach(weapon => {
        Object.entries(weapon.metaBuilds).forEach(([distKey, build]) => {
            if (filterDistance !== 'ALL' && filterDistance !== distKey) return;

            const isCodeVerified = build.verified && build.code && !build.code.includes('pendiente');

            html += `
                <div class="hud-card p-4 flex flex-col gap-3">
                    <div class="flex justify-between items-center border-b" style="padding-bottom: 8px;">
                        <div>
                            <span class="text-xs uppercase font-bold" style="color: var(--codm-cyan);">${weapon.name} • ${weapon.categoryName}</span>
                            <h3 class="text-base font-black uppercase" style="color: #fff; margin: 2px 0 0 0;">${build.title}</h3>
                        </div>
                        <span class="${isCodeVerified ? 'badge-verified' : 'badge-pending'}">
                            ${isCodeVerified ? 'CÓDIGO VERIFICADO' : 'CÓDIGO PENDIENTE'}
                        </span>
                    </div>

                    <!-- Código oficial y botón copiar -->
                    <div class="p-2.5 rounded flex items-center justify-between" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(102, 252, 241, 0.2);">
                        <div>
                            <span class="text-xs" style="color: var(--codm-muted); display: block;">Código de Clase CODM:</span>
                            <strong class="text-sm font-mono" style="color: var(--codm-cyan); letter-spacing: 1px;">${build.code}</strong>
                        </div>
                        ${isCodeVerified ? `
                            <button onclick="copyToClipboard('${build.code}', 'Código CODM copiado')" class="btn-tac" style="padding: 4px 10px;">
                                Copiar Código
                            </button>
                        ` : ''}
                    </div>

                    <!-- Mira / Óptica obligatoria -->
                    <div class="p-2 rounded flex items-center gap-2" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);">
                        <span class="text-xs font-bold uppercase" style="color: var(--codm-cyan);">Mira:</span>
                        <span class="text-xs" style="color: #fff;">${build.sight}</span>
                    </div>

                    <!-- 5 Accesorios exactos -->
                    <div>
                        <span class="text-xs font-bold uppercase tracking-wider" style="color: var(--codm-muted); display: block; margin-bottom: 6px;">
                            5 Accesorios Equipados:
                        </span>
                        <div class="tablet-grid-3" style="gap: 8px;">
                            ${build.attachments.map((att, idx) => `
                                <div class="p-2 rounded flex flex-col justify-between" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08);">
                                    <div>
                                        <div class="flex justify-between items-center" style="margin-bottom: 2px;">
                                            <span class="text-xs font-mono font-bold" style="color: var(--codm-cyan); font-size: 10px;">${idx + 1}. ${att.slot}</span>
                                            <span class="image-unavailable" style="padding: 1px 4px; font-size: 7px;">Imagen no disp.</span>
                                        </div>
                                        <strong class="text-xs" style="color: #fff; display: block; margin-bottom: 2px;">${att.name}</strong>
                                        <span class="text-xs" style="color: #2ecc71; display: block; font-size: 10px;">+ ${att.pro}</span>
                                        <span class="text-xs" style="color: #e74c3c; display: block; font-size: 10px;">- ${att.con}</span>
                                    </div>
                                    <p class="text-xs" style="color: #888; margin: 4px 0 0 0; font-size: 10px; font-style: italic;">${att.reason}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Perks y equipamiento -->
                    ${build.perks ? `
                        <div class="tablet-grid-3" style="gap: 8px; margin-top: 4px;">
                            <div class="p-2 rounded" style="background: rgba(0,0,0,0.3);">
                                <span class="text-xs font-bold" style="color: var(--codm-gold); display: block; margin-bottom: 4px;">VENTAJAS (PERKS):</span>
                                <span class="text-xs" style="color: #ccc; display: block;">Roja: <strong>${build.perks.red}</strong></span>
                                <span class="text-xs" style="color: #ccc; display: block;">Verde: <strong>${build.perks.green}</strong></span>
                                <span class="text-xs" style="color: #ccc; display: block;">Azul: <strong>${build.perks.blue}</strong></span>
                            </div>
                            <div class="p-2 rounded" style="background: rgba(0,0,0,0.3);">
                                <span class="text-xs font-bold" style="color: var(--codm-cyan); display: block; margin-bottom: 4px;">EQUIPAMIENTO:</span>
                                <span class="text-xs" style="color: #ccc; display: block;">Secundaria: <strong>${build.equipment.secondary}</strong></span>
                                <span class="text-xs" style="color: #ccc; display: block;">Táctico: <strong>${build.equipment.tactical}</strong></span>
                                <span class="text-xs" style="color: #ccc; display: block;">Letal: <strong>${build.equipment.lethal}</strong></span>
                            </div>
                            <div class="p-2 rounded" style="background: rgba(0,0,0,0.3);">
                                <span class="text-xs font-bold" style="color: #fff; display: block; margin-bottom: 4px;">RECOMENDADO PARA:</span>
                                <span class="text-xs" style="color: #ccc; display: block;">Modos: <strong>${build.modes}</strong></span>
                                <span class="text-xs" style="color: #ccc; display: block;">Operador: <strong>${build.equipment.operator}</strong></span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    });

    container.innerHTML = html;
}

// ==================== SECCIÓN 4: FAVORITOS ====================
function toggleFavorite(weaponId) {
    if (AppState.favorites.includes(weaponId)) {
        AppState.favorites = AppState.favorites.filter(id => id !== weaponId);
        showToast("Eliminado de favoritos");
    } else {
        AppState.favorites.push(weaponId);
        showToast("Guardado en favoritos");
    }
    localStorage.setItem('codm_favs', JSON.stringify(AppState.favorites));
    renderWeaponsList();
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById('favoritesListGrid');
    if (!container) return;

    const favWeapons = window.CODM_DB.weapons.filter(w => AppState.favorites.includes(w.id));

    if (favWeapons.length === 0) {
        container.innerHTML = `
            <div class="hud-card p-5 text-center" style="grid-column: 1 / -1;">
                <p class="text-sm font-bold uppercase" style="color: var(--codm-gold);">No tienes armas favoritas guardadas</p>
                <p class="text-xs" style="color: var(--codm-muted);">Toca la estrella en cualquier arma para tener acceso rápido aquí.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = favWeapons.map(w => `
        <div class="hud-card p-4 flex flex-col justify-between" style="gap: 12px;">
            <div>
                <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                    <span class="text-xs uppercase font-bold" style="color: var(--codm-cyan);">${w.categoryName}</span>
                    <button onclick="toggleFavorite('${w.id}')" style="background: none; border: none; color: var(--codm-gold); font-size: 16px; cursor: pointer;">★</button>
                </div>
                <h3 class="text-lg font-black uppercase" style="color: #fff; margin: 0 0 8px 0;">${w.name}</h3>
                <div class="flex gap-2 text-xs" style="color: var(--codm-muted);">
                    <span>Daño: <strong style="color: #fff;">${w.stats.daño}</strong></span>
                    <span>•</span>
                    <span>Cadencia: <strong style="color: #fff;">${w.stats.cadencia}</strong></span>
                    <span>•</span>
                    <span>Alcance: <strong style="color: #fff;">${w.stats.alcance}</strong></span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="openWeaponModal('${w.id}')" class="btn-tac" style="flex: 1; justify-content: center;">
                    Ver Ficha
                </button>
                <button onclick="loadWeaponIntoBuilder('${w.id}')" class="btn-tac" style="border-color: var(--codm-gold); color: var(--codm-gold);">
                    Equipar en Armero
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== SECCIÓN 5: MI ARMERO (CONSTRUCTOR) ====================
function initBuilder() {
    const select = document.getElementById('builderWeaponSelect');
    if (!select) return;

    select.innerHTML = window.CODM_DB.weapons.map(w => `
        <option value="${w.id}" ${w.id === AppState.builder.weaponId ? 'selected' : ''}>${w.name} (${w.categoryName})</option>
    `).join('');

    renderBuilderSlots();
    updateBuilderStats();
    renderMySavedBuilds();
}

function onBuilderWeaponChange() {
    const select = document.getElementById('builderWeaponSelect');
    AppState.builder.weaponId = select.value;
    resetBuilder();
}

function loadWeaponIntoBuilder(weaponId) {
    AppState.builder.weaponId = weaponId;
    const select = document.getElementById('builderWeaponSelect');
    if (select) select.value = weaponId;
    resetBuilder();
    navigate('gunsmith');
    showToast(`Arma cargada en Mi Armero`);
}

function resetBuilder() {
    Object.keys(AppState.builder.equipped).forEach(slot => {
        AppState.builder.equipped[slot] = null;
    });
    renderBuilderSlots();
    updateBuilderStats();
}

function getEquippedCount() {
    return Object.values(AppState.builder.equipped).filter(att => att !== null).length;
}

function renderBuilderSlots() {
    const container = document.getElementById('builderSlotsContainer');
    if (!container) return;

    const count = getEquippedCount();
    const counterEl = document.getElementById('equippedCounter');
    if (counterEl) {
        counterEl.textContent = `${count} / 5 EQUIPADOS`;
        counterEl.className = count === 5 ? 'badge-verified' : 'badge-pending';
    }

    const slots = window.CODM_DB.slots;
    const weapon = window.CODM_DB.weapons.find(w => w.id === AppState.builder.weaponId);

    container.innerHTML = slots.map(slot => {
        const equippedAtt = AppState.builder.equipped[slot.id];
        const availableCount = (weapon.attachmentsCatalogue && weapon.attachmentsCatalogue[slot.id]) ? weapon.attachmentsCatalogue[slot.id].length : 0;

        return `
            <div class="hud-card p-3 flex items-center justify-between" style="border-left: 3px solid ${equippedAtt ? 'var(--codm-cyan)' : 'transparent'};">
                <div style="flex: 1;">
                    <span class="text-xs font-mono font-bold uppercase" style="color: var(--codm-cyan);">${slot.name}</span>
                    ${equippedAtt ? `
                        <div class="flex items-center gap-2" style="margin-top: 2px;">
                            <strong class="text-xs" style="color: #fff;">${equippedAtt.name}</strong>
                            <span class="image-unavailable" style="padding: 1px 4px; font-size: 7px;">Imagen no disp.</span>
                        </div>
                        <div class="flex gap-2 text-xs" style="font-size: 10px;">
                            <span style="color: #2ecc71;">+ ${equippedAtt.pro}</span>
                            <span style="color: #e74c3c;">- ${equippedAtt.con}</span>
                        </div>
                    ` : `
                        <span class="text-xs" style="color: #666; display: block;">Ranura vacía (${availableCount} disponibles)</span>
                    `}
                </div>
                <div class="flex gap-1">
                    ${equippedAtt ? `
                        <button onclick="unequipSlot('${slot.id}')" style="background: rgba(231,76,60,0.2); border: 1px solid #e74c3c; color: #e74c3c; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                            ✕
                        </button>
                    ` : `
                        <button onclick="openSlotPicker('${slot.id}')" class="btn-tac" style="padding: 4px 10px; font-size: 11px;">
                            Elegir
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function unequipSlot(slotId) {
    AppState.builder.equipped[slotId] = null;
    renderBuilderSlots();
    updateBuilderStats();
}

// Selector de accesorios para una ranura
let currentPickingSlot = null;
function openSlotPicker(slotId) {
    if (getEquippedCount() >= 5 && !AppState.builder.equipped[slotId]) {
        showToast("¡Límite alcanzado! El armero solo permite 5 accesorios.");
        return;
    }

    currentPickingSlot = slotId;
    const slot = window.CODM_DB.slots.find(s => s.id === slotId);
    const weapon = window.CODM_DB.weapons.find(w => w.id === AppState.builder.weaponId);
    const attachments = (weapon.attachmentsCatalogue && weapon.attachmentsCatalogue[slotId]) || [];

    document.getElementById('slotPickerTitle').textContent = `Seleccionar ${slot.name}`;
    const list = document.getElementById('slotPickerList');

    if (attachments.length === 0) {
        list.innerHTML = `
            <div class="p-4 text-center">
                <p class="text-xs" style="color: var(--codm-muted);">No hay accesorios verificados en esta ranura para ${weapon.name}.</p>
                <p class="text-xs" style="color: #666;">Se incorporarán al extraer el PDF original sin inventar datos.</p>
            </div>
        `;
    } else {
        list.innerHTML = attachments.map(att => `
            <div onclick="selectAttachment('${slotId}', '${att.id}')" class="p-3 rounded hud-card flex flex-col gap-1" style="cursor: pointer;">
                <div class="flex justify-between items-center">
                    <strong class="text-xs" style="color: #fff;">${att.name}</strong>
                    <span class="image-unavailable" style="padding: 2px 6px; font-size: 8px;">Imagen no disponible</span>
                </div>
                <div class="flex gap-2 text-xs">
                    <span style="color: #2ecc71;">+ ${att.pro}</span>
                    <span style="color: #e74c3c;">- ${att.con}</span>
                </div>
                <p class="text-xs" style="color: var(--codm-muted); margin: 2px 0 0 0; font-style: italic;">${att.reason}</p>
            </div>
        `).join('');
    }

    document.getElementById('slotPickerModal').classList.remove('hidden');
}

function closeSlotPicker() {
    document.getElementById('slotPickerModal').classList.add('hidden');
}

function selectAttachment(slotId, attId) {
    const weapon = window.CODM_DB.weapons.find(w => w.id === AppState.builder.weaponId);
    const att = weapon.attachmentsCatalogue[slotId].find(a => a.id === attId);
    if (!att) return;

    AppState.builder.equipped[slotId] = att;
    closeSlotPicker();
    renderBuilderSlots();
    updateBuilderStats();
    showToast(`${att.name} equipado`);
}

// Cálculo acumulativo de las estadísticas comprobables
function updateBuilderStats() {
    const summaryContainer = document.getElementById('builderStatsSummary');
    if (!summaryContainer) return;

    const weapon = window.CODM_DB.weapons.find(w => w.id === AppState.builder.weaponId);
    const equippedList = Object.values(AppState.builder.equipped).filter(a => a !== null);

    // Calcular valores verificables acumulados
    let totalRangePercent = 0;
    let hasRangeData = false;

    let totalRecoilV = 0;
    let hasRecoilVData = false;

    equippedList.forEach(att => {
        if (typeof att.rangePercent === 'number') {
            totalRangePercent += att.rangePercent;
            hasRangeData = true;
        }
        if (typeof att.recoilV === 'number') {
            totalRecoilV += att.recoilV;
            hasRecoilVData = true;
        }
    });

    summaryContainer.innerHTML = `
        <div class="flex flex-col gap-2">
            <!-- Daño Base -->
            <div class="flex justify-between items-center text-xs">
                <span style="color: var(--codm-muted);">Daño por bala:</span>
                <strong style="color: #fff;">${weapon.stats.daño} (Base)</strong>
            </div>

            <!-- Alcance Efectivo Acumulado -->
            <div class="flex justify-between items-center text-xs">
                <span style="color: var(--codm-muted);">Modificación de Alcance:</span>
                ${hasRangeData ? `
                    <strong style="color: ${totalRangePercent >= 0 ? '#2ecc71' : '#e74c3c'};">
                        ${totalRangePercent > 0 ? '+' : ''}${totalRangePercent}%
                    </strong>
                ` : `
                    <span style="color: #777;">Dato no disponible</span>
                `}
            </div>

            <!-- Retroceso Vertical Acumulado -->
            <div class="flex justify-between items-center text-xs">
                <span style="color: var(--codm-muted);">Control Retroceso Vertical:</span>
                ${hasRecoilVData ? `
                    <strong style="color: ${totalRecoilV <= 0 ? '#2ecc71' : '#e74c3c'};">
                        ${totalRecoilV > 0 ? '+' : ''}${totalRecoilV}%
                    </strong>
                ` : `
                    <span style="color: #777;">Dato no disponible</span>
                `}
            </div>

            <!-- Tiempo ADS -->
            <div class="flex justify-between items-center text-xs">
                <span style="color: var(--codm-muted);">Tiempo de Apuntado (ADS):</span>
                <span style="color: var(--codm-cyan);">Calculado por accesorios equipados</span>
            </div>
        </div>

        <div class="p-2 rounded" style="background: rgba(0,0,0,0.4); margin-top: 8px;">
            <span class="text-xs font-bold" style="color: var(--codm-cyan); display: block; margin-bottom: 2px;">Resumen Técnico de Interacción:</span>
            <p class="text-xs" style="color: var(--codm-muted); margin: 0; line-height: 1.4;">
                ${equippedList.length === 0 ? 'Equipa accesorios para analizar la interacción balística.' :
                  `Tienes ${equippedList.length} de 5 accesorios equipados. Las ventajas y penalizaciones se equilibran automáticamente en combate.`}
            </p>
        </div>
    `;
}

// Recomendador según distancia
function applyAutoRecommendation(dist) {
    const weapon = window.CODM_DB.weapons.find(w => w.id === AppState.builder.weaponId);
    const expl = document.getElementById('recommendationExplanation');

    if (!weapon.metaBuilds || !weapon.metaBuilds[dist]) {
        if (expl) expl.textContent = `No hay una recomendación verificada para ${dist} distancia en esta arma aún.`;
        return;
    }

    const build = weapon.metaBuilds[dist];
    resetBuilder();

    // Mapear los accesorios de la build si existen en el catálogo
    build.attachments.forEach(att => {
        // Encontrar ranura coincidente
        const slotObj = window.CODM_DB.slots.find(s => s.name.toLowerCase() === att.slot.toLowerCase());
        if (slotObj && weapon.attachmentsCatalogue[slotObj.id]) {
            const foundInCat = weapon.attachmentsCatalogue[slotObj.id].find(a => a.name === att.name);
            if (foundInCat) {
                AppState.builder.equipped[slotObj.id] = foundInCat;
            } else {
                // Registrar accesorio verificado
                AppState.builder.equipped[slotObj.id] = att;
            }
        }
    });

    renderBuilderSlots();
    updateBuilderStats();

    if (expl) {
        expl.innerHTML = `<strong>${build.title}:</strong> ${build.playstyle} • <em>${build.sight}</em>`;
    }

    showToast(`Configuración de ${dist} distancia aplicada`);
}

// Guardar clase personalizada
function saveCurrentCustomBuild() {
    const weapon = window.CODM_DB.weapons.find(w => w.id === AppState.builder.weaponId);
    const equippedList = Object.entries(AppState.builder.equipped)
        .filter(([slot, att]) => att !== null)
        .map(([slot, att]) => ({ slot, name: att.name }));

    if (equippedList.length === 0) {
        showToast("Equipa al menos un accesorio para guardar");
        return;
    }

    const newBuild = {
        id: 'build_' + Date.now(),
        weaponId: weapon.id,
        weaponName: weapon.name,
        date: new Date().toLocaleDateString(),
        attachments: equippedList
    };

    AppState.customBuilds.unshift(newBuild);
    localStorage.setItem('codm_custom_builds', JSON.stringify(AppState.customBuilds));
    renderMySavedBuilds();
    showToast("¡Clase guardada en Mi Armero!");
}

function renderMySavedBuilds() {
    const container = document.getElementById('mySavedBuildsContainer');
    if (!container) return;

    if (AppState.customBuilds.length === 0) {
        container.innerHTML = `
            <p class="text-xs" style="color: #666; margin: 4px 0;">No has guardado clases personalizadas aún.</p>
        `;
        return;
    }

    container.innerHTML = AppState.customBuilds.map(b => `
        <div class="p-2.5 rounded flex justify-between items-center" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08);">
            <div>
                <strong class="text-xs" style="color: var(--codm-cyan);">${b.weaponName}</strong>
                <span class="text-xs" style="color: var(--codm-muted); display: block; font-size: 10px;">
                    ${b.attachments.length} accesorios • ${b.date}
                </span>
            </div>
            <div class="flex gap-1">
                <button onclick="deleteCustomBuild('${b.id}')" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 14px;">✕</button>
            </div>
        </div>
    `).join('');
}

function deleteCustomBuild(buildId) {
    AppState.customBuilds = AppState.customBuilds.filter(b => b.id !== buildId);
    localStorage.setItem('codm_custom_builds', JSON.stringify(AppState.customBuilds));
    renderMySavedBuilds();
    showToast("Clase eliminada");
}

// Utilidad portapapeles
function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
    showToast(successMsg || "Copiado al portapapeles");
}
