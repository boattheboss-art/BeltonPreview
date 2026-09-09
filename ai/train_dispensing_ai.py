"""
Belton Technology Group - ACA Line (Actuator Coil Assembly)
AI Dynamic Epoxy Dispensing & Defect Prevention Model
Reference: Belton Process Intro Slide 26 (Pre-heat), Slide 27 (Coil Disp.),
           Slide 28 (E-Disp.), Slide 29 (Epoxy Mend)

This script:
1. Simulates physical rheological dynamics of cleanroom epoxy dispensing (Poiseuille flow,
   pot-life polymerization kinetics, Arrhenius temperature viscosity relationship).
2. Builds and trains a Multi-Task Deep Neural Network (PyTorch) to:
   - Head A (Regression): Predict optimal pneumatic dispensing pressure (kPa) to guarantee
     exact target mass (12.50 mg).
   - Head B (Classification): Detect defect risk (0: Optimal Fillet, 1: Underfill/Clog, 2: Overflow).
3. Evaluates model performance and exports:
   - PyTorch model checkpoint: ai/models/dispensing_ai_model.pt
   - Standalone JSON weight matrices: ai/models/dispensing_model_weights.json (for pure JS edge inference)
"""

import os
import json
import math
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader

# Set random seeds for reproducibility
np.random.seed(42)
torch.manual_seed(42)

# Ensure models directory exists
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ==============================================================================
# 1. SYNTHETIC PHYSICAL PROCESS GENERATOR (BELTON SPECIFICATIONS)
# ==============================================================================
def generate_belton_dispensing_dataset(n_samples=5000):
    """
    Generates synthetic dataset modeled after Belton ACA cleanroom dispensing specs.
    
    Inputs (Features):
      1. pot_life_min: Minutes since epoxy two-component mix [0 to 240 min]
      2. preheat_temp_c: Substrate & nozzle preheat temperature [50 to 75 °C]
      3. ambient_temp_c: Cleanroom ambient temperature [20 to 24 °C]
      4. ambient_humidity: Cleanroom relative humidity [40 to 55 %]
      5. needle_wear_index: Wear/deposit accumulation on micro-needle tip [0.0 to 1.0]
      6. cycle_rate_cpm: Machine cycles per minute [10 to 30 cpm]
      
    Targets:
      1. optimal_pressure_kpa: Optimal pneumatic pressure required to dispense 12.50 mg
      2. defect_label: 0 = Normal, 1 = Underfill/Clogging Risk, 2 = Overflow/Flash Risk
    """
    print(f"[*] Generating {n_samples} physics-grounded ACA dispensing cycles...")
    
    # Feature distributions
    pot_life = np.random.uniform(0.0, 240.0, n_samples)          # minutes
    preheat_temp = np.random.uniform(50.0, 75.0, n_samples)      # °C
    ambient_temp = np.random.uniform(20.0, 24.0, n_samples)      # °C
    humidity = np.random.uniform(40.0, 55.0, n_samples)          # %
    needle_wear = np.random.beta(1.5, 5.0, n_samples)           # 0 to 1 index
    cycle_rate = np.random.uniform(12.0, 28.0, n_samples)        # cycles/min

    # Physical viscosity simulation (Arrhenius + Curing kinetics)
    # Base viscosity at 22°C = 8,500 mPa.s
    # Temperature decreases viscosity: exp( -E_a / R * (T - T_ref) )
    # Pot-life increases viscosity: exp( k_cure * t )
    T_ref = 60.0 # Nominal preheat
    temp_factor = np.exp(-0.035 * (preheat_temp - T_ref))
    time_factor = np.exp(0.0055 * pot_life)
    humidity_factor = 1.0 + 0.002 * (humidity - 45.0)
    
    viscosity = 8500.0 * temp_factor * time_factor * humidity_factor # in mPa.s
    
    # Poiseuille flow: Q = (pi * r^4 * Delta_P) / (8 * eta * L)
    # Nominal pressure for 12.5 mg at reference conditions = 210.0 kPa
    # To maintain constant flow rate Q as viscosity rises, Delta_P must scale proportionally:
    effective_flow_resistance = (viscosity / 8500.0) * (1.0 + 0.45 * needle_wear)
    
    # Optimal pressure calculation with subtle realistic sensor noise
    base_optimal_pressure = 210.0 * effective_flow_resistance
    sensor_noise = np.random.normal(0, 1.2, n_samples)
    optimal_pressure = np.clip(base_optimal_pressure + sensor_noise, 150.0, 360.0)
    
    # Defect labeling:
    defect_labels = np.zeros(n_samples, dtype=np.int64)
    for i in range(n_samples):
        if effective_flow_resistance[i] > 1.45 or needle_wear[i] > 0.75:
            defect_labels[i] = 1 # Underfill / Clog Risk
        elif preheat_temp[i] > 72.0 and pot_life[i] < 30.0 and effective_flow_resistance[i] < 0.75:
            defect_labels[i] = 2 # Overflow Risk
        else:
            defect_labels[i] = 0 # Optimal Fillet

    X = np.stack([pot_life, preheat_temp, ambient_temp, humidity, needle_wear, cycle_rate], axis=1)
    y_reg = optimal_pressure.astype(np.float32)
    y_cls = defect_labels

    print(f"[*] Dataset ready. Label distribution:")
    print(f"    - Optimal Fillet (0): {np.sum(y_cls == 0)} ({np.mean(y_cls == 0)*100:.1f}%)")
    print(f"    - Underfill/Clog (1): {np.sum(y_cls == 1)} ({np.mean(y_cls == 1)*100:.1f}%)")
    print(f"    - Overflow/Flash (2): {np.sum(y_cls == 2)} ({np.mean(y_cls == 2)*100:.1f}%)")

    return X.astype(np.float32), y_reg, y_cls


