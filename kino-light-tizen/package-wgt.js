const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[Kino-Light Tizen] Starting package creation...');

const appDir = __dirname;
const zipPath = path.join(appDir, 'kino-light.wgt');

if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
}

try {
    if (process.platform === 'win32') {
        execSync(`powershell -Command "Compress-Archive -Path '${appDir}\\*' -DestinationPath '${zipPath}' -Force"`);
    } else {
        execSync(`zip -r "${zipPath}" . -x "*.git*" "node_modules/*"`, { cwd: appDir });
    }
    console.log(`[Kino-Light Tizen] Created package successfully at: ${zipPath}`);
} catch (err) {
    console.error('[Kino-Light Tizen] Failed to package .wgt file:', err.message);
}
