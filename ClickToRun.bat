@echo off
cd /d "%~dp0"
title BELTON Industrial 3D Digital Twin and AI SCADA Server
echo ====================================================================
echo    BELTON INDUSTRIAL 3D DIGITAL TWIN ^& AI SCADA SERVER
echo ====================================================================
echo.

:: 1. Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed on this computer!
    echo [INFO] Opening nodejs.org for download...
    start https://nodejs.org/
    echo.
    echo Please download and install the LTS version of Node.js.
    echo Once installed, double-click this ClickToRun.bat file again.
    echo.
    pause
    exit /b 1
)

:: 2. Check if node_modules folder exists, if not run npm install
if not exist node_modules (
    echo [INFO] First time run detected. Installing dependencies...
    echo [INFO] This will take a few seconds...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed! Please check your internet connection.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully!
    echo.
)

:: 3. Open the web browser
echo [INFO] Opening Web Application at http://localhost:8080 ...
echo [INFO] Default Login  ^|  Username: admin  ^|  Password: 60632
start http://localhost:8080
echo.

:: 4. Start the Node.js server
echo [INFO] Starting Local Server on Port 8080...
npm start
