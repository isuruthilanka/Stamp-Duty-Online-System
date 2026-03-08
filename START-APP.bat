@echo off
title Stamp Duty System - Launcher
color 0A

echo ============================================================
echo    STAMP DUTY ONLINE SYSTEM - STARTING ALL SERVICES
echo ============================================================
echo.

:: ---- Kill any leftover processes on our ports ----
echo [1/3] Cleaning up old processes on ports 5001 and 5173...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: ---- Start the Backend (Express API) ----
echo [2/3] Starting Backend Server on port 5001...
start "BACKEND - API Server" cmd /k "title BACKEND && color 1F && cd /d "%~dp0server" && echo Backend starting... && node index.js"

timeout /t 3 /nobreak >nul

:: ---- Start the Frontend (Vite) ----
echo [3/3] Starting Frontend (Vite) on port 5173...
start "FRONTEND - Vite Dev Server" cmd /k "title FRONTEND && color 2F && cd /d "%~dp0" && echo Frontend starting... && npm run dev"

timeout /t 6 /nobreak >nul

:: ---- Open Browser ----
echo.
echo Opening browser at http://127.0.0.1:5173
start http://127.0.0.1:5173

echo.
echo ============================================================
echo   BOTH SERVERS ARE RUNNING.
echo   - Frontend : http://127.0.0.1:5173
echo   - Backend  : http://127.0.0.1:5001
echo.
echo   Close the two CMD windows to stop the servers.
echo ============================================================
echo.
pause
