@echo off
echo Starting Department of Revenue System - Full Stack...

:: Kill existing node processes on port 5001 and 5173
echo Cleaning up ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

:: Start Backend
echo Starting Backend Server on port 5001...
start cmd /k "cd server && node index.js"

:: Start Frontend
echo Starting Frontend Development Server...
npm run dev

pause
