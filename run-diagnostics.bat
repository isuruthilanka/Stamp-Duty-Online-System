@echo off
setlocal
set LOGFILE=diagnostic_log.txt
echo =================================================== > %LOGFILE%
echo   STAMP DUTY ONLINE SYSTEM - LOGGING DIAGNOSTIC >> %LOGFILE%
echo   Date: %DATE% %TIME% >> %LOGFILE%
echo =================================================== >> %LOGFILE%
echo. >> %LOGFILE%

echo [1/6] Checking Node.js... >> %LOGFILE%
node -v >> %LOGFILE% 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. >> %LOGFILE%
) else (
    echo [OK] Node.js is present. >> %LOGFILE%
)

echo. >> %LOGFILE%
echo [2/6] Checking Port 5000... >> %LOGFILE%
netstat -ano | findstr :5000 >> %LOGFILE% 2>&1
echo [OK] Port 5000 check done. >> %LOGFILE%

echo. >> %LOGFILE%
echo [3/6] Checking Loopback (127.0.0.1)... >> %LOGFILE%
ping 127.0.0.1 -n 1 >> %LOGFILE% 2>&1
echo [OK] Loopback check done. >> %LOGFILE%

echo. >> %LOGFILE%
echo [4/6] Checking Proxy... >> %LOGFILE%
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable >> %LOGFILE% 2>&1
echo [OK] Proxy check done. >> %LOGFILE%

echo. >> %LOGFILE%
echo [5/6] Checking Hosts File... >> %LOGFILE%
type C:\Windows\System32\drivers\etc\hosts >> %LOGFILE% 2>&1
echo [OK] Hosts check done. >> %LOGFILE%

echo. >> %LOGFILE%
echo [6/6] Attempting to start server briefly... >> %LOGFILE%
echo This will attempt to start the server for 5 seconds to check for startup errors. >> %LOGFILE%
start /B node serve.cjs > server_test.txt 2>&1
timeout /t 5 >nul
taskkill /F /IM node.exe /T >nul 2>&1
type server_test.txt >> %LOGFILE%
echo [OK] Server test done. >> %LOGFILE%

echo.
echo ===================================================
echo   DIAGNOSTIC COMPLETE
echo   A file named 'diagnostic_log.txt' has been created.
echo   I will now read this file to find the issue.
echo ===================================================
echo.
echo Please wait a moment while I analyze the log...
pause
