@echo off
set "OLLAMA_MODELS=D:\ollama\models"
set "OLLAMA_NUM_PARALLEL=1"
echo Starting Ollama with OLLAMA_MODELS=%OLLAMA_MODELS% (Max GPU allocation)
"C:\Users\BOAT\AppData\Local\Programs\Ollama\ollama.exe" serve

