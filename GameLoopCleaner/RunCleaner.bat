@echo off
:: ========================================================================
:: GAMELOOP & TENCENT DEEP CLEANER - LANZADOR AUTOMATICO (BAT + POWERSHELL)
:: ========================================================================

title GameLoop Cleaner Launcher

:: Verificar privilegios de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [*] Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ========================================================================
echo        GAMELOOP & TENCENT GAMING BUDDY - PURGA AUTOMATICA
echo ========================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "& {
    $Host.UI.RawUI.WindowTitle = 'GameLoop Cleaner (PowerShell Direct)'
    $log = Join-Path $PSScriptRoot 'cleanup_log.txt'
    '=== Inicio de Limpieza GameLoop / Tencent ===' | Out-File $log

    function Log($msg, $color='White') {
        Write-Host $msg -ForegroundColor $color
        '[' + (Get-Date -Format 'HH:mm:ss') + '] ' + $msg | Out-File $log -Append
    }

    Log '=== PASO 1: Creando Punto de Restauracion ===' 'Cyan'
    try { Checkpoint-Computer -Description 'Pre-GameLoop-Cleanup' -RestorePointType 'MODIFY_SETTINGS' -ErrorAction SilentlyContinue; Log '[+] Punto de restauracion solicitado.' 'Green' } catch {}

    Log '=== PASO 2: Deteniendo Procesos y Servicios ===' 'Cyan'
    $procs = @('AppMarket', 'AndroidProcess', 'QMEmulatorService', 'GameLoop', 'TSettingCenter', 'aow_exe', 'TxGameAssistant', 'TencentLBS', 'TP3Service')
    foreach ($p in $procs) {
        Get-Process -Name $p -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Log ('[+] Proceso finalizado: ' + $p) 'Green'
        }
    }
    taskkill /F /IM AppMarket.exe /T >nul 2>&1
    taskkill /F /IM GameLoop.exe /T >nul 2>&1
    taskkill /F /IM aow_exe.exe /T >nul 2>&1

    $svcs = @('QMEmulatorService', 'TFsDriver', 'TP3Service', 'aow_drv', 'TencentNetFilter')
    foreach ($s in $svcs) {
        sc.exe stop $s >nul 2>&1
        sc.exe delete $s >nul 2>&1
    }

    Log '=== PASO 3: Limpiando Sistema de Archivos ===' 'Cyan'
    $targets = @(
        $env:APPDATA + '\Tencent',
        $env:LOCALAPPDATA + '\Tencent',
        $env:USERPROFILE + '\.GameLoopBox',
        'C:\Program Files\Tencent', 'C:\Program Files (x86)\Tencent',
        'D:\Program Files\Tencent', 'D:\Program Files (x86)\Tencent',
        'E:\Program Files\Tencent', 'E:\Program Files (x86)\Tencent',
        'C:\TxGameAssistant', 'D:\TxGameAssistant', 'E:\TxGameAssistant',
        'C:\GameLoop', 'D:\GameLoop', 'E:\GameLoop',
        $env:LOCALAPPDATA + '\Temp\Tencent',
        'C:\Windows\Temp\Tencent'
    )

    foreach ($t in $targets) {
        if (Test-Path $t) {
            takeown /F $t /R /D Y >nul 2>&1
            icacls $t /grant administrators:F /T /C /Q >nul 2>&1
            Remove-Item $t -Recurse -Force -ErrorAction SilentlyContinue
            Log ('[+] Eliminado: ' + $t) 'Green'
        }
    }

    Log '=== PASO 4: Limpiando Registro de Windows ===' 'Cyan'
    $regKeys = @(
        'HKCU:\Software\Tencent', 'HKCU:\Software\GameLoop', 'HKCU:\Software\TxGameAssistant',
        'HKLM:\SOFTWARE\Tencent', 'HKLM:\SOFTWARE\GameLoop', 'HKLM:\SOFTWARE\TxGameAssistant',
        'HKLM:\SOFTWARE\WOW6432Node\Tencent', 'HKLM:\SOFTWARE\WOW6432Node\GameLoop'
    )
    foreach ($r in $regKeys) {
        if (Test-Path $r) {
            Remove-Item $r -Recurse -Force -ErrorAction SilentlyContinue
            Log ('[+] Clave de registro eliminada: ' + $r) 'Green'
        }
    }

    Log '=== PASO 5: Finalizado ===' 'Cyan'
    Log ('[+] Limpieza completada. Log guardado en: ' + $log) 'Green'
}"

echo.
echo Presione cualquier tecla para salir...
pause >nul
