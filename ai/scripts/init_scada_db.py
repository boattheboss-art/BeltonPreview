"""
Belton Technology Group - ACA Line SCADA Database Initializer
Creates SQLite database: ai/data/belton_scada.db
Generates 50,000 historical cleanroom production records across 50 dispensing machines.
"""

import os
import sqlite3
import random
import math
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "belton_scada.db")

def init_database():
    print(f"[*] Initializing Belton SCADA Database at: {DB_PATH}")
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("    - Removed existing database for clean setup.")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Enable WAL mode for high concurrency
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA synchronous = NORMAL;")

    # Table 1: machines (Master registry)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS machines (
        machine_id TEXT PRIMARY KEY,
        machine_num INTEGER NOT NULL,
        line_name TEXT NOT NULL,
        model_type TEXT NOT NULL,
        micro_nozzle_gauge TEXT NOT NULL,
        installed_date TEXT NOT NULL,
        status TEXT NOT NULL
    );
    """)

    # Table 2: material_batches (Epoxy lot tracking)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS material_batches (
        batch_no TEXT PRIMARY KEY,
        epoxy_formula TEXT NOT NULL,
        mixed_at TEXT NOT NULL,
        initial_viscosity_mpas REAL NOT NULL,
        max_pot_life_min INTEGER NOT NULL,
        status TEXT NOT NULL
    );
    """)

    # Table 3: telemetry_logs (Time-series production sensor data)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        machine_id TEXT NOT NULL,
        batch_no TEXT NOT NULL,
        shot_number INTEGER NOT NULL,
        pot_life_min REAL NOT NULL,
        preheat_temp_c REAL NOT NULL,
        cleanroom_temp_c REAL NOT NULL,
        cleanroom_humidity_pct REAL NOT NULL,
        pneumatic_pressure_kpa REAL NOT NULL,
        needle_wear_index REAL NOT NULL,
        cycle_time_sec REAL NOT NULL,
        FOREIGN KEY (machine_id) REFERENCES machines(machine_id),
        FOREIGN KEY (batch_no) REFERENCES material_batches(batch_no)
    );
    """)

    # Table 4: quality_inspections (3D AOI & Mass Loadcell measurement)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quality_inspections (
        inspection_id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        measured_mass_mg REAL NOT NULL,
        fillet_height_um REAL NOT NULL,
        fillet_width_um REAL NOT NULL,
        defect_code INTEGER NOT NULL, -- 0: PASS, 1: UNDERFILL/CLOG, 2: OVERFLOW
        disposition TEXT NOT NULL,
        FOREIGN KEY (log_id) REFERENCES telemetry_logs(log_id)
    );
    """)

    # Fast Query Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_machine ON telemetry_logs(machine_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry_logs(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_inspections_log ON quality_inspections(log_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_inspections_defect ON quality_inspections(defect_code);")

    conn.commit()
    print("[OK] All 4 relational tables and indexes created successfully.")
    return conn

