# Smart Office Assistant
# Smart Office Monitoring System — Lights, Fans & Discord Bot

A system to monitor office lights/fans (on/off + power draw) through a web dashboard and a Discord bot, backed by a single shared data source. Built for [Hackathon Name] — Techathon Nationals & Rover Summit.

> **Scope note:** This repository covers **Part 2 (Hardware/Electrical Schematic)** and **Part 5 (Discord Bot)** of the overall project. Dashboard and backend API integration are owned by other team members; this repo currently runs the Discord bot against a **local device simulator** as a stand-in for the shared backend.

---

## Architecture

```
[ESP32 + Sensors/Relays]  (Wokwi simulation — concept only)
          |
          | (would POST JSON over WiFi in a real deployment)
          v
[Backend API]  <-- not yet built by backend team; this repo uses
          |         device_simulator.py as a temporary stand-in
          v
   +------+-------+
   |              |
[Web Dashboard]  [Discord Bot]   <-- this repo
```

- **Single source of truth:** both the dashboard and the bot are meant to read from one backend. Until that backend exists, `device_simulator.py` plays that role locally, with the same data shape the real API is expected to return — so swapping it out later should only mean changing how data is *fetched*, not how it's *used*.
- **Hardware (Wokwi):** a representative one-room circuit (ESP32 + 3 lights + 2 fans + DHT22 + MQ-2 gas sensor + PIR) demonstrating how device state would be sensed/controlled in real life. See [Hardware section](#hardware--wokwi-simulation) below.

---

## What's simulated vs. real

| Component | Status |
|---|---|
| Office device data (18 devices: 3 rooms × 3 lights + 2 fans) | **Simulated** (`device_simulator.py`), changes dynamically over time |
| Power draw per device | Fixed realistic constants (light = 15W, fan = 60W) |
| ESP32 hardware | **Simulated in Wokwi** — no physical hardware used or required |
| Environment sensors (temp/humidity/gas/motion) | Simulated, feeds an optional Gemini AI report (bonus feature, not required by spec) |
| Discord bot | **Fully functional**, reads from the local simulator |
| Backend API / Database | Not yet built (owned by another team member) |

---

## Repository Structure

```
Hackathon/
├── discord_bot.py        # Main bot: !status, !room, !usage + alert task
├── device_simulator.py   # In-memory simulated state for all 18 devices
├── ai.py                 # Gemini-based analysis of environment/device data (bonus)
├── prompt.py             # System prompt used by ai.py
├── serial_ai.py          # Reads real ESP32 serial JSON -> ai.py (for future real hardware)
├── test.py                # Static sample test for ai.py
├── test_live_ai.py        # Random data generator test for ai.py
├── test_simulator.py      # Verifies device_simulator.py behaves correctly
├── requirements.txt
├── .env.example            # Copy to .env and fill in real values
├── .gitignore
└── hardware/
    └── sketch.ino          # Wokwi ESP32 sketch (see Hardware section)
```

---

## Setup

### 1. Clone and create a virtual environment

```bash
git clone <this-repo-url>
cd Hackathon
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your own values:

```env
GEMINI_API_KEY=your_gemini_api_key_here
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_discord_channel_id_here
```

- **Gemini API key:** from [Google AI Studio](https://aistudio.google.com/).
- **Discord bot token & channel ID:** create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add a bot, invite it to your server with `bot` scope + `Send Messages`, `Read Message History`, `View Channels` permissions, and enable **Message Content Intent** under Privileged Gateway Intents.

⚠️ Never commit `.env` — it's already listed in `.gitignore`.

### 4. Run the bot

```bash
python discord_bot.py
```

You should see:
```
✅ Logged in as <Your Bot Name>
```

---

## Discord Bot Commands

| Command | Description | Example output |
|---|---|---|
| `!status` | Summary of all 3 rooms | "Drawing Room: 1 fan ON, 2 lights ON. Work Room 1: all off. Work Room 2: 2 fans ON, 3 lights ON." |
| `!room <name>` | Status of one room (`drawing`, `work1`, `work2`) | Per-device breakdown with wattage |
| `!usage` | Current total power draw + estimated daily kWh | "Total power right now: 330W. Today's estimated usage: 2.64 kWh." |

**Bonus:** a background task checks every 30 seconds for two alert conditions and posts to the configured channel:
1. Any device left ON outside office hours (9 AM–5 PM)
2. A room with all devices continuously ON for 2+ hours

---

## Hardware — Wokwi Simulation

- **Live simulation link:** `<paste your Wokwi share link here>`
- **Scope:** one representative room (per spec, wiring all 18 devices is not required)

### Components
- ESP32
- 3× LED (Light 1, 2, 3)
- 2× Servo motor (standing in for Fan 1, Fan 2 — rotates to represent ON/OFF)
- DHT22 (temperature/humidity)
- MQ-2 (gas level)
- PIR (motion detection)

### Pin Mapping

| Component | ESP32 Pin | Notes |
|---|---|---|
| Light 1 (LED) | GPIO 2 | via 220Ω resistor to GND |
| Light 2 (LED) | GPIO 4 | via 220Ω resistor to GND |
| Light 3 (LED) | GPIO 5 | via 220Ω resistor to GND |
| Fan 1 (Servo) | GPIO 16 | signal pin |
| Fan 2 (Servo) | GPIO 17 | signal pin |
| Gas sensor (MQ-2) | GPIO 34 (ADC) | analog input |
| PIR motion | GPIO 18 | digital input |
| DHT22 | GPIO 15 | data pin |

### Design notes
- Power draw (Watts) is **intentionally not calculated on the ESP32** — the sketch only reports device ON/OFF state. Wattage is assigned as a fixed constant per device type (light=15W, fan=60W) on the backend/simulator side, keeping the ESP32 as a pure state reporter and the backend as the single source of truth.
- `last_changed` timestamps are similarly assigned when data is received, not on-device.
- In a real deployment, ESP32 GPIOs would not switch mains-voltage lights/fans directly — a relay module (opto-isolated) would sit between the ESP32 and the AC line, and any real AC wiring should be done by a licensed electrician.

### Sample JSON output (from `sketch.ino`)

```json
{
  "room": "Work Room 1",
  "light1": true,
  "light2": false,
  "light3": true,
  "fan1": true,
  "fan2": false,
  "temperature": 27.5,
  "humidity": 55.2,
  "gas": 340,
  "motion": false
}
```

---

## For the Backend Team

To integrate the shared backend once it's ready:

1. Match the device data shape used in `device_simulator.py`:
   `{device_id, name, room, type, status, power_w, last_changed}`
2. Match the ESP32 JSON shape shown above for any real-hardware ingestion endpoint.
3. In `discord_bot.py`, replace the `device_simulator` function calls (`get_all_devices`, `get_room_devices`, `get_total_usage`, `get_active_alerts`) with equivalent calls to the backend API — command logic itself does not need to change.

---

## Known Limitations

- No physical hardware was built or used — per the problem statement, simulated data is sufficient.
- The Discord bot currently runs against a local, in-process simulator rather than a shared backend, since the backend was not ready during development. Data shown by the bot is not yet guaranteed to match the web dashboard until both are wired to the same backend.
- The Gemini-based environment report (`ai.py`) is a bonus/extension feature beyond the core spec requirements (light/fan on-off + power monitoring).


Discord server link- https://discord.gg/qs4mG6FBB

commands :
!statusসব ৩টা room-এর সংক্ষিপ্ত অবস্থা দেখায় — কয়টা fan/light ON আছে প্রতি room-এ

!room <name>নির্দিষ্ট room-এর প্রতিটা device আলাদাভাবে দেখায় (status + wattage সহ)। <name> হতে পারে drawing, work1, বা work2

!usageএই মুহূর্তে মোট কত Watt draw হচ্ছে + আজকের estimated kWh usage দেখায়