@echo off
title Anonymous Suggestion Box Launcher (Demo Mode)
cd /d "%~dp0"

echo ==========================================================
echo    ANONYMOUS EMPLOYEE SUGGESTION BOX (DEMO SUITE)
echo ==========================================================
echo [1] Menjalankan Backend SQLite + Socket.io (Port 5000)
echo [2] Menjalankan Frontend React Vite (Port 3000)
echo [3] Membuka Desktop App Electron untuk Karyawan
echo ----------------------------------------------------------
echo Dashboard HR dapat dibuka di browser: http://localhost:3000/hr
echo ==========================================================

npm run demo
pause

