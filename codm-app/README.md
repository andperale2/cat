# CODM META Armero - Aplicación Android APK

Aplicación Android nativa e híbrida desarrollada con **Capacitor, HTML5, CSS y JavaScript** para la gestión y análisis táctico de armamentos META en Call of Duty: Mobile (CODM).

## Especificaciones y Compatibilidad:
- **Nombre de la App:** CODM META Armero
- **Package ID:** `com.codm.meta.loadouts`
- **Compatibilidad Android:** Android 15 y Android 16 (compileSdkVersion 36, targetSdkVersion 36)
- **Dispositivos:** Teléfonos y Tablets (Optimizado con diseño fluido para pantallas grandes como Xiaomi Pad Pro 12.1" con HyperOS).
- **Funcionamiento:** 100% Offline con persistencia local.

## Funcionalidades Principales:
1. **Inicio:** Resumen de códigos oficiales confirmados y acceso rápido a herramientas.
2. **Armas:** Catálogo oficial clasificado por categorías (Fusiles de asalto, Subfusiles, Escopetas, Francotiradores, Fusiles de tirador y Ametralladoras ligeras).
3. **Clases META:** Configuraciones de 5 accesorios para corta, media y larga distancia con códigos oficiales (ej: `BAL-27: 1C6C7J8A`, `MK2: 1D2C4A8A9C`, `Fennec: 1C2C4A6B8A`) y estado de verificación transparente.
4. **Favoritos:** Marcado y consulta rápida de armas preferidas con persistencia local.
5. **Mi Armero (Constructor):**
   - Análisis individual de las 9 ranuras oficiales de CODM.
   - Limitación estricta de máximo 5 accesorios equipados simultáneamente.
   - Cálculo acumulativo verificado de estadísticas (alcance, retroceso, daño base).
   - Recomendador táctico automático según distancia de combate.
   - Guardado local de clases personalizadas.

## Integridad de Recursos (PDF Original):
- El directorio `assets/source/armamento/` está preparado para alojar el archivo original `ARMAMENTO COMD.pdf` (344 páginas) y las imágenes auténticas extraídas del juego.
- Todo accesorio o arma que no posea imagen oficial extraída muestra «Imagen no disponible» y «Dato no disponible» en estadísticas no verificadas, evitando cualquier invención de datos.

## Compilación del APK:
Para compilar un nuevo APK de depuración:
```bash
cd codm-app
npm run cap:sync
cd android
./gradlew assembleDebug
```
El archivo instalable se genera en:
`codm-app/android/app/build/outputs/apk/debug/app-debug.apk`
