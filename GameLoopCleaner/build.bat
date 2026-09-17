@echo off
setlocal enabledelayedexpansion
title Compilador GameLoop Cleaner

echo ========================================================================
echo        Compilando GameLoop Cleaner con C# Compiler (csc.exe)
echo ========================================================================
echo.

set "CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if not exist "%CSC_PATH%" (
    set "CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if not exist "%CSC_PATH%" (
    echo [ERROR] No se encontro csc.exe en .NET Framework.
    echo Buscando en el registro o directorio de Windows...
    for /d %%d in (C:\Windows\Microsoft.NET\Framework64\v4*) do (
        if exist "%%d\csc.exe" set "CSC_PATH=%%d\csc.exe"
    )
)

if not exist "%CSC_PATH%" (
    echo [ERROR CRITICO] No se encontro el compilador de C#.
    echo.
    pause
    exit /b 1
)

echo Compilador detectado en:
echo %CSC_PATH%
echo.
echo Compilando Program.cs...
echo.

"%CSC_PATH%" /noconfig /target:exe /win32manifest:app.manifest /out:GameLoopCleaner.exe Program.cs /r:System.dll /r:System.Core.dll /r:System.ServiceProcess.dll

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================================
    echo [EXITO] Compilacion completada con exito.
    echo Se ha creado el archivo: GameLoopCleaner.exe
    echo ========================================================================
    echo.
) else (
    echo.
    echo ========================================================================
    echo [ERROR] Ocurrio un error al compilar. Revisa los mensajes de arriba.
    echo ========================================================================
    echo.
)

echo Presione cualquier tecla para cerrar esta ventana...
pause >nul
