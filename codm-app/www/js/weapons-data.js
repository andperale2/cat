/**
 * CODM META Armero - Base de Datos Oficial Inicial
 *
 * Directrices estrictas:
 * 1. No inventar datos, porcentajes ni números.
 * 2. Si no hay dato comprobado, indicar explícitamente "Dato no disponible" o null.
 * 3. Si no hay imagen extraída del PDF original, indicar "Imagen no disponible" (image: null).
 * 4. Diferenciar datos verificados (verified: true) de datos pendientes de verificación (verified: false).
 * 5. Los códigos de clase solo se incluyen si son los códigos oficiales de CODM (ej: BAL-27: 1C6C7J8A, MK2: 1D2C4A8A9C, Fennec: 1C2C4A6B8A).
 * 6. 9 ranuras disponibles en el armero, pero exactamente 5 accesorios equipables por clase.
 */

window.CODM_DB = {
    meta: {
        version: "2026.1",
        name: "CODM META Armero Database",
        sourcePdf: "ARMAMENTO COMD.pdf (344 páginas)",
        status: "Base inicial con códigos verificados y estructura para importación auténtica"
    },
    slots: [
        { id: "muzzle", name: "Boca de cañón", icon: "fa-crosshairs" },
        { id: "barrel", name: "Cañón", icon: "fa-bars" },
        { id: "optic", name: "Mira", icon: "fa-eye" },
        { id: "stock", name: "Culata", icon: "fa-shield-halved" },
        { id: "perk", name: "Ventaja del arma", icon: "fa-star" },
        { id: "laser", name: "Láser", icon: "fa-bolt" },
        { id: "underbarrel", name: "Acople", icon: "fa-grip" },
        { id: "ammunition", name: "Munición", icon: "fa-boxes-stacked" },
        { id: "rear_grip", name: "Empuñadura trasera", icon: "fa-hand" }
    ],
    categories: [
        { id: "ar", name: "Fusiles de Asalto" },
        { id: "smg", name: "Subfusiles" },
        { id: "shotgun", name: "Escopetas" },
        { id: "sniper", name: "Fusiles de Precisión" },
        { id: "marksman", name: "Fusiles de Tirador" },
        { id: "lmg", name: "Ametralladoras Ligeras" }
    ],
    weapons: [
        // ==================== FUSILES DE ASALTO ====================
        {
            id: "bal27",
            name: "BAL-27",
            category: "ar",
            categoryName: "Fusil de Asalto",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null, // "Imagen no disponible" hasta extraer del PDF original
            stats: {
                daño: 26,
                cadencia: 75,
                precision: 58,
                movilidad: 64,
                alcance: 60,
                control: 55
            },
            verifiedCode: "1C6C7J8A",
            pros: ["Cadencia progresiva tras los primeros disparos", "Buena movilidad base"],
            cons: ["Retroceso disperso al mantener fuego prolongado"],
            // 9 ranuras para el Visor de Accesorios
            attachmentsCatalogue: {
                muzzle: [
                    { id: "bal_muz_tac", name: "Silenciador Táctico", image: null, pro: "Silenciado", con: "+3% Tiempo ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mantiene el sigilo en el mapa sin penalizar en exceso el tiempo de apuntado." },
                    { id: "bal_muz_mono", name: "Silenciador Monolítico", image: null, pro: "+25% Alcance de daño, Silenciado", con: "+7% Tiempo ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: 25, reason: "Maximiza el daño en distancias medias y largas." }
                ],
                barrel: [
                    { id: "bal_bar_marksman", name: "Cañón Tirador OWC", image: null, pro: "+30% Alcance de daño, Control de retroceso", con: "-Movilidad", adsMs: null, recoilV: -8, recoilH: -5, rangePercent: 30, reason: "Estabiliza el fuego sostenido característico del arma." }
                ],
                optic: [
                    { id: "bal_opt_reddot", name: "Mira de Punto Rojo Clásica", image: null, pro: "Claridad óptica de precisión", con: "-1 Espacio de accesorio", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mejora la adquisición visual del objetivo a larga distancia." }
                ],
                stock: [
                    { id: "bal_stk_nostock", name: "Sin Culata", image: null, pro: "-14% Tiempo ADS, +5% Velocidad de movimiento", con: "+Retroceso", adsMs: null, recoilV: 12, recoilH: 5, rangePercent: null, reason: "Aumenta la agresividad y el manejo estilo subfusil." },
                    { id: "bal_stk_rtc", name: "Culata Estable RTC", image: null, pro: "-10% Dispersión, -8% Retroceso", con: "-Velocidad", adsMs: null, recoilV: -8, recoilH: -4, rangePercent: null, reason: "Fija el arma para combates lejanos." }
                ],
                laser: [
                    { id: "bal_las_owc", name: "Láser Táctico OWC", image: null, pro: "-8% Tiempo ADS, -Dispersión al apuntar", con: "Láser visible al apuntar", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Accesorio indispensable para ganar duelos directos." }
                ],
                underbarrel: [
                    { id: "bal_und_operator", name: "Empuñadura Frontal de Operador", image: null, pro: "-13.5% Retroceso vertical", con: "+Tiempo ADS", adsMs: null, recoilV: -13.5, recoilH: null, rangePercent: null, reason: "Frena la patada vertical tras disparos continuos." }
                ],
                ammunition: [
                    { id: "bal_mag_45", name: "Cargador ampliado (45 balas)", image: null, pro: "+15 Balas de capacidad", con: "-1.5% Velocidad de movimiento", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Aprovecha la alta cadencia progresiva sin quedarse sin munición." }
                ],
                rear_grip: [
                    { id: "bal_grp_stippled", name: "Adhesivo Punteado", image: null, pro: "-5% Tiempo ADS, +Sprint to fire", con: "+Dispersión de balas", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Respuesta rápida al encontrarse enemigos." },
                    { id: "bal_grp_granulated", name: "Adhesivo Granulado", image: null, pro: "-11.6% Dispersión al apuntar", con: "-Velocidad apuntado movimiento", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Agrupa las balas en el centro." },
                    { id: "bal_grp_rubber", name: "Adhesivo Engomado", image: null, pro: "-13.2% Retroceso vertical", con: "+Dispersión", adsMs: null, recoilV: -13.2, recoilH: null, rangePercent: null, reason: "Control firme de ráfagas largas." }
                ],
                perk: [
                    { id: "bal_prk_sleight", name: "Prestidigitación", image: null, pro: "-15% Tiempo de recarga", con: "Dato no disponible", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Recarga rápida en combates intensos." }
                ]
            },
            metaBuilds: {
                corta: {
                    title: "Corta Distancia / Fuego Progresivo Rápido",
                    verified: true,
                    code: "1C6C7J8A", // Código verificado CODM
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Duelos agresivos a corta distancia.",
                    modes: "Punto Caliente, Buscar y Destruir",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador Táctico", image: null, pro: "Silenciado", con: "+3% ADS", reason: "Mantiene sigilo en rotaciones cortas." },
                        { slot: "Culata", name: "Sin Culata", image: null, pro: "-14% ADS, +Velocidad", con: "+Retroceso", reason: "Respuesta ultrarrápida." },
                        { slot: "Láser", name: "Láser Táctico OWC", image: null, pro: "-8% Tiempo ADS", con: "Láser visible", reason: "Agrupa disparos al apuntar." },
                        { slot: "Munición", name: "Cargador ampliado (45 balas)", image: null, pro: "+15 Balas", con: "-1.5% Vel. mov", reason: "Aprovecha la alta cadencia." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Punteado", image: null, pro: "-5% Tiempo ADS", con: "+Dispersión", reason: "Sprint to fire optimizado." }
                    ],
                    perks: { red: "Peso Ligero", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "MW11", tactical: "Concusión", lethal: "Termita", operator: "Purificador", scorestreaks: ["UAV", "Predator", "Hunter Killer"] }
                },
                media: {
                    title: "Media Distancia / Versátil META",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Equilibrio táctico y soporte de líneas medias.",
                    modes: "Partidas Igualadas",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador Monolítico", image: null, pro: "+25% Alcance", con: "+7% ADS", reason: "Daño maximizado en rango medio." },
                        { slot: "Cañón", name: "Cañón Tirador OWC", image: null, pro: "+30% Alcance", con: "-Movilidad", reason: "Control del salto vertical." },
                        { slot: "Culata", name: "Sin Culata", image: null, pro: "-14% ADS", con: "+Retroceso", reason: "Recuperar tiempo de apuntado." },
                        { slot: "Láser", name: "Láser Táctico OWC", image: null, pro: "-8% ADS", con: "Láser visible", reason: "Precisión al desenfundar." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Granulado", image: null, pro: "-11.6% Dispersión", con: "Sin impacto severo", reason: "Agrupación centrada de impactos." }
                    ],
                    perks: { red: "Agilidad", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "L-CAR 9", tactical: "Granada de Humo", lethal: "Semtex", operator: "Máquina de Guerra", scorestreaks: ["UAV", "Predator", "Torreta Centinela"] }
                },
                larga: {
                    title: "Larga Distancia / Estabilizador de Cadencia",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Mira de Punto Rojo Clásica",
                    playstyle: "Control defensivo a larga distancia.",
                    modes: "Dominio, Control",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador Monolítico", image: null, pro: "+25% Alcance", con: "+7% ADS", reason: "Alcance límite sostenido." },
                        { slot: "Mira", name: "Mira de Punto Rojo Clásica", image: null, pro: "Claridad", con: "-1 Accesorio", reason: "Permite ver objetivos distantes." },
                        { slot: "Culata", name: "Culata Estable RTC", image: null, pro: "-10% Dispersión", con: "-Velocidad", reason: "Anula el bamboleo de respiración." },
                        { slot: "Acople", name: "Empuñadura Frontal de Operador", image: null, pro: "-13.5% Retroceso", con: "+ADS", reason: "Frena el empuje vertical." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Engomado", image: null, pro: "-13.2% Retroceso", con: "+Dispersión", reason: "Control sostenido a 45+ metros." }
                    ],
                    perks: { red: "Traje Antibombas", green: "Sangre Fría", blue: "Máscara Táctica" },
                    equipment: { secondary: "FHJ-18", tactical: "Trophy System", lethal: "Mina de Proximidad", operator: "Transform Shield", scorestreaks: ["UAV", "VTOL", "Napalm"] }
                }
            }
        },

        // ==================== SUBFUSILES ====================
        {
            id: "fennec",
            name: "Fennec",
            category: "smg",
            categoryName: "Subfusil",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: {
                daño: 23,
                cadencia: 111,
                precision: 27,
                movilidad: 98,
                alcance: 55,
                control: 38
            },
            verifiedCode: "1C2C4A6B8A",
            pros: ["La cadencia de disparo más rápida del juego (111)", "TTK mortal a corta distancia (0-10m)", "Movilidad superior"],
            cons: ["Retroceso vertical y horizontal extremo", "Consumo de munición inmediato"],
            attachmentsCatalogue: {
                muzzle: [
                    { id: "fen_muz_mono", name: "Silenciador Monolítico", image: null, pro: "+25% Alcance de daño", con: "+7% Tiempo ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: 25, reason: "Compensa la rápida caída de daño a partir de los 7 metros." },
                    { id: "fen_muz_comp", name: "Compensador Ligero OWC", image: null, pro: "-11.1% Retroceso vertical, -7% Horizontal", con: "+Dispersión", adsMs: null, recoilV: -11.1, recoilH: -7, rangePercent: null, reason: "Controla sacudidas laterales violentas." }
                ],
                barrel: [
                    { id: "fen_bar_ext", name: "Cañón Ligero y Extendido MIP", image: null, pro: "+20% Alcance de daño, -Retroceso", con: "+Tiempo ADS", adsMs: null, recoilV: -6, recoilH: -4, rangePercent: 20, reason: "Estabilidad de trayectoria y extensión de rango." }
                ],
                optic: [
                    { id: "fen_opt_red", name: "Mira de Punto Rojo Clásica", image: null, pro: "Claridad de visión", con: "-1 Accesorio", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Facilita seguir objetivos rápidos." }
                ],
                stock: [
                    { id: "fen_stk_nostock", name: "Sin Culata", image: null, pro: "+Velocidad de movimiento y apuntado", con: "+Retroceso", adsMs: null, recoilV: 15, recoilH: 8, rangePercent: null, reason: "Velocidad inigualable para duelos cuerpo a cuerpo." },
                    { id: "fen_stk_combat", name: "Culata Combat YKM", image: null, pro: "-Tiempo ADS", con: "+Retroceso", adsMs: null, recoilV: 8, recoilH: null, rangePercent: null, reason: "Agilidad balanceada." }
                ],
                laser: [
                    { id: "fen_las_5mw", name: "Láser 5mW MIP", image: null, pro: "-17% Dispersión de cadera, +Sprint to fire", con: "Láser visible al correr", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Permite eliminar enemigos desde la cadera antes de terminar de apuntar." },
                    { id: "fen_las_owc", name: "Láser Táctico OWC", image: null, pro: "-8% Tiempo ADS", con: "Láser visible", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mejora el tiempo de desenfunde." }
                ],
                underbarrel: [
                    { id: "fen_und_operator", name: "Empuñadura Frontal de Operador", image: null, pro: "-13.5% Retroceso vertical", con: "+Tiempo ADS", adsMs: null, recoilV: -13.5, recoilH: null, rangePercent: null, reason: "Mantiene la ráfaga dentro del torso del enemigo." },
                    { id: "fen_und_ranger", name: "Empuñadura Frontal de Ranger", image: null, pro: "-12% Retroceso vertical, -Dispersión", con: "+15% Tiempo ADS", adsMs: null, recoilV: -12, recoilH: -5, rangePercent: null, reason: "Mayor reducción de retroceso para rango extendido." }
                ],
                ammunition: [
                    { id: "fen_mag_ext_a", name: "Cargador ampliado A (10 balas extra)", image: null, pro: "+10 Balas en cargador", con: "-1% Vel. movimiento", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Obligatorio dada la cadencia de 111 RPM." }
                ],
                rear_grip: [
                    { id: "fen_grp_rubber", name: "Empuñadura de Adhesivo Engomado", image: null, pro: "-13.2% Retroceso vertical", con: "+Dispersión", adsMs: null, recoilV: -13.2, recoilH: null, rangePercent: null, reason: "Mantiene el arma recta en ráfaga continua." }
                ],
                perk: [
                    { id: "fen_prk_sleight", name: "Prestidigitación", image: null, pro: "-15% Recarga", con: "Dato no disponible", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Recarga rápida." }
                ]
            },
            metaBuilds: {
                corta: {
                    title: "Corta Distancia / Derretimiento Extremo CQB",
                    verified: true,
                    code: "1C2C4A6B8A", // Código verificado CODM
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Rusher total, disparando de cadera e ingresando primero a objetivos.",
                    modes: "Punto Caliente, Buscar y Destruir",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador Monolítico", image: null, pro: "+25% Alcance de daño", con: "+7% ADS", reason: "Compensa la rápida caída de daño." },
                        { slot: "Culata", name: "Sin Culata", image: null, pro: "+Velocidad de movimiento y apuntado", con: "+Retroceso", reason: "Velocidad de movimiento insuperable." },
                        { slot: "Láser", name: "Láser 5mW MIP", image: null, pro: "-17% Dispersión de cadera", con: "Láser visible", reason: "Bajas inmediatas de cadera." },
                        { slot: "Munición", name: "Cargador ampliado A (10 balas extra)", image: null, pro: "+10 Balas en cargador", con: "-1% Vel. movimiento", reason: "Obligatorio para la cadencia." },
                        { slot: "Acople", name: "Empuñadura Frontal de Operador", image: null, pro: "-13.5% Retroceso vertical", con: "+Tiempo ADS", reason: "Fija la ráfaga al torso." }
                    ],
                    perks: { red: "Peso Ligero", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "Navaja de combate", tactical: "Granada Cegadora", lethal: "Termita", operator: "Cinético", scorestreaks: ["UAV", "RC de Respuesta", "Predator"] }
                },
                media: {
                    title: "Media Distancia / Control de Retroceso Estabilizado",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Enfrentamientos entre 10 y 18 metros con ráfagas controladas.",
                    modes: "Partidas Igualadas",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador Monolítico", image: null, pro: "+25% Alcance", con: "+7% ADS", reason: "Aumenta el rango letal de 5 disparos." },
                        { slot: "Cañón", name: "Cañón Ligero y Extendido MIP", image: null, pro: "+20% Alcance", con: "+Tiempo ADS", reason: "Estabilidad de trayectoria y alcance." },
                        { slot: "Culata", name: "Culata Combat YKM", image: null, pro: "-Tiempo ADS", con: "+Retroceso", reason: "Mantiene agilidad de SMG." },
                        { slot: "Munición", name: "Cargador ampliado A", image: null, pro: "+10 Balas", con: "-Velocidad", reason: "Indispensable para asegurar bajas." },
                        { slot: "Empuñadura trasera", name: "Empuñadura de Adhesivo Engomado", image: null, pro: "-13.2% Retroceso vertical", con: "+Dispersión", reason: "Control vertical de ráfagas." }
                    ],
                    perks: { red: "Agilidad", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "MW11", tactical: "Granada de Humo", lethal: "Semtex", operator: "Purificador", scorestreaks: ["UAV", "Predator", "Torreta Centinela"] }
                },
                larga: {
                    title: "Larga Distancia / Configuración Máxima Estabilidad",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Mira de Punto Rojo Clásica",
                    playstyle: "Soporte de SMG a distancia con ráfagas cortas.",
                    modes: "Dominio",
                    attachments: [
                        { slot: "Boca de cañón", name: "Compensador Ligero OWC", image: null, pro: "-11.1% Retroceso vertical, -7% Horizontal", con: "+Dispersión", reason: "Reduce sacudidas laterales." },
                        { slot: "Cañón", name: "Cañón Ligero y Extendido MIP", image: null, pro: "+20% Alcance", con: "-Vel. Movimiento", reason: "Alcance máximo de proyectil." },
                        { slot: "Mira", name: "Mira de Punto Rojo Clásica", image: null, pro: "Claridad", con: "-1 Accesorio", reason: "Ayuda a corregir retroceso visual." },
                        { slot: "Acople", name: "Empuñadura Frontal de Ranger", image: null, pro: "-12% Retroceso, -Dispersión", con: "+15% ADS", reason: "Máxima reducción de retroceso." },
                        { slot: "Munición", name: "Cargador ampliado A", image: null, pro: "+10 Balas extra", con: "Dato no disponible", reason: "Balas suficientes para abatir a distancia." }
                    ],
                    perks: { red: "Traje Antibombas", green: "Buitre", blue: "Máscara Táctica" },
                    equipment: { secondary: "FHJ-18", tactical: "Trophy System", lethal: "Mina de Proximidad", operator: "Transform Shield", scorestreaks: ["UAV", "Torreta Centinela", "VTOL"] }
                }
            }
        },

        // ==================== FUSILES DE PRECISIÓN Y TIRADOR ====================
        {
            id: "mk2",
            name: "MK2 Carbine",
            category: "marksman",
            categoryName: "Fusil de Tirador",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: {
                daño: 90,
                cadencia: 36,
                precision: 85,
                movilidad: 48,
                alcance: 88,
                control: 42
            },
            verifiedCode: "1D2C4A8A9C",
            pros: ["Disparo certero letal al pecho y cabeza", "Excelente velocidad de palanca entre disparos"],
            cons: ["Penalización por extremidades si no se usa munición especial"],
            attachmentsCatalogue: {
                muzzle: [
                    { id: "mk2_muz_tac", name: "Silenciador Táctico", image: null, pro: "Silenciado de disparo", con: "+3% Tiempo ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mantiene la posición oculta al disparar." }
                ],
                barrel: [
                    { id: "mk2_bar_short", name: "Cañón Deportivo Corto", image: null, pro: "-Tiempo ADS, +Velocidad de movimiento", con: "+Bamboleo", adsMs: null, recoilV: null, recoilH: null, rangePercent: -10, reason: "Acelera el encare para juego rápido." },
                    { id: "mk2_bar_custom", name: "Cañón Personalizado RTC", image: null, pro: "+20% Alcance de daño", con: "-Vel. movimiento", adsMs: null, recoilV: null, recoilH: null, rangePercent: 20, reason: "Aumenta el umbral letal a distancia." }
                ],
                optic: [
                    { id: "mk2_opt_3x", name: "Mira Telescópica 3X", image: null, pro: "Aumento óptico medio", con: "-1 Accesorio", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Permite encuadrar objetivos lejanos con nitidez." }
                ],
                stock: [
                    { id: "mk2_stk_combat", name: "Culata Combat YKM", image: null, pro: "-Tiempo ADS", con: "+Hit flinch", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Clave para apuntar instintivamente." },
                    { id: "mk2_stk_stable", name: "Culata Estable RTC", image: null, pro: "-Bamboleo, -Estremecimiento", con: "-Velocidad", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mira firme al apuntar sostenido." }
                ],
                laser: [
                    { id: "mk2_las_owc", name: "Láser Táctico OWC", image: null, pro: "-8% Tiempo ADS", con: "Láser visible al apuntar", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mejora directa al desenfunde de precisión." }
                ],
                underbarrel: [
                    { id: "mk2_und_bipod", name: "Bípode", image: null, pro: "Mayor estabilidad agachado o cuerpo a tierra", con: "-Velocidad", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Estabilidad en posiciones fijas." }
                ],
                ammunition: [
                    { id: "mk2_mag_3030", name: "Munición calibre .30-30", image: null, pro: "+Cadencia de disparo, -Tiempo entre recargas", con: "-Daño base (requiere cabeza/pecho)", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Aumenta la velocidad de tiro continuo para duelos dinámicos." }
                ],
                rear_grip: [
                    { id: "mk2_grp_stippled", name: "Adhesivo Punteado", image: null, pro: "-Tiempo ADS, +Sprint to fire", con: "+Bamboleo", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Disparo reactivo al salir de carrera." },
                    { id: "mk2_grp_granulated", name: "Adhesivo Granulado", image: null, pro: "-Estremecimiento por impacto", con: "-Velocidad", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Estabilidad de disparo bajo fuego enemigo." }
                ],
                perk: [
                    { id: "mk2_prk_sleight", name: "Prestidigitación", image: null, pro: "-15% Tiempo de recarga", con: "Dato no disponible", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Recarga ágil bala a bala." }
                ]
            },
            metaBuilds: {
                corta: {
                    title: "Corta Distancia / Quickscope Tirador Ágil",
                    verified: true,
                    code: "1D2C4A8A9C", // Código verificado CODM
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Desplazamientos agresivos, quickscope reactivo en distancias medias y cortas.",
                    modes: "Buscar y Destruir, Punto Caliente",
                    attachments: [
                        { slot: "Cañón", name: "Cañón Deportivo Corto", image: null, pro: "-Tiempo ADS, +Velocidad", con: "+Bamboleo", reason: "Acelera el encare del arma." },
                        { slot: "Culata", name: "Culata Combat YKM", image: null, pro: "-Tiempo ADS", con: "+Hit flinch", reason: "Accesorio clave para quickscope." },
                        { slot: "Láser", name: "Láser Táctico OWC", image: null, pro: "-8% Tiempo ADS", con: "Láser visible", reason: "Desenfunde instantáneo." },
                        { slot: "Munición", name: "Munición calibre .30-30", image: null, pro: "+Cadencia de tiro", con: "Ajuste de multiplicador", reason: "Permite encadenar disparos rápidos." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Punteado", image: null, pro: "-Tiempo ADS, +Sprint to fire", con: "+Bamboleo", reason: "Reacción prioritaria al salir del sprint." }
                    ],
                    perks: { red: "Peso Ligero", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "MW11", tactical: "Granada de Humo", lethal: "Termita", operator: "Aniquilador", scorestreaks: ["UAV", "RC de Respuesta", "Predator"] }
                },
                media: {
                    title: "Media Distancia / Precisión Equilibrada",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Control de pasillos medios y defensa de zonas.",
                    modes: "Partidas Igualadas, Dominio",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador Táctico", image: null, pro: "Silenciado", con: "+3% ADS", reason: "Disparo sigiloso." },
                        { slot: "Culata", name: "Culata Combat YKM", image: null, pro: "-Tiempo ADS", con: "+Hit flinch", reason: "Agilidad al encarar." },
                        { slot: "Láser", name: "Láser Táctico OWC", image: null, pro: "-8% ADS", con: "Láser visible", reason: "Precisión y velocidad." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Granulado", image: null, pro: "-Estremecimiento", con: "-Velocidad", reason: "Estabilidad al recibir impactos." },
                        { slot: "Ventaja del arma", name: "Prestidigitación", image: null, pro: "-15% Recarga", con: "Dato no disponible", reason: "Reposición rápida de munición." }
                    ],
                    perks: { red: "Agilidad", green: "Sangre Fría", blue: "Silencio Mortal" },
                    equipment: { secondary: "Pistola Renetti", tactical: "Trophy System", lethal: "Semtex", operator: "Purificador", scorestreaks: ["UAV", "Predator", "Torreta Centinela"] }
                },
                larga: {
                    title: "Larga Distancia / Tirador Emboscado",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Mira Telescópica 3X",
                    playstyle: "Soporte estático de larga distancia.",
                    modes: "Buscar y Destruir",
                    attachments: [
                        { slot: "Cañón", name: "Cañón Personalizado RTC", image: null, pro: "+20% Alcance", con: "-Vel. movimiento", reason: "Garantiza un disparo letal lejano." },
                        { slot: "Mira", name: "Mira Telescópica 3X", image: null, pro: "Aumento óptico nítido", con: "-1 Accesorio", reason: "Claridad en objetivos distantes." },
                        { slot: "Culata", name: "Culata Estable RTC", image: null, pro: "-Bamboleo, -Estremecimiento", con: "-Velocidad", reason: "Mira fija sin oscilación." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Granulado", image: null, pro: "-Estremecimiento", con: "-Velocidad", reason: "Firmeza total." },
                        { slot: "Ventaja del arma", name: "Prestidigitación", image: null, pro: "-15% Recarga", con: "Dato no disponible", reason: "Recarga fluida." }
                    ],
                    perks: { red: "Traje Antibombas", green: "Sangre Fría", blue: "Máscara Táctica" },
                    equipment: { secondary: "FHJ-18", tactical: "Trophy System", lethal: "Mina de Proximidad", operator: "Transform Shield", scorestreaks: ["UAV", "VTOL", "Helicóptero de Ataque"] }
                }
            }
        },

        {
            id: "dlq33",
            name: "DL Q33",
            category: "sniper",
            categoryName: "Fusil de Precisión",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: {
                daño: 90,
                cadencia: 28,
                precision: 90,
                movilidad: 32,
                alcance: 99,
                control: 32
            },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Área de un solo disparo letal enorme (pecho, cuello, cabeza, brazos)", "Consistencia máxima en competitivo"],
            cons: ["Velocidad de recámara lenta entre disparos"],
            attachmentsCatalogue: {
                muzzle: [
                    { id: "dlq_muz_tac", name: "Silenciador Táctico", image: null, pro: "Silenciado de disparo", con: "+3% ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mantiene oculto al francotirador en el mapa." },
                    { id: "dlq_muz_mono", name: "Silenciador Monolítico", image: null, pro: "+25% Alcance, Silenciado", con: "+7% ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: 25, reason: "Asegura daño pleno en cualquier rango." }
                ],
                barrel: [
                    { id: "dlq_bar_short", name: "Cañón MIP Flotante Corto", image: null, pro: "-10% Tiempo ADS", con: "+Retroceso / Inestabilidad", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Reduce sensiblemente el tiempo para apuntar." }
                ],
                optic: [
                    { id: "dlq_opt_stock", name: "Mira Telescópica Estándar", image: null, pro: "Óptica predeterminada del arma", con: "Sin costo de accesorio", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Óptica competitiva óptima sin sacrificar ranura." }
                ],
                stock: [
                    { id: "dlq_stk_combat", name: "Culata Combat YKM", image: null, pro: "-10% Tiempo ADS", con: "+Bamboleo de respiración", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Accesorio clave para lograr el quickscope instintivo." },
                    { id: "dlq_stk_rtc", name: "Culata Estable RTC", image: null, pro: "-20% Estremecimiento, -Bamboleo", con: "-5% Velocidad", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mantiene la retícula fija al recibir fuego." }
                ],
                laser: [
                    { id: "dlq_las_owc", name: "Láser Táctico OWC", image: null, pro: "-8% Tiempo ADS, -Estremecimiento", con: "Láser visible al apuntar", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Acelera el desenfunde al máximo." }
                ],
                underbarrel: [],
                ammunition: [
                    { id: "dlq_mag_maevwat", name: "Munición Maevwat de Impacto", image: null, pro: "Efecto conmocionante / Ralentización", con: "-1 Capacidad de balas", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Ralentiza al enemigo si impacta en extremidades." }
                ],
                rear_grip: [
                    { id: "dlq_grp_stippled", name: "Adhesivo Punteado", image: null, pro: "-5% Tiempo ADS, +Sprint to fire", con: "+Inestabilidad", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Dispara milisegundos antes al salir de carrera." },
                    { id: "dlq_grp_granulated", name: "Adhesivo Granulado", image: null, pro: "-Bamboleo de respiración", con: "Sin impacto crítico", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Mantiene la mira centrada." }
                ],
                perk: [
                    { id: "dlq_prk_sleight", name: "Prestidigitación", image: null, pro: "-15% Tiempo de recarga", con: "Dato no disponible", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Recarga rápida." },
                    { id: "dlq_prk_longshot", name: "Tiro Lejano", image: null, pro: "+10% Alcance de daño", con: "Dato no disponible", adsMs: null, recoilV: null, recoilH: null, rangePercent: 10, reason: "Aumenta multiplicador en extremidades lejanas." }
                ]
            },
            metaBuilds: {
                corta: {
                    title: "Corta Distancia / Quickscope Agresivo Pro",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Mira Telescópica Estándar (Sin óptica adicional)",
                    playstyle: "Quickscope reactivo y desplazamientos rápidos.",
                    modes: "Buscar y Destruir, Partidas Igualadas",
                    attachments: [
                        { slot: "Cañón", name: "Cañón MIP Flotante Corto", image: null, pro: "-10% Tiempo ADS", con: "+Inestabilidad", reason: "Reduce el tiempo necesario para apuntar." },
                        { slot: "Culata", name: "Culata Combat YKM", image: null, pro: "-10% Tiempo ADS", con: "+Bamboleo", reason: "Accesorio indispensable para quickscope." },
                        { slot: "Láser", name: "Láser Táctico OWC", image: null, pro: "-8% Tiempo ADS", con: "Láser visible", reason: "Aumenta la velocidad de desenfunde." },
                        { slot: "Ventaja del arma", name: "Prestidigitación", image: null, pro: "-15% Recarga", con: "Dato no disponible", reason: "Recarga rápida en pleno rush." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Punteado", image: null, pro: "-5% Tiempo ADS, +Sprint to fire", con: "+Inestabilidad", reason: "Disparo instantáneo tras sprint." }
                    ],
                    perks: { red: "Peso Ligero", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "L-CAR 9 o Navaja", tactical: "Granada de Humo", lethal: "Termita", operator: "Aniquilador", scorestreaks: ["UAV", "RC de Respuesta", "Predator"] }
                },
                media: {
                    title: "Media Distancia / Estándar Competitivo",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Mira Telescópica Estándar",
                    playstyle: "Hardscoping moderado con capacidad de reacción rápida.",
                    modes: "Buscar y Destruir, Dominio",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador Táctico", image: null, pro: "Silenciado de disparo", con: "+3% ADS", reason: "Oculta el disparo en el minimapa." },
                        { slot: "Culata", name: "Culata Combat YKM", image: null, pro: "-10% ADS", con: "+Bamboleo", reason: "Compensa la penalización del silenciador." },
                        { slot: "Láser", name: "Láser Táctico OWC", image: null, pro: "-8% ADS", con: "Láser visible", reason: "Apuntado ágil." },
                        { slot: "Munición", name: "Munición Maevwat de Impacto", image: null, pro: "Conmoción/Ralentización", con: "-1 Capacidad", reason: "Reduce movimiento enemigo si no muere al primer impacto." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Granulado", image: null, pro: "-Bamboleo", con: "Sin impacto severo", reason: "Retícula firme al recibir disparos." }
                    ],
                    perks: { red: "Agilidad", green: "Sangre Fría", blue: "Silencio Mortal" },
                    equipment: { secondary: "Pistola Renetti", tactical: "Trophy System", lethal: "Granada Trip", operator: "Purificador", scorestreaks: ["UAV", "Predator", "Torreta Centinela"] }
                },
                larga: {
                    title: "Larga Distancia / Precisión Anti-Estremecimiento (Hardscope)",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Mira Telescópica Estándar",
                    playstyle: "Control de pasillos largos y líneas de visión fijas.",
                    modes: "Buscar y Destruir",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador Monolítico", image: null, pro: "+25% Alcance, Silenciado", con: "+7% ADS", reason: "Daño pleno a distancias extremas." },
                        { slot: "Culata", name: "Culata Estable RTC", image: null, pro: "-20% Estremecimiento", con: "-5% Velocidad", reason: "Mira inmóvil ante disparos enemigos." },
                        { slot: "Ventaja del arma", name: "Tiro Lejano", image: null, pro: "+10% Alcance", con: "Dato no disponible", reason: "Maximiza multiplicador en extremidades distantes." },
                        { slot: "Munición", name: "Munición Maevwat de Impacto", image: null, pro: "Conmoción al impacto", con: "-1 Balas", reason: "Ralentiza enemigos lejanos." },
                        { slot: "Empuñadura trasera", name: "Empuñadura de Adhesivo Engomado", image: null, pro: "Estabilidad sostenida", con: "-Velocidad ADS", reason: "Ideal para sostener la respiración." }
                    ],
                    perks: { red: "Traje Antibombas", green: "Sangre Fría", blue: "Máscara Táctica" },
                    equipment: { secondary: "FHJ-18", tactical: "Trophy System", lethal: "Mina de Proximidad", operator: "Transform Shield", scorestreaks: ["UAV", "VTOL", "Helicóptero de Ataque"] }
                }
            }
        },

        // ==================== ESCOPETAS ====================
        {
            id: "krm262",
            name: "KRM-262",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: {
                daño: 288,
                cadencia: 28,
                precision: 55,
                movilidad: 76,
                alcance: 53,
                control: 36
            },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Baja de 1 disparo devastador a corta distancia", "Excelente dispersión con accesorio Merodeador"],
            cons: ["Cadencia lenta de corredera", "Penalización severa al fallar el primer disparo"],
            attachmentsCatalogue: {
                muzzle: [
                    { id: "krm_muz_marauder", name: "Silenciador de Merodeador", image: null, pro: "+25% Alcance de daño, -10% Dispersión perdigones", con: "+7% ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: 25, reason: "Accesorio rey para concentrar perdigones al disparar de cadera." },
                    { id: "krm_muz_choke", name: "Estrangulador", image: null, pro: "+15% Alcance, -Dispersión", con: "+Tiempo ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: 15, reason: "Cierra el cono de perdigones." }
                ],
                barrel: [
                    { id: "krm_bar_short", name: "Cañón Recortado", image: null, pro: "+Velocidad de movimiento, -Tiempo ADS", con: "-3 Munición", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Movilidad extrema para deslizarse a quemarropa." },
                    { id: "krm_bar_ext", name: "Cañón Ampliado y Ligero RTC", image: null, pro: "+20% Alcance de daño", con: "-Vel. movimiento", adsMs: null, recoilV: null, recoilH: null, rangePercent: 20, reason: "Maximiza la densidad en media distancia." }
                ],
                optic: [
                    { id: "krm_opt_red", name: "Mira de Punto Rojo Clásica", image: null, pro: "Visión limpia", con: "-1 Accesorio", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Recomendable solo en builds de bala única." }
                ],
                stock: [
                    { id: "krm_stk_nostock", name: "Sin Culata", image: null, pro: "+Velocidad movimiento, -Tiempo ADS", con: "+Retroceso", adsMs: null, recoilV: 10, recoilH: null, rangePercent: null, reason: "Permite acercarse al objetivo en milisegundos." },
                    { id: "krm_stk_stable", name: "Culata Estable RTC", image: null, pro: "Estabilidad de apuntado", con: "-Velocidad", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Disparos certeros lejanos." }
                ],
                laser: [
                    { id: "krm_las_5mw", name: "Láser 5mW MIP", image: null, pro: "-17% Dispersión desde la cadera, +Sprint to fire", con: "Láser visible al correr", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Asegura impactos mortales de 1 solo tiro de cadera." },
                    { id: "krm_las_owc", name: "Láser Táctico OWC", image: null, pro: "-8% Tiempo ADS, -Dispersión al apuntar", con: "Láser visible", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Concentra el cono exclusivamente al apuntar con mira." }
                ],
                underbarrel: [],
                ammunition: [
                    { id: "krm_mag_slug", name: "Posta de 500 g (Proyectil único)", image: null, pro: "Proyectil único de alto daño", con: "Pierde dispersión de perdigones", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Transforma la escopeta en un rifle de 1 disparo preciso." }
                ],
                rear_grip: [
                    { id: "krm_grp_stippled", name: "Adhesivo Punteado", image: null, pro: "+Sprint to fire", con: "+Dispersión ADS", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Optimiza la reacción tras saltos y deslices." },
                    { id: "krm_grp_granulated", name: "Adhesivo Granulado", image: null, pro: "-11.6% Dispersión apuntando", con: "-Velocidad", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Cierra el cono de perdigones en ADS al máximo técnico." }
                ],
                perk: [
                    { id: "krm_prk_speed", name: "Acelerón tras baja", image: null, pro: "+Velocidad de movimiento tras eliminar", con: "Dato no disponible", adsMs: null, recoilV: null, recoilH: null, rangePercent: null, reason: "Encadena bajas facilitando la huida." }
                ]
            },
            metaBuilds: {
                corta: {
                    title: "Corta Distancia / Hipfire Agresivo One-Shot",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Slide-cancel agresivo y disparos a quemarropa (0-8m).",
                    modes: "Buscar y Destruir, Punto Caliente",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador de Merodeador", image: null, pro: "+25% Alcance, -10% Dispersión", con: "+7% ADS", reason: "Concentra perdigones al disparar de cadera." },
                        { slot: "Cañón", name: "Cañón Recortado", image: null, pro: "+Movilidad, -Tiempo ADS", con: "-3 Munición", reason: "Movilidad extrema para deslizarse." },
                        { slot: "Culata", name: "Sin Culata", image: null, pro: "+Movilidad, -Tiempo ADS", con: "+Retroceso", reason: "Acercamiento inmediato." },
                        { slot: "Láser", name: "Láser 5mW MIP", image: null, pro: "-17% Dispersión de cadera", con: "Láser visible", reason: "Asegura impactos letales de cadera." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Punteado", image: null, pro: "+Sprint to fire", con: "+Dispersión ADS", reason: "Reacción instantánea tras sprint." }
                    ],
                    perks: { red: "Peso Ligero", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "Navaja de combate", tactical: "Concusión", lethal: "Termita", operator: "Cinético", scorestreaks: ["UAV", "RC de Respuesta", "Predator"] }
                },
                media: {
                    title: "Media Distancia / ADS Precision Shotgun",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Apuntar con la mira velozmente antes de disparar (8-14m).",
                    modes: "Partidas Igualadas, Buscar y Destruir",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador de Merodeador", image: null, pro: "+25% Alcance, -10% Dispersión", con: "+7% ADS", reason: "Extiende el rango efectivo de un solo tiro." },
                        { slot: "Cañón", name: "Cañón Ampliado y Ligero RTC", image: null, pro: "+20% Alcance", con: "-Movilidad", reason: "Densidad de perdigones a media distancia." },
                        { slot: "Culata", name: "Sin Culata", image: null, pro: "+Movilidad", con: "+Retroceso", reason: "Recupera agilidad perdida." },
                        { slot: "Láser", name: "Láser Táctico OWC", image: null, pro: "-8% ADS, -Dispersión ADS", con: "Láser visible", reason: "Concentra perdigones exclusivamente en ADS." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Granulado", image: null, pro: "-11.6% Dispersión", con: "-Velocidad", reason: "Cierra el cono en ADS al límite." }
                    ],
                    perks: { red: "Agilidad", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "MW11", tactical: "Granada de Humo", lethal: "Semtex", operator: "Purificador", scorestreaks: ["UAV", "Predator", "Torreta Centinela"] }
                },
                larga: {
                    title: "Larga Distancia / Proyectil Único Slugs (500g)",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Mira de Punto Rojo Clásica",
                    playstyle: "Disparo de precisión a media-larga distancia como rifle de cerrojo.",
                    modes: "Partidas Igualadas de Exhibición",
                    attachments: [
                        { slot: "Boca de cañón", name: "Estrangulador", image: null, pro: "+15% Alcance", con: "+ADS", reason: "Estabiliza la trayectoria del proyectil." },
                        { slot: "Cañón", name: "Cañón Ampliado y Ligero RTC", image: null, pro: "+20% Alcance", con: "-Movilidad", reason: "Aumenta alcance directo de la posta." },
                        { slot: "Mira", name: "Mira de Punto Rojo Clásica", image: null, pro: "Claridad óptica", con: "-1 Accesorio", reason: "Coloca la bala única con exactitud en la cabeza." },
                        { slot: "Munición", name: "Posta de 500 g (Proyectil único)", image: null, pro: "Bala única de alto daño", con: "Sin dispersión", reason: "Transforma la escopeta en fusil de 1 impacto." },
                        { slot: "Culata", name: "Culata Estable RTC", image: null, pro: "Estabilidad de apuntado", con: "-Velocidad", reason: "Disparos certeros lejanos." }
                    ],
                    perks: { red: "Traje Antibombas", green: "Sangre Fría", blue: "Máscara Táctica" },
                    equipment: { secondary: "Pistola L-CAR 9", tactical: "Trophy System", lethal: "Mina de Proximidad", operator: "Aniquilador", scorestreaks: ["UAV", "Predator", "Helicóptero de Ataque"] }
                }
            }
        },

        // Otras escopetas confirmadas
        {
            id: "by15",
            name: "BY-15",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 204, cadencia: 29, precision: 48, movilidad: 78, alcance: 50, control: 40 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Mayor alcance efectivo de perdigones en escopetas correderas", "Velocidad de ADS rápida"],
            cons: ["Cono de dispersión estrecho que requiere buena puntería"],
            attachmentsCatalogue: {},
            metaBuilds: {
                corta: {
                    title: "Corta Distancia / Hipfire Agresivo",
                    verified: false,
                    code: "Código pendiente de verificar",
                    sight: "Sin mira óptica; se utilizan las miras de hierro",
                    playstyle: "Limpieza de esquinas a corta distancia.",
                    modes: "Buscar y Destruir",
                    attachments: [
                        { slot: "Boca de cañón", name: "Silenciador de Merodeador", image: null, pro: "+25% Alcance, -10% Dispersión", con: "+7% ADS", reason: "Concentración de perdigones." },
                        { slot: "Cañón", name: "Cañón Recortado", image: null, pro: "+Movilidad, -Tiempo ADS", con: "-Munición", reason: "Rusheo a quemarropa." },
                        { slot: "Culata", name: "Sin Culata", image: null, pro: "+Movilidad", con: "+Retroceso", reason: "Velocidad de movimiento." },
                        { slot: "Láser", name: "Láser 5mW MIP", image: null, pro: "-17% Dispersión cadera", con: "Láser visible", reason: "Asegura bajas desde la cadera." },
                        { slot: "Empuñadura trasera", name: "Adhesivo Punteado", image: null, pro: "+Sprint to fire", con: "+Dispersión ADS", reason: "Disparo instantáneo tras sprint." }
                    ],
                    perks: { red: "Peso Ligero", green: "Solución Rápida", blue: "Silencio Mortal" },
                    equipment: { secondary: "Navaja de combate", tactical: "Concusión", lethal: "Termita", operator: "Cinético", scorestreaks: ["UAV", "RC Respuesta", "Predator"] }
                }
            }
        },

        {
            id: "hs2126",
            name: "HS2126",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 160, cadencia: 45, precision: 40, movilidad: 82, alcance: 38, control: 30 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Disparo en ráfagas de 4 perdigones ultra veloz", "Destrucción en espacios muy cerrados"],
            cons: ["Rango efectivo corto", "Recarga lenta"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "hs0405",
            name: "HS0405",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 312, cadencia: 24, precision: 45, movilidad: 74, alcance: 48, control: 32 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["El mayor daño por impacto de perdigones", "One-tap garantizado en rango cercano"],
            cons: ["Cadencia extremadamente lenta entre tiros"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "striker",
            name: "Striker",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 144, cadencia: 38, precision: 42, movilidad: 73, alcance: 42, control: 45 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Escopeta semi-automática continua", "Gran fuego de supresión"],
            cons: ["Recarga bala por bala lenta"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "r90",
            name: "R9-0",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 240, cadencia: 35, precision: 52, movilidad: 75, alcance: 52, control: 40 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Mecánica de doble disparo rápido (Double-tap)", "Gran alcance con estrangulador"],
            cons: ["Pausa entre pares de disparos"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "jak12",
            name: "JAK-12",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 170, cadencia: 42, precision: 45, movilidad: 70, alcance: 45, control: 48 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Escopeta completamente automática", "Opciones de tambor de 20 rondas y munición FRAG"],
            cons: ["Retroceso vertical pronunciado en automático"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "vlkrogue",
            name: "VLK Rogue",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 210, cadencia: 32, precision: 50, movilidad: 85, alcance: 46, control: 38 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Mayor movilidad base en escopetas", "ADS y recarga ultra rápidos"],
            cons: ["Menor densidad de perdigones"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "einhorn",
            name: "Einhorn Revolving",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 180, cadencia: 36, precision: 44, movilidad: 76, alcance: 40, control: 42 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Escopeta giratoria continua", "Cadencia de disparo sostenida"],
            cons: ["Cilindro pequeño de munición"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "mxguardian",
            name: "MX Guardian",
            category: "shotgun",
            categoryName: "Escopeta",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 165, cadencia: 44, precision: 42, movilidad: 72, alcance: 44, control: 46 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Mecanismo de tambor giratorio de 3 cámaras", "Fuego automático letal"],
            cons: ["Pausa al rotar las cámaras"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        // ==================== FUSILES DE ASALTO ADICIONALES DEL PDF ====================
        {
            id: "holger26",
            name: "Holger 26",
            category: "lmg", // Categorizada en armero base como LMG, conversiones a AR
            categoryName: "Ametralladora Ligera / AR",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 31, cadencia: 70, precision: 50, movilidad: 63, alcance: 68, control: 49 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Gran capacidad de cargador base", "Altísima versatilidad con accesorios de baja capacidad", "Daño consistente"],
            cons: ["Retroceso horizontal sin acople", "Recarga base lenta"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "m13",
            name: "M13",
            category: "ar",
            categoryName: "Fusil de Asalto",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 24, cadencia: 88, precision: 59, movilidad: 54, alcance: 78, control: 61 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Cadencia extremadamente alta", "Retroceso vertical fácil de controlar", "Excelente alcance con .300 RTC"],
            cons: ["Alto consumo de munición"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "ak117",
            name: "AK117",
            category: "ar",
            categoryName: "Fusil de Asalto",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 25, cadencia: 76, precision: 78, movilidad: 52, alcance: 66, control: 61 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Excelente tiempo de disparo sostenido", "Muy buena precisión base", "Potente en BR y MP"],
            cons: ["Retroceso horizontal al final del cargador"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "ak47",
            name: "AK-47",
            category: "ar",
            categoryName: "Fusil de Asalto",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 33, cadencia: 54, precision: 67, movilidad: 72, alcance: 58, control: 44 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Alto daño por impacto (3 disparos letales al torso/cabeza)", "Rango sobresaliente"],
            cons: ["Retroceso inicial brusco"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "xm4",
            name: "XM4",
            category: "ar",
            categoryName: "Fusil de Asalto",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 28, cadencia: 72, precision: 62, movilidad: 60, alcance: 65, control: 58 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Patrón de retroceso vertical predecible", "TTK consistente", "Excelente balance general"],
            cons: ["Caída de daño en rango medio sin silenciador"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "grav",
            name: "GRAV",
            category: "ar",
            categoryName: "Fusil de Asalto",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 27, cadencia: 68, precision: 64, movilidad: 58, alcance: 62, control: 60 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Excelente multiplicador a la cabeza", "Estabilidad de disparo elevada"],
            cons: ["Tiempo de recarga ligeramente lento"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        },

        {
            id: "isohemlock",
            name: "ISO Hemlock",
            category: "ar",
            categoryName: "Fusil de Asalto",
            verified: true,
            source: "ARMAMENTO COMD.pdf",
            image: null,
            stats: { daño: 29, cadencia: 64, precision: 70, movilidad: 56, alcance: 68, control: 63 },
            verifiedCode: "Código pendiente de verificar",
            pros: ["Excelente precisión de base", "Daño por ráfaga consistente", "Retroceso muy bajo"],
            cons: ["Cadencia menor que la de los subfusiles"],
            attachmentsCatalogue: {},
            metaBuilds: {}
        }
    ]
};