# ==============================================================================
# 2. MULTI-TASK DEEP NEURAL NETWORK ARCHITECTURE
# ==============================================================================
class MultiTaskDispensingNN(nn.Module):
    """
    Shared trunk network with dual specialized prediction heads:
    1. Pressure Head: Regresses the optimal pneumatic pressure (kPa)
    2. Defect Head: Classifies dispense health into 3 quality tiers
    """
    def __init__(self, input_dim=6):
        super(MultiTaskDispensingNN, self).__init__()
        
        # Shared feature extractor
        self.trunk = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Linear(64, 48),
            nn.ReLU(),
            nn.BatchNorm1d(48),
            nn.Linear(48, 32),
            nn.ReLU()
        )
        
        # Head 1: Optimal Pressure Regression (Linear)
        self.pressure_head = nn.Sequential(
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )
        
        # Head 2: Defect Classification (3 classes)
        self.defect_head = nn.Sequential(
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 3)
        )

    def forward(self, x):
        features = self.trunk(x)
        pressure = self.pressure_head(features)
        defect_logits = self.defect_head(features)
        return pressure.squeeze(-1), defect_logits


# ==============================================================================
# 3. TRAINING AND VALIDATION PIPELINE
# ==============================================================================
def train_model():
    print("=" * 70)
    print("  BELTON TECHNOLOGY - ACA LINE AI EPOXY DISPENSING TRAINING  ")
    print("=" * 70)
    
    # 1. Prepare data
    X, y_reg, y_cls = generate_belton_dispensing_dataset(6000)
    
    # Train / Val Split (80 / 20)
    n_train = int(len(X) * 0.8)
    X_train_raw, X_val_raw = X[:n_train], X[n_train:]
    y_reg_train, y_reg_val = y_reg[:n_train], y_reg[n_train:]
    y_cls_train, y_cls_val = y_cls[:n_train], y_cls[n_train:]
    
    # Compute Normalization Statistics
    x_mean = np.mean(X_train_raw, axis=0)
    x_std = np.std(X_train_raw, axis=0) + 1e-7
    y_reg_mean = float(np.mean(y_reg_train))
    y_reg_std = float(np.std(y_reg_train) + 1e-7)
    
    # Standardize
    X_train = (X_train_raw - x_mean) / x_std
    X_val = (X_val_raw - x_mean) / x_std
    y_reg_train_norm = (y_reg_train - y_reg_mean) / y_reg_std
    y_reg_val_norm = (y_reg_val - y_reg_mean) / y_reg_std
    
    # PyTorch DataLoaders
    train_dataset = TensorDataset(
        torch.tensor(X_train, dtype=torch.float32),
        torch.tensor(y_reg_train_norm, dtype=torch.float32),
        torch.tensor(y_cls_train, dtype=torch.long)
    )
    val_dataset = TensorDataset(
        torch.tensor(X_val, dtype=torch.float32),
        torch.tensor(y_reg_val_norm, dtype=torch.float32),
        torch.tensor(y_cls_val, dtype=torch.long)
    )
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=128, shuffle=False)
    
    # 2. Instantiate Model, Loss & Optimizer
    model = MultiTaskDispensingNN(input_dim=6)
    reg_criterion = nn.MSELoss()
    cls_criterion = nn.CrossEntropyLoss()
    
    optimizer = optim.AdamW(model.parameters(), lr=0.003, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=40)
    
    EPOCHS = 40
    print(f"\n[*] Training MultiTaskDispensingNN for {EPOCHS} epochs...")
    
    best_val_loss = float("inf")
    
    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss = 0.0
        
        for batch_x, batch_y_reg, batch_y_cls in train_loader:
            optimizer.zero_grad()
            pred_reg, pred_cls = model(batch_x)
            
            loss_reg = reg_criterion(pred_reg, batch_y_reg)
            loss_cls = cls_criterion(pred_cls, batch_y_cls)
            
            loss = loss_reg + 1.2 * loss_cls
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * len(batch_x)
            
        scheduler.step()
        train_loss /= len(train_dataset)
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_reg_mae = 0.0
        correct_cls = 0
        total_cls = 0
        
        with torch.no_grad():
            for batch_x, batch_y_reg, batch_y_cls in val_loader:
                pred_reg, pred_cls = model(batch_x)
                loss_reg = reg_criterion(pred_reg, batch_y_reg)
                loss_cls = cls_criterion(pred_cls, batch_y_cls)
                val_loss += (loss_reg + 1.2 * loss_cls).item() * len(batch_x)
                
                # Unnormalize pressure prediction to calculate real MAE in kPa
                pred_pressure_kpa = pred_reg.numpy() * y_reg_std + y_reg_mean
                true_pressure_kpa = batch_y_reg.numpy() * y_reg_std + y_reg_mean
                val_reg_mae += np.sum(np.abs(pred_pressure_kpa - true_pressure_kpa))
                
                # Accuracy
                pred_labels = torch.argmax(pred_cls, dim=1)
                correct_cls += (pred_labels == batch_y_cls).sum().item()
                total_cls += len(batch_y_cls)
                
        val_loss /= len(val_dataset)
        val_mae_kpa = val_reg_mae / len(val_dataset)
        val_acc = (correct_cls / total_cls) * 100.0
        
        if epoch % 10 == 0 or epoch == 1:
            print(f"Epoch [{epoch:2d}/{EPOCHS}] | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
                  f"Pressure MAE: {val_mae_kpa:.2f} kPa | Defect Acc: {val_acc:.1f}%")
                  
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            pt_path = os.path.join(MODELS_DIR, "dispensing_ai_model.pt")
            torch.save({
                'model_state_dict': model.state_dict(),
                'x_mean': x_mean.tolist(),
                'x_std': x_std.tolist(),
                'y_reg_mean': y_reg_mean,
                'y_reg_std': y_reg_std,
                'val_mae_kpa': float(val_mae_kpa),
                'val_acc': float(val_acc)
            }, pt_path)

    print(f"\n[OK] PyTorch model successfully saved to: {pt_path}")

    # ==============================================================================
    # 4. EXPORT WEIGHTS TO JSON FOR PURE JAVASCRIPT EDGE INFERENCE
    # ==============================================================================
    print("[*] Exporting model weights to JSON for real-time 3D browser inference...")
    
    model.eval()
    state = model.state_dict()
    
    # Dynamically export all state_dict tensors to JSON
    json_layers = {}
    for k, v in state.items():
        json_layers[k.replace(".", "_")] = v.cpu().numpy().tolist()
        
    json_export = {
        "metadata": {
            "model_name": "Belton_ACA_Epoxy_Dispensing_NN",
            "version": "1.0.0",
            "framework": "PyTorch 2.13.0 -> JSON Edge Export",
            "accuracy": f"{val_acc:.2f}%",
            "pressure_mae_kpa": f"{val_mae_kpa:.2f} kPa",
            "feature_names": [
                "pot_life_min", "preheat_temp_c", "ambient_temp_c",
                "ambient_humidity", "needle_wear_index", "cycle_rate_cpm"
            ]
        },
        "stats": {
            "x_mean": x_mean.tolist(),
            "x_std": x_std.tolist(),
            "y_reg_mean": y_reg_mean,
            "y_reg_std": y_reg_std
        },
        "layers": json_layers
    }
    
    json_path = os.path.join(MODELS_DIR, "dispensing_model_weights.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_export, f, indent=2)
        
    # Also save a copy to public/models so client-side Three.js can fetch it easily!
    public_models_dir = os.path.join(os.path.dirname(__file__), "..", "public", "models")
    os.makedirs(public_models_dir, exist_ok=True)
    public_json_path = os.path.join(public_models_dir, "dispensing_model_weights.json")
    with open(public_json_path, "w", encoding="utf-8") as f:
        json.dump(json_export, f, indent=2)

    print(f"[OK] JSON edge model weights saved to: {json_path}")
    print(f"[OK] Public copy saved for 3D factory: {public_json_path}")
    print("=" * 70)


if __name__ == "__main__":
    train_model()
