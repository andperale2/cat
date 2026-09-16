# Kino-Light Smart TV App (Samsung Tizen OS)

Aplicación Web Nativa para Samsung Smart TV (Tizen OS) basada en la arquitectura y APIs de Kino-Light.

## Características

- **Navegación D-Pad Novedosa**: Diseñada para pantalla de TV (1080p/4K) con foco inteligente por dirección (Flecha Arriba, Abajo, Izquierda, Derecha, Enter y Back/Return).
- **Cliente HTTP API Modular**: Servicio listo (`js/services/kinoApi.js`) para conectar tus endpoints de servidor Kino-Light.
- **Reproductor Híbrido AVPlay + HTML5**:
  - Utiliza aceleración por hardware con la API de Samsung Tizen (`webapis.avplay`).
  - Incluye fallback automático a HTML5 `<video>` con `hls.js` para desarrollo y pruebas en navegador web.
- **Sin dependencias pesadas**: Construido con Vanilla JS, HTML5 y CSS3 ultra-ligero para optimizar el rendimiento y consumo de memoria RAM en televisores.

## Estructura del Proyecto

```
kino-light-tizen/
├── config.xml             # Configuración de Tizen Web App y Privilegios
├── index.html             # UI principal para Smart TV
├── css/
│   └── style.css          # Estilos para TV (resolución 1080p/4K)
├── js/
│   ├── app.js             # Controlador principal
│   ├── navigation.js      # Motor de navegación D-Pad
│   ├── player.js          # Reproductor AVPlay / HLS.js
│   └── services/
│       └── kinoApi.js     # Cliente API de Kino-Light
├── build-tizen.sh         # Script de empaquetado (Linux/macOS)
├── build-tizen.bat        # Script de empaquetado (Windows)
└── package-wgt.js         # Generador de paquete .wgt
```

## Compilación y Empaquetado (`.wgt`)

Para generar el paquete empaquetado `.wgt` listo para ser instalado en la TV:

### Con Node.js:
```bash
node package-wgt.js
```

### O usando los scripts incluidos:
- **Linux / macOS:**
  ```bash
  chmod +x build-tizen.sh
  ./build-tizen.sh
  ```
- **Windows:**
  ```cmd
  build-tizen.bat
  ```

## Despliegue en Samsung Smart TV con Tizen CLI

1. Activa el **Developer Mode** en tu televisor Samsung e ingresa la IP de tu PC de desarrollo.
2. Conecta la Tizen CLI a tu TV:
   ```bash
   tizen connect <TV_IP_ADDRESS>
   ```
3. Empaqueta la aplicación:
   ```bash
   tizen build-web -- ./
   tizen package -t wgt -s <PROFILE_NAME> -- ./
   ```
4. Instala la aplicación en la TV:
   ```bash
   tizen install -n kino-light.wgt -t <TV_DEVICE_ID>
   ```
