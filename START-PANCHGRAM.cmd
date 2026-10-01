@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% equ 0 (
  start "" "http://127.0.0.1:4173"
  node server.mjs
  pause
  exit /b
)
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  start "" "http://127.0.0.1:4173"
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.mjs
  pause
  exit /b
)
echo Please install Node.js LTS from https://nodejs.org/ then run this launcher again.
pause
