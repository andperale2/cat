# GameLoop & Tencent Deep Cleaner - Senior Windows Tool

Esta herramienta ha sido desarrollada específicamente para purgar completamente cualquier rastro, residuo, servicio, carpeta y clave de registro dejada por **GameLoop**, **Tencent Gaming Buddy**, **TxGameAssistant** y servicios asociados en sistemas operativos **Windows 10 / Windows 11**.

---

## 🚀 Características Principales

1. **Elevación de Privilegios Automática:**
   - Incorpora manifiesto UAC (`requireAdministrator`) para forzar ejecución con privilegios de Administrador.
   - Detecta si no posee permisos elevados y solicita elevación automática mediante UAC.

2. **Creación de Punto de Restauración:**
   - Llama a PowerShell (`Checkpoint-Computer`) antes de realizar modificaciones para ofrecer un respaldo de seguridad del sistema.

3. **Finalización Forzada de Procesos y Servicios:**
   - Mata inmediatamente todos los procesos activos (`AppMarket.exe`, `AndroidProcess.exe`, `QMEmulatorService.exe`, `GameLoop.exe`, `TSettingCenter.exe`, `aow_exe.exe`, etc.).
   - Detiene y elimina servicios del sistema y controladores (`QMEmulatorService`, `TFsDriver`, `TP3Service`, `aow_drv`, `TencentNetFilter`, etc.).

4. **Purga Completa del Sistema de Archivos (Unidades C:, D:, E:):**
   - Toma posesión (`takeown`) y restablece permisos (`icacls`) para eliminar carpetas/archivos bloqueados o protegidos.
   - Limpia carpetas de instalación en `C:\`, `D:\`, `E:\` (`Program Files`, `Program Files (x86)`, `TxGameAssistant`, `GameLoop`, `ProgramData`).
   - Purga perfiles de usuario y carpetas ocultas (`%APPDATA%\Tencent`, `%LOCALAPPDATA%\Tencent`, `%USERPROFILE%\.GameLoopBox`, `%TEMP%\Tencent`).
   - Escanea la carpeta `Prefetch` (`*GAMELOOP*`, `*TENCENT*`) y `System32\drivers` (`TFsDriver*.sys`, `aow_drv*.sys`, `TP3Service*.sys`).

5. **Limpieza Profunda del Registro (Regedit):**
   - Elimina subclaves completas en `HKEY_CURRENT_USER`, `HKEY_LOCAL_MACHINE` y `HKEY_USERS`.
   - Limpia entradas de desinstalación en `CurrentVersion\Uninstall` (incluyendo `WOW6432Node`).
   - Limpia entradas de inicio automático (`CurrentVersion\Run`, `RunOnce`).
   - Limpia registros de compatibilidad y caché UI (`AppCompatFlags\Compatibility Assistant\Store` y `MuiCache`).

6. **Consola Interactiva y Registro (Logging):**
   - Consola con formato de colores (verde para éxito, amarillo para advertencias).
   - Genera automáticamente un archivo de reporte detallado `cleanup_log.txt` en el mismo directorio.

---

## 🛠️ Instrucciones de Compilación Automática (Windows)

No requiere instalar Visual Studio, SDKs pesados ni herramientas de terceros. Utiliza el compilador nativo de C# (`csc.exe`) incluido por defecto en todas las instalaciones de Windows.

### Opción A: Compilación rápida mediante `build.bat` (Recomendado)
1. Abre la carpeta `GameLoopCleaner`.
2. Haz doble clic sobre el archivo `build.bat`.
3. Se generará automáticamente el ejecutable `GameLoopCleaner.exe` listo para usar.

### Opción B: Compilación manual desde la Consola de Comandos (CMD)
1. Abre CMD como Administrador.
2. Navega a la carpeta del proyecto:
   ```cmd
   cd ruta\a\GameLoopCleaner
   ```
3. Ejecuta el comando nativo de compilación:
   ```cmd
   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:exe /win32manifest:app.manifest /out:GameLoopCleaner.exe Program.cs /r:System.ServiceProcess.dll
   ```

---

## 📖 Modo de Uso

1. Haz doble clic en `GameLoopCleaner.exe`.
2. Si aparece el aviso de Control de Cuentas de Usuario (UAC), haz clic en **Sí** para otorgar privilegios de Administrador.
3. La herramienta ejecutará la purga automáticamente en 5 pasos.
4. Al finalizar, revisa los resultados en la consola y consulta el archivo `cleanup_log.txt` para mayor detalle.
5. Se recomienda reiniciar la computadora al concluir el proceso.
