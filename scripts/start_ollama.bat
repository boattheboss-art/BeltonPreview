@echo off
set "OLLAMA_MODELS=D:\ollama\models"
echo Starting Ollama with OLLAMA_MODELS=%OLLAMA_MODELS%
"C:\Users\BOAT\AppData\Local\Programs\Ollama\ollama.exe" serve
