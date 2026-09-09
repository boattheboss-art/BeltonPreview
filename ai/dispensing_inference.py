"""
Belton Technology Group - ACA Line (Actuator Coil Assembly)
Standalone AI Inference & Live Parameter Evaluator
"""

import os
import json
import torch
import numpy as np

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "dispensing_ai_model.pt")

class BeltonDispensingInference:
    def __init__(self, model_path=MODEL_PATH):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}. Please run train_dispensing_ai.py first.")
            
        checkpoint = torch.load(model_path, weights_only=False)
        self.x_mean = np.array(checkpoint['x_mean'], dtype=np.float32)
        self.x_std = np.array(checkpoint['x_std'], dtype=np.float32)
        self.y_reg_mean = checkpoint['y_reg_mean']
        self.y_reg_std = checkpoint['y_reg_std']
        self.val_mae_kpa = checkpoint.get('val_mae_kpa', 0.0)
        self.val_acc = checkpoint.get('val_acc', 0.0)
        
        # Load architecture
        from train_dispensing_ai import MultiTaskDispensingNN
        self.model = MultiTaskDispensingNN(input_dim=6)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
        self.labels = ["Optimal Fillet (100% OK)", "Underfill / Clogging Risk", "Overflow / Flash Risk"]

    def predict(self, pot_life_min, preheat_temp_c, ambient_temp_c=22.0, ambient_humidity=45.0, needle_wear=0.1, cycle_rate=20.0):
        raw_x = np.array([pot_life_min, preheat_temp_c, ambient_temp_c, ambient_humidity, needle_wear, cycle_rate], dtype=np.float32)
        norm_x = (raw_x - self.x_mean) / self.x_std
        tensor_x = torch.tensor(norm_x).unsqueeze(0)
        
        with torch.no_grad():
            pred_reg, pred_cls = self.model(tensor_x)
            optimal_pressure_kpa = float(pred_reg.item() * self.y_reg_std + self.y_reg_mean)
            probabilities = torch.softmax(pred_cls, dim=1).squeeze(0).numpy()
            predicted_class = int(np.argmax(probabilities))
            
        return {
            "optimal_pressure_kpa": round(optimal_pressure_kpa, 2),
            "predicted_status": self.labels[predicted_class],
            "status_code": predicted_class,
            "probabilities": {
                "optimal": round(float(probabilities[0]) * 100, 2),
                "underfill_clog": round(float(probabilities[1]) * 100, 2),
                "overflow_flash": round(float(probabilities[2]) * 100, 2)
            }
        }

if __name__ == "__main__":
    engine = BeltonDispensingInference()
    print("=" * 60)
    print("  BELTON DISPENSING AI INFERENCE ENGINE TEST RUN  ")
    print("=" * 60)
    
    test_cases = [
        {"name": "Fresh Mix (T=0m, Preheat=60 C)", "pot": 5.0, "temp": 60.0, "wear": 0.05},
        {"name": "Aged Mix (T=180m, Higher Viscosity)", "pot": 180.0, "temp": 60.0, "wear": 0.15},
        {"name": "Needle Tip Deposit Accumulation", "pot": 60.0, "temp": 58.0, "wear": 0.85},
        {"name": "Overheated Pre-heat Stage (T=74 C)", "pot": 10.0, "temp": 74.5, "wear": 0.05}
    ]
    
    for case in test_cases:
        res = engine.predict(pot_life_min=case["pot"], preheat_temp_c=case["temp"], needle_wear=case["wear"])
        print(f"\nTest Scenario: {case['name']}")
        print(f"  -> Recommended Pressure: {res['optimal_pressure_kpa']} kPa")
        print(f"  -> Status: {res['predicted_status']}")
        print(f"  -> Confidence: Optimal {res['probabilities']['optimal']}% | Clog {res['probabilities']['underfill_clog']}% | Overflow {res['probabilities']['overflow_flash']}%")
    print("=" * 60)
