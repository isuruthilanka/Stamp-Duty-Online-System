@echo off
echo ===================================================
echo   STAMP DUTY ONLINE SYSTEM - FINAL FIX
echo ===================================================
echo.
echo [1/2] Clearing previous processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo [2/2] Starting server and opening browser...
echo.
start http://127.0.0.1:5000
node serve.cjs
pause
