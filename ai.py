import os
from dotenv import load_dotenv
from google import genai
from prompt import SYSTEM_PROMPT

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def analyze_room(sensor_data):

    # Devices ON list বানানো (readable format)
    devices_status = {
        "Light 1": sensor_data["light1"],
        "Light 2": sensor_data["light2"],
        "Light 3": sensor_data["light3"],
        "Fan 1": sensor_data["fan1"],
        "Fan 2": sensor_data["fan2"],
    }

    devices_summary = ", ".join(
        [f"{name}: {'ON' if state else 'OFF'}" for name, state in devices_status.items()]
    )

    prompt = f"""
{SYSTEM_PROMPT}

Analyze this room:

Room Name: {sensor_data["room"]}
Devices: {devices_summary}
Temperature: {sensor_data["temperature"]} °C
Humidity: {sensor_data["humidity"]} %
Gas Level: {sensor_data["gas"]}
Motion Detected: {sensor_data["motion"]}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text