def seed_master_data(conn):
    cursor = conn.cursor()
    print("[*] Seeding 50 ACA dispensing machines and material batches...")

    # Seed 50 Machines
    machine_rows = []
    for i in range(1, 51):
        m_id = f"ACA-DISP-{i:02d}"
        line = "ACA-LINE-EAST" if i <= 25 else "ACA-LINE-WEST"
        m_status = "MAINTENANCE_HOLD" if i == 27 else "ACTIVE"
        nozzle = "32G Ultra-Micro Nozzle"
        inst_date = "2024-03-15"
        machine_rows.append((m_id, i, line, "Asymtek Dynamic Dispenser", nozzle, inst_date, m_status))

    cursor.executemany("""
    INSERT INTO machines (machine_id, machine_num, line_name, model_type, micro_nozzle_gauge, installed_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, machine_rows)

    # Seed Batches
    batch_rows = [
        ("LOT-EPX-2026-08A", "Nagase ChemteX Low-Outgas Epoxy", "2026-08-10 07:00:00", 8500.0, 240, "EXPIRED"),
        ("LOT-EPX-2026-08B", "Nagase ChemteX Low-Outgas Epoxy", "2026-08-20 07:00:00", 8450.0, 240, "EXPIRED"),
        ("LOT-EPX-2026-09A", "Nagase ChemteX Low-Outgas Epoxy", "2026-09-01 07:00:00", 8520.0, 240, "EXPIRED"),
        ("LOT-EPX-2026-09B", "Nagase ChemteX Low-Outgas Epoxy", "2026-09-10 06:30:00", 8500.0, 240, "ACTIVE")
    ]
    cursor.executemany("""
    INSERT INTO material_batches (batch_no, epoxy_formula, mixed_at, initial_viscosity_mpas, max_pot_life_min, status)
    VALUES (?, ?, ?, ?, ?, ?);
    """, batch_rows)

    conn.commit()
    print(f"    - Seeded {len(machine_rows)} machines and {len(batch_rows)} material lots.")

def seed_historical_telemetry(conn, total_records=50000):
    cursor = conn.cursor()
    print(f"[*] Generating {total_records} physics-grounded historical records across the past 30 days...")

    start_time = datetime.now() - timedelta(days=30)
    records_per_machine = total_records // 50

    telemetry_batch = []
    inspection_batch = []
    current_log_id = 1

    # Base physics constants
    T_ref = 60.0 # Nominal substrate preheat temp (°C)

    for m_idx in range(1, 51):
        m_id = f"ACA-DISP-{m_idx:02d}"
        is_machine_27 = (m_idx == 27)
        is_machine_14 = (m_idx == 14)
        is_machine_38 = (m_idx == 38)

        # Baseline per-machine wear
        needle_wear_base = 0.72 if is_machine_27 else (0.45 if (is_machine_14 or is_machine_38) else 0.12)
        batch_no = "LOT-EPX-2026-09B"

        cur_time = start_time + timedelta(minutes=random.randint(0, 120))

        for shot in range(1, records_per_machine + 1):
            cur_time += timedelta(seconds=random.uniform(3.5, 4.8))
            pot_life = (shot * 0.12) % 235.0 # Cycles every 4 hours

            # Environmental conditions
            hour = cur_time.hour
            ambient_temp = 21.5 + 0.8 * math.sin((hour - 8) / 24.0 * 2 * math.pi) + random.gauss(0, 0.15)
            humidity = 46.0 + 3.0 * math.sin((hour - 12) / 24.0 * 2 * math.pi) + random.gauss(0, 0.4)
            preheat_temp = 60.0 + random.gauss(0, 1.2)

            # Wear accumulation
            needle_wear = min(0.98, needle_wear_base + (shot / records_per_machine) * (0.24 if is_machine_27 else 0.08))

            # Rheology & Poiseuille Flow
            temp_factor = math.exp(-0.035 * (preheat_temp - T_ref))
            time_factor = math.exp(0.0055 * pot_life)
            hum_factor = 1.0 + 0.002 * (humidity - 45.0)
            viscosity = 8500.0 * temp_factor * time_factor * hum_factor
            flow_resistance = (viscosity / 8500.0) * (1.0 + 0.45 * needle_wear)

            # Target mass is 12.50 mg
            base_pressure = 210.0 * flow_resistance
            pressure = base_pressure + random.gauss(0, 1.2)

            # If machine 27 late in the run: under-dispenses
            if is_machine_27 and shot > records_per_machine * 0.7:
                measured_mass = 12.50 - random.uniform(1.2, 3.8) # Underfill!
                defect = 1 # Underfill
                disposition = "REJECT"
            elif preheat_temp > 68.0 and pot_life < 20.0 and random.random() < 0.08:
                measured_mass = 12.50 + random.uniform(0.8, 2.0) # Overflow!
                defect = 2 # Overflow
                disposition = "REJECT"
            else:
                measured_mass = 12.50 + random.gauss(0, 0.08)
                defect = 0 # Pass
                disposition = "AUTO_PASS"

            fillet_h = 125.0 + (measured_mass - 12.50) * 12.0 + random.gauss(0, 1.5)
            fillet_w = 340.0 + (measured_mass - 12.50) * 25.0 + random.gauss(0, 2.5)
            cycle_time = random.uniform(3.8, 4.4)

            ts_str = cur_time.strftime("%Y-%m-%d %H:%M:%S")

            telemetry_batch.append((
                ts_str, m_id, batch_no, shot, round(pot_life, 2),
                round(preheat_temp, 2), round(ambient_temp, 2), round(humidity, 2),
                round(pressure, 2), round(needle_wear, 4), round(cycle_time, 2)
            ))

            inspection_batch.append((
                current_log_id, round(measured_mass, 3), round(fillet_h, 1),
                round(fillet_w, 1), defect, disposition
            ))

            current_log_id += 1

            # Batch insert every 5,000 rows
            if len(telemetry_batch) >= 5000:
                cursor.executemany("""
                INSERT INTO telemetry_logs (
                    timestamp, machine_id, batch_no, shot_number, pot_life_min,
                    preheat_temp_c, cleanroom_temp_c, cleanroom_humidity_pct,
                    pneumatic_pressure_kpa, needle_wear_index, cycle_time_sec
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, telemetry_batch)

                cursor.executemany("""
                INSERT INTO quality_inspections (
                    log_id, measured_mass_mg, fillet_height_um, fillet_width_um, defect_code, disposition
                ) VALUES (?, ?, ?, ?, ?, ?);
                """, inspection_batch)

                conn.commit()
                print(f"    - Committed {current_log_id - 1} records to database...")
                telemetry_batch.clear()
                inspection_batch.clear()

    # Commit remaining
    if telemetry_batch:
        cursor.executemany("""
        INSERT INTO telemetry_logs (
            timestamp, machine_id, batch_no, shot_number, pot_life_min,
            preheat_temp_c, cleanroom_temp_c, cleanroom_humidity_pct,
            pneumatic_pressure_kpa, needle_wear_index, cycle_time_sec
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, telemetry_batch)

        cursor.executemany("""
        INSERT INTO quality_inspections (
            log_id, measured_mass_mg, fillet_height_um, fillet_width_um, defect_code, disposition
        ) VALUES (?, ?, ?, ?, ?, ?);
        """, inspection_batch)
        conn.commit()

    print(f"[OK] Database seeding complete! Total records: {current_log_id - 1}")

    # Display summary statistics from database
    cursor.execute("SELECT COUNT(*) FROM telemetry_logs;")
    total_logs = cursor.fetchone()[0]
    cursor.execute("SELECT defect_code, COUNT(*) FROM quality_inspections GROUP BY defect_code;")
    defect_stats = cursor.fetchall()
    print("\n--- Belton SCADA Database Summary ---")
    print(f"Database File: {DB_PATH} ({round(os.path.getsize(DB_PATH) / (1024*1024), 2)} MB)")
    print(f"Total Telemetry Logs: {total_logs}")
    for code, cnt in defect_stats:
        label = "PASS (0)" if code == 0 else ("UNDERFILL (1)" if code == 1 else "OVERFLOW (2)")
        pct = (cnt / total_logs) * 100.0
        print(f"  - {label}: {cnt} ({pct:.2f}%)")

if __name__ == "__main__":
    conn = init_database()
    seed_master_data(conn)
    seed_historical_telemetry(conn, total_records=50000)
    conn.close()

