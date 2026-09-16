"""
Belton Technology Group - Continual Learning & Self-Improving Pipeline
Automatically runs:
1. SQLite SCADA Telemetry Extraction (Aggregates 54,050 records for machines 1-50)
2. Ingests User Interaction History (Online Experience Replay)
3. Retrains Edge Neural Network (Increasing knowledge base with every cycle)
"""

import os
import sys
import subprocess
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_DIR = os.path.join(BASE_DIR, "ai")

print("=" * 78)
print("  🚀 BELTON AI COPILOT - CONTINUAL SELF-IMPROVEMENT PIPELINE")
print("=" * 78)

# Step 1: Refresh SQLite SCADA Telemetry Profiles
print("\n[Step 1/3] Refreshing SCADA Telemetry Database Profiles for all 50 Machines...")
subprocess.run([sys.executable, os.path.join(AI_DIR, "generate_machine_telemetry_profiles.py")], check=True)

# Step 2: Ingest User Interaction Logs
feedback_file = os.path.join(AI_DIR, "data", "user_feedback_interactions.jsonl")
interaction_count = 0
if os.path.exists(feedback_file):
    with open(feedback_file, "r", encoding="utf-8") as f:
        interaction_count = sum(1 for _ in f)
print(f"\n[Step 2/3] Analyzing User Interaction Buffer ({interaction_count} new real queries detected)...")

# Step 3: Run High-Precision Adversarial Training
print("\n[Step 3/3] Training PyTorch Edge Neural Network with Cumulative Knowledge...")
subprocess.run([sys.executable, os.path.join(AI_DIR, "train_chatbot_nlp.py")], check=True)

print("\n" + "=" * 78)
print("  ✅ SELF-IMPROVEMENT PIPELINE COMPLETED SUCCESSFULLY!")
print("  The AI is now smarter with the latest Database Telemetry & User Interactions.")
print("=" * 78)
