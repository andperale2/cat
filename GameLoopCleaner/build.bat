@echo off
title Compilando GameLoop Cleaner...
echo ========================================================================
echo        Compilando GameLoop Cleaner con CSC (C# Compiler)
echo ========================================================================
echo.

set CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe

if not exist "%CSC_PATH%" (
    set CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
)

if not exist "%CSC_PATH%" (
    echo [ERROR] No se encontro el compilador de .NET Framework (csc.exe).
    echo Asegurese de tener instalado .NET Framework 4.x en su sistema Windows.
    pause
    exit /b 1
)

echo Usando compilador: %CSC_PATH%
echo Compilando Program.cs y app.manifest...
echo.

"%CSC_PATH%" /target:exe /win32manifest:app.manifest /out:GameLoopCleaner.exe Program.cs /r:System.ServiceProcess.dll

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [EXITO] Compilacion completada con exito.
    echo Archivo generado: GameLoopCleaner.exe
    echo.
) else (
    echo.
    echo [ERROR] Hubo un error durante la compilacion.
    echo.
)

pause
