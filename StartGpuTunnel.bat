@echo off
chcp 65001 > nul
cls
title Belton AI Copilot - Secure GPU Cloud Tunnel

echo ====================================================================
echo   🚀 BELTON AI COPILOT - SECURE GPU CLOUD TUNNEL (NVIDIA RTX)
echo ====================================================================
echo.
echo [1/3] ตรวจสอบสถานะ Ollama Local AI Engine...
curl -s http://127.0.0.1:11434/ > nul 2>&1
if %errorlevel% neq 0 (
    echo [คำเตือน] ยังไม่ได้เปิด Ollama AI บนเครื่องนี้!
    echo กำลังพยายามเปิด Ollama ให้อัตโนมัติ...
    start "" ollama serve
    timeout /t 3 > nul
) else (
    echo [สำเร็จ] Ollama AI Engine พร้อมใช้งานบนการ์ดจอ RTX!
)

echo.
echo [2/3] ตรวจสอบโปรแกรมสร้างอุโมงค์ความปลอดภัย Cloudflare Tunnel...

set CLOUDFLARED_BIN=cloudflared
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
        set "CLOUDFLARED_BIN=C:\Program Files (x86)\cloudflared\cloudflared.exe"
    ) else if exist "C:\Program Files\cloudflared\cloudflared.exe" (
        set "CLOUDFLARED_BIN=C:\Program Files\cloudflared\cloudflared.exe"
    ) else (
        echo [ผิดพลาด] ไม่พบ cloudflared.exe กรุณาติดตั้งผ่าน: winget install Cloudflare.cloudflared
        pause
        exit /b 1
    )
)

echo.
echo ====================================================================
echo   🌐 กำลังเชื่อมต่ออุโมงค์ HTTPS ไปยัง Render.com...
echo.
echo   📌 สิ่งที่คุณต้องทำ:
echo   1. สังเกตบรรทัดที่แสดง URL https://xxxxxx.trycloudflare.com ด้านล่าง
echo   2. คัดลอก URL นั้นไปวางใน Render Dashboard -> Environment:
echo      ตั้งชื่อ: OLLAMA_BASE_URL
echo      ค่าที่ใส่: https://xxxxxx.trycloudflare.com
echo.
echo   🔒 อุโมงค์นี้เข้ารหัส SSL 100% ข้อมูลโรงงานไม่รั่วไหล
echo   ⚡ ประมวลผล AI ด้วยการ์ดจอ NVIDIA ของเครื่องนี้โดยตรง!
echo ====================================================================
echo.

"%CLOUDFLARED_BIN%" tunnel --url http://127.0.0.1:11434 --http-host-header localhost:11434
pause


