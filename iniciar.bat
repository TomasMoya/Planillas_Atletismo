@echo off
title Atletismo - Gestor de Planillas

echo Iniciando el sistema de planillas...
echo.

:: Verificar que Docker esté corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker no está en ejecución.
    echo Por favor abrí Docker Desktop y volvé a intentarlo.
    pause
    exit /b 1
)

:: Levantar el contenedor
docker compose up -d --build

if %errorlevel% neq 0 (
    echo ERROR: No se pudo iniciar el sistema.
    pause
    exit /b 1
)

echo.
echo Sistema iniciado correctamente.
echo Abriendo el navegador...
echo.
echo Para cerrar el sistema, ejecutá "detener.bat"
echo.

:: Esperar un segundo y abrir el navegador
timeout /t 2 /nobreak >nul
start http://localhost:3000
