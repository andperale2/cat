const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Empaquetando dango Tizen TV App (.wgt) ---');

const tizenDir = __dirname;
const outputWgt = path.join(tizenDir, 'dango-tizen.wgt');

if (fs.existsSync(outputWgt)) {
    fs.unlinkSync(outputWgt);
}

try {
    // Intenta usar tizen CLI si está instalado en el sistema
    console.log('Intentando empaquetar con Tizen CLI...');
    execSync(`tizen package -t wgt -o "${tizenDir}" -- "${tizenDir}"`, { stdio: 'inherit' });
    console.log('¡Empaquetado exitoso con Tizen CLI!');
} catch (err) {
    console.log('Tizen CLI no encontrado o falló. Creando archivo .wgt (ZIP) manualmente...');

    try {
        const zipCmd = `cd "${tizenDir}" && zip -r "${outputWgt}" config.xml index.html css js res icon.png 2>/dev/null || true`;
        execSync(zipCmd);
        if (fs.existsSync(outputWgt)) {
            console.log(`¡Archivo .wgt creado exitosamente en ${outputWgt}!`);
        } else {
            console.log('Para generar el paquete .wgt final, instala Tizen Studio CLI o comprime el contenido de tizen-app/ en formato .zip y renómbralo a .wgt');
        }
    } catch (e) {
        console.error('Error al empaquetar:', e.message);
    }
}
