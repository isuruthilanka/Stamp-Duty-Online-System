@echo off
set PORT=51740
echo ===================================================
echo   STAMP DUTY ONLINE SYSTEM - ULTIMATE START
echo ===================================================
echo.
echo [1/3] Cleaning up Port %PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo [2/3] Starting Server...
:: Use direct node to bypass execution policy
start /b node node_modules\vite\bin\vite.js --host 127.0.0.1 --port %PORT%
echo.
echo [3/3] Waiting for connection...
timeout /t 7 /nobreak >nul
echo.
echo Launching Portal: http://127.0.0.1:%PORT%
start http://127.0.0.1:%PORT%
echo.
echo ===================================================
echo   PORTAL IS NOW RUNNING. DO NOT CLOSE THIS WINDOW.
echo ===================================================
pause
