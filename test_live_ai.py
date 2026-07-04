import time
import random
from ai import analyze_room

print("🔥 Smart Office AI Simulation Started...\n")

while True:

    # 🎯 Fake sensor + device data generator
    data = {
        "room": "Work Room 1",
        "light1": random.choice([True, False]),
        "light2": random.choice([True, False]),
        "light3": random.choice([True, False]),
        "fan1": random.choice([True, False]),
        "fan2": random.choice([True, False]),
        "temperature": round(random.uniform(20, 35), 2),
        "humidity": round(random.uniform(30, 80), 2),
        "gas": random.randint(200, 900),
        "motion": random.choice([True, False])
    }

    print("\n📡 SENSOR DATA:")
    print(data)

    # 🧠 Send to Gemini AI
    result = analyze_room(data)

    print("\n🤖 AI REPORT:\n")
    print(result)
    print("\n" + "="*60)

    time.sleep(3)