@echo off
setlocal
echo ===================================================
echo   STAMP DUTY ONLINE SYSTEM - FINAL DIAGNOSTIC
echo ===================================================
echo.

echo [1/3] Clearing port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Port 5000 is clear.

echo.
echo [2/3] Starting Logging Server...
echo.
echo IMPORTANT: KEEP THIS WINDOW OPEN while testing.
echo.
echo 1. Keep this window open.
echo 2. Open: http://127.0.0.1:5000 
echo 3. AND try: http://192.168.1.115:5000
echo.
node serve.cjs
pause
