@echo off
echo Resetting Department of Revenue System Database...

:: Kill existing node processes on port 5001 and 5173
echo Cleaning up ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

:: Delete existing database
if exist server\database.sqlite (
    echo Deleting existing database...
    del server\database.sqlite
)

echo Starting Fresh System...
call start-all.bat
