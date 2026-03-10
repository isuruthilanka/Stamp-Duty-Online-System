# Permanent Solution Guide

If you are seeing errors about "scripts is disabled on this system" or port conflicts, follow these steps.

## 1. Fix PowerShell Security Error (Permanent)

Open **PowerShell as Administrator** and run this single command:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

This allows your user account to run local scripts (like `npm` and `vite`) while keeping your system secure.

## 2. Using the New Start Script

I have updated `start-dev.bat` on your desktop. This script now:
1.  **Clears Port 5000**: Automatically stops any old versions of the server still running in the background.
2.  **Opens Browser**: Automatically opens [http://localhost:5000](http://localhost:5000).
3.  **Starts Vite**: Runs the server reliably on port 5000.

To start your project from now on, just **Double-Click `start-dev.bat`**.

---

### Why this happens?
Windows has a security feature called "Execution Policy" that prevents automated scripts from running. This is common on new Windows installations. The command above is the standard way developers fix this for their local environment.
