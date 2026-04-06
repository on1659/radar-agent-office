@echo off
title Radar Agent Office
cd /d "%~dp0"

echo ========================================
echo   Radar Agent Office - Starting...
echo ========================================
echo.

start "Radar Server" cmd /k "cd /d %~dp0 && npx tsx packages/server/src/index.ts"
timeout /t 3 /nobreak >nul

start "Radar Client" cmd /k "cd /d %~dp0 && npx vite --config packages/client/vite.config.ts packages/client"

echo.
echo   Server: http://localhost:3001
echo   Client: http://localhost:42817
echo.
echo   Press any key to exit this window...
pause >nul
