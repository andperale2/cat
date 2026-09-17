# GameLoop & Tencent Deep Cleaner - Senior Windows Tool

Esta herramienta ha sido desarrollada específicamente para purgar completamente cualquier rastro, residuo, servicio, carpeta y clave de registro dejada por **GameLoop**, **Tencent Gaming Buddy**, **TxGameAssistant** y servicios asociados en sistemas operativos **Windows 10 / Windows 11**.

---

## 🚀 Opciones de Ejecución

Tienes dos formas súper sencillas de ejecutar la purga:

### 1. Opción Directa (Sin Compilar):
1. Ve a la carpeta `GameLoopCleaner`.
2. Haz doble clic en **`RunCleaner.bat`**.
3. Acepta los permisos de Administrador (UAC). El script ejecutará la purga automáticamente.

---

### 2. Opción Ejecutable Nativo C# (`.EXE`):

#### Compilación Automática:
1. Haz doble clic en **`build.bat`**.
2. Se compilará inmediatamente el archivo **`GameLoopCleaner.exe`** utilizando el compilador nativo de Windows (`csc.exe`).
3. Haz doble clic en `GameLoopCleaner.exe` para iniciar la limpieza.

#### Compilación Manual desde CMD (como Administrador):
```cmd
cd GameLoopCleaner
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /noconfig /target:exe /win32manifest:app.manifest /out:GameLoopCleaner.exe Program.cs /r:System.dll /r:System.Core.dll /r:System.ServiceProcess.dll
```

---

## 📋 Lo que realiza la herramienta:

1. **Elevación de Privilegios UAC:** Forzada a nivel de sistema (`requireAdministrator` / `RunAs`).
2. **Punto de Restauración:** Crea un respaldo antes de modificar el registro.
3. **Mata Procesos y Servicios:** Finaliza `AppMarket.exe`, `GameLoop.exe`, `aow_exe.exe`, `QMEmulatorService`, `TFsDriver`, `TP3Service`, `aow_drv`, etc.
4. **Purga de Archivos (C:, D:, E:):** Usa `takeown` e `icacls` para borrar carpetas bloqueadas en Program Files, AppData, Temp, Prefetch y System32\drivers.
5. **Limpieza del Registro:** Ppurga subclaves en HKCU, HKLM, HKU, Uninstall, Run/RunOnce y MuiCache.
6. **Reporte:** Guarda un archivo `cleanup_log.txt` con el resumen completo.
