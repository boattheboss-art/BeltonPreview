@echo off
setlocal
chcp 65001 >nul

title Belton AI Copilot - Secure GPU Tunnel (NVIDIA RTX)

echo ====================================================================
echo   BELTON AI COPILOT - SECURE GPU TUNNEL (NVIDIA RTX 3050)
echo ====================================================================
echo.

:: 1. Check Ollama
echo [1/2] Checking Ollama Local AI Engine...
curl.exe -s http://127.0.0.1:11434/ >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ollama is not running. Starting Ollama...
    start "" ollama serve
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Ollama is running and ready on your local GPU!
)

:: 2. Locate cloudflared binary
set "BIN="
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    set "BIN=C:\Program Files (x86)\cloudflared\cloudflared.exe"
)
if not defined BIN (
    if exist "C:\Program Files\cloudflared\cloudflared.exe" (
        set "BIN=C:\Program Files\cloudflared\cloudflared.exe"
    )
)
if not defined BIN (
    where cloudflared >nul 2>&1
    if not errorlevel 1 (
        set "BIN=cloudflared"
    )
)

if not defined BIN (
    echo [ERROR] cloudflared.exe not found!
    echo Please install it via: winget install Cloudflare.cloudflared
    pause
    exit /b 1
)

echo [OK] Cloudflare Tunnel binary located.
echo.
echo ====================================================================
echo   STARTING SECURE HTTPS TUNNEL TO RENDER.COM...
echo.
echo   Instructions:
echo   1. Look for the line below that shows:
echo      https://......trycloudflare.com
echo   2. Copy that URL and paste into Render Dashboard:
echo      Key:   OLLAMA_BASE_URL
echo      Value: https://......trycloudflare.com
echo.
echo   3. Keep this window OPEN while you want Render to use your GPU.
echo ====================================================================
echo.

"%BIN%" tunnel --url http://127.0.0.1:11434 --http-host-header localhost:11434
pause
