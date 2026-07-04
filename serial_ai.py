import serial
import json
from ai import analyze_room

PORT = "COM3"
BAUD = 115200

REQUIRED_KEYS = ["room", "light1", "light2", "light3", "fan1", "fan2",
                  "temperature", "humidity", "gas", "motion"]

ser = serial.Serial(PORT, BAUD, timeout=1)

print("Listening ESP32 data...\n")

while True:
    try:
        line = ser.readline().decode().strip()

        if not line:
            continue

        if line.startswith("{") and line.endswith("}"):

            data = json.loads(line)

            # Safety check — সব key আছে কিনা
            missing = [k for k in REQUIRED_KEYS if k not in data]
            if missing:
                print(f"⚠️ Skipping incomplete JSON, missing: {missing}")
                continue

            print("\n📡 RAW DATA:", data)

            result = analyze_room(data)

            print("\n🤖 AI REPORT:\n")
            print(result)
            print("\n" + "="*50)

    except Exception as e:
        print("Error:", e)