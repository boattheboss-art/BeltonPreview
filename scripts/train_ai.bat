@echo off
chcp 65001 > nul
cd /d "%~dp0.."
cls
echo ====================================================================
echo    BELTON TECHNOLOGY - INDUSTRIAL AI COPILOT NEURAL TRAINER
echo ====================================================================
echo.
python ai\train_belton_copilot_ai.py
echo.
pause
