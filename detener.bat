@echo off
title Atletismo - Detener sistema

echo Deteniendo el sistema de planillas...
docker compose down

echo.
echo Sistema detenido correctamente.
timeout /t 2 /nobreak >nul
