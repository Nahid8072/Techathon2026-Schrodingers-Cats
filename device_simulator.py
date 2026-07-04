import random
import threading
import time
from datetime import datetime

ROOMS = ["Drawing Room", "Work Room 1", "Work Room 2"]

DEVICE_TEMPLATE = {
    "light": {"count": 3, "watt": 15},
    "fan": {"count": 2, "watt": 60},
}

OFFICE_START_HOUR = 9
OFFICE_END_HOUR = 17

_lock = threading.Lock()
_devices = {}


def _init_devices():
    """Build initial state for all 18 devices."""
    now = datetime.now()
    for room in ROOMS:
        for device_type, info in DEVICE_TEMPLATE.items():
            for i in range(1, info["count"] + 1):
                device_id = f"{device_type}{i}_{room.replace(' ', '')}"
                _devices[device_id] = {
                    "name": f"{device_type.capitalize()} {i}",
                    "room": room,
                    "type": device_type,
                    "status": random.choice([True, False]),
                    "power_w": info["watt"],
                    "last_changed": now,
                }


def _simulate_loop(interval_seconds=10):
    """Randomly toggle one device periodically to keep data dynamic."""
    while True:
        time.sleep(interval_seconds)
        with _lock:
            device_id = random.choice(list(_devices.keys()))
            _devices[device_id]["status"] = not _devices[device_id]["status"]
            _devices[device_id]["last_changed"] = datetime.now()


def start_simulation():
    """Call once at bot startup."""
    _init_devices()
    thread = threading.Thread(target=_simulate_loop, daemon=True)
    thread.start()


def get_all_devices():
    with _lock:
        return {k: v.copy() for k, v in _devices.items()}


def get_room_devices(room_name):
    with _lock:
        return {k: v.copy() for k, v in _devices.items() if v["room"].lower() == room_name.lower()}


def get_total_usage():
    """Returns (current_watts, devices_on_count)."""
    with _lock:
        total_watt = sum(d["power_w"] for d in _devices.values() if d["status"])
        on_count = sum(1 for d in _devices.values() if d["status"])
    return total_watt, on_count


def get_active_alerts():
    """Check for: (1) device ON outside office hours, (2) room fully ON 2+ hrs."""
    alerts = []
    now = datetime.now()
    with _lock:
        # Rule 1: outside office hours
        if now.hour < OFFICE_START_HOUR or now.hour >= OFFICE_END_HOUR:
            for d in _devices.values():
                if d["status"]:
                    alerts.append(
                        f"⚠️ {d['name']} ({d['room']}) is ON outside office hours "
                        f"(since {d['last_changed'].strftime('%I:%M %p')})"
                    )

        # Rule 2: entire room ON for 2+ hours continuously
        for room in ROOMS:
            room_devices = [d for d in _devices.values() if d["room"] == room]
            if all(d["status"] for d in room_devices):
                oldest_change = min(d["last_changed"] for d in room_devices)
                hours_on = (now - oldest_change).total_seconds() / 3600
                if hours_on >= 2:
                    alerts.append(
                        f"⚠️ {room}: all devices ON for {hours_on:.1f}+ hours continuously"
                    )
    return alerts