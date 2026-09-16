"""
Belton Technology Group - Live 30-Second SCADA Telemetry Streamer
Simulates continuous factory IoT/PLC telemetry data ingestion into SQLite.
Every 30 seconds:
- Emits 50 live machine telemetry records with current timestamps (datetime.now()).
- Commits records to 'telemetry_logs' and 'quality_inspections' in belton_scada.db.
- Writes a real-time status summary to ai/data/scada_live_state.json for 0ms web API latency.
"""

import os
import sys
import time
import json
import random
import math
import sqlite3
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "belton_scada.db")
CACHE_PATH = os.path.join(DATA_DIR, "scada_live_state.json")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def stream_tick(conn=None):
    close_after = False
    if conn is None:
        conn = get_db_connection()
        close_after = True

    cursor = conn.cursor()
    now = datetime.now()
    now_iso = now.strftime("%Y-%m-%d %H:%M:%S")

    # 1. Fetch latest state for each machine
    cursor.execute("""
    SELECT machine_id, MAX(shot_number), pot_life_min, needle_wear_index, batch_no
    FROM telemetry_logs
    GROUP BY machine_id;
    """)
    machine_states = {row[0]: {
        "shot": row[1],
        "pot_life": row[2],
        "wear": row[3],
        "batch": row[4]
    } for row in cursor.fetchall()}

    telemetry_rows = []
    inspection_rows = []

    # Cleanroom environmental readings right now
    hour = now.hour + now.minute / 60.0
    ambient_temp = round(21.5 + 0.6 * math.sin((hour - 8) / 24.0 * 2 * math.pi) + random.gauss(0, 0.08), 2)
    ambient_hum = round(45.5 + 2.5 * math.sin((hour - 12) / 24.0 * 2 * math.pi) + random.gauss(0, 0.2), 2)
    T_ref = 60.0

    recent_events = []

    for idx in range(1, 51):
        m_id = f"ACA-DISP-{idx:02d}"
        state = machine_states.get(m_id, {
            "shot": 1000,
            "pot_life": 30.0,
            "wear": 0.15,
            "batch": "LOT-EPX-2026-09B"
        })

        is_machine_27 = (idx == 27)
        is_machine_14 = (idx == 14)
        is_machine_38 = (idx == 38)

        # Increment shots (approx 7-8 shots per 30 seconds at 15 cpm)
        if is_machine_27:
            # Machine 27 is under maintenance hold, zero shots
            shots_added = 0
            shot_num = state["shot"]
            cycle_time = 0.0
            pressure = 0.0
            needle_wear = min(0.98, state["wear"])
            pot_life = state["pot_life"]
            preheat = 22.0
            measured_mass = 0.0
            defect = 1 # Maintenance alert
            disposition = "MAINTENANCE_HOLD"
        else:
            shots_added = random.randint(7, 8)
            shot_num = state["shot"] + shots_added
            cycle_time = round(random.uniform(3.8, 4.2), 2)

            # Advance pot-life by 0.5 minutes (30s)
            pot_life = state["pot_life"] + 0.5
            batch_no = state["batch"]
            if pot_life > 240.0:
                pot_life = 0.0 # Operator changed syringe lot!
                batch_no = "LOT-EPX-2026-09B"

            # Wear progression
            wear_rate = 0.00008 if (is_machine_14 or is_machine_38) else 0.00002
            needle_wear = round(min(0.95, state["wear"] + wear_rate * shots_added), 4)
            preheat = round(60.0 + random.gauss(0, 0.6), 2)

            # Poiseuille Flow dynamics
            temp_factor = math.exp(-0.035 * (preheat - T_ref))
            time_factor = math.exp(0.0055 * pot_life)
            hum_factor = 1.0 + 0.002 * (ambient_hum - 45.0)
            viscosity = 8500.0 * temp_factor * time_factor * hum_factor
            flow_res = (viscosity / 8500.0) * (1.0 + 0.45 * needle_wear)

            base_p = 210.0 * flow_res
            pressure = round(base_p + random.gauss(0, 0.8), 2)

            # Quality Check
            if is_machine_14 and random.random() < 0.15:
                measured_mass = round(12.50 - random.uniform(0.6, 1.2), 3)
                defect = 1
                disposition = "REJECT"
                recent_events.append(f"{m_id}: Minor underfill detected ({measured_mass} mg)")
            elif is_machine_38 and random.random() < 0.12:
                measured_mass = round(12.50 + random.uniform(0.5, 1.0), 3)
                defect = 2
                disposition = "REJECT"
                recent_events.append(f"{m_id}: Minor overflow detected ({measured_mass} mg)")
            else:
                measured_mass = round(12.50 + random.gauss(0, 0.05), 3)
                defect = 0
                disposition = "AUTO_PASS"

        fillet_h = round(125.0 + (measured_mass - 12.50) * 12.0 + random.gauss(0, 0.8), 1) if measured_mass > 0 else 0.0
        fillet_w = round(340.0 + (measured_mass - 12.50) * 25.0 + random.gauss(0, 1.5), 1) if measured_mass > 0 else 0.0

        telemetry_rows.append((
            now_iso, m_id, state["batch"], shot_num, round(pot_life, 2),
            preheat, ambient_temp, ambient_hum, pressure, needle_wear, cycle_time
        ))

    # Insert telemetry
    cursor.executemany("""
    INSERT INTO telemetry_logs (
        timestamp, machine_id, batch_no, shot_number, pot_life_min,
        preheat_temp_c, cleanroom_temp_c, cleanroom_humidity_pct,
        pneumatic_pressure_kpa, needle_wear_index, cycle_time_sec
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, telemetry_rows)

    # Get the inserted log_ids
    first_log_id = cursor.lastrowid - len(telemetry_rows) + 1
    for i in range(len(telemetry_rows)):
        log_id = first_log_id + i
        t_row = telemetry_rows[i]
        m_idx = i + 1
        is_m27 = (m_idx == 27)
        if is_m27:
            inspection_rows.append((log_id, 0.0, 0.0, 0.0, 1, "MAINTENANCE_HOLD"))
        elif m_idx == 14 and random.random() < 0.15:
            inspection_rows.append((log_id, 11.75, 115.0, 310.0, 1, "REJECT"))
        elif m_idx == 38 and random.random() < 0.12:
            inspection_rows.append((log_id, 13.25, 138.0, 365.0, 2, "REJECT"))
        else:
            inspection_rows.append((log_id, 12.50 + random.gauss(0, 0.04), 125.0, 340.0, 0, "AUTO_PASS"))

    cursor.executemany("""
    INSERT INTO quality_inspections (
        log_id, measured_mass_mg, fillet_height_um, fillet_width_um, defect_code, disposition
    ) VALUES (?, ?, ?, ?, ?, ?);
    """, inspection_rows)

    conn.commit()

    # Query total records
    cursor.execute("SELECT COUNT(*) FROM telemetry_logs;")
    total_logs = cursor.fetchone()[0]

    # Write cache for 0ms frontend status latency
    cache_data = {
        "status": "ONLINE",
        "database": "belton_scada.db",
        "total_records": total_logs,
        "last_sync_iso": now_iso,
        "last_sync_timestamp": int(now.timestamp() * 1000),
        "sync_interval_seconds": 30,
        "active_machines": 47,
        "warning_machines": 2, # #14, #38
        "broken_machines": 1,  # #27
        "cleanroom_ambient": {
            "temperature_c": ambient_temp,
            "humidity_pct": ambient_hum
        },
        "recent_alerts": recent_events[:3] if recent_events else ["All 49 operational cells running within nominal Cpk limits."]
    }

    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, indent=2)

    print(f"[{now_iso}] Committed 50 live records -> belton_scada.db | Total Logs: {total_logs}")

    if close_after:
        conn.close()

    return total_logs

def run_daemon():
    print(f"[*] Starting Belton Live SCADA Streamer Daemon (Interval: 30s)...")
    print(f"[*] Target DB: {DB_PATH}")
    print(f"[*] Live State Cache: {CACHE_PATH}")
    conn = get_db_connection()

    try:
        while True:
            t0 = time.time()
            stream_tick(conn)
            elapsed = time.time() - t0
            sleep_time = max(1.0, 30.0 - elapsed)
            time.sleep(sleep_time)
    except KeyboardInterrupt:
        print("\n[*] Live streamer stopped by user.")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--tick":
        stream_tick()
    else:
        run_daemon()

