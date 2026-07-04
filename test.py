from ai import analyze_room

room = {
    "room": "Work Room 1",
    "light1": True,
    "light2": False,
    "light3": True,
    "fan1": True,
    "fan2": False,
    "temperature": 29,
    "humidity": 63,
    "gas": 350,
    "motion": False
}

print(analyze_room(room))