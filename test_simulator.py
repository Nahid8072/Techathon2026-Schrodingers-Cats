import time
from device_simulator import (
    start_simulation,
    get_all_devices,
    get_room_devices,
    get_total_usage,
    get_active_alerts,
)

start_simulation()

print("=== ALL DEVICES ===")
for device_id, info in get_all_devices().items():
    print(f"{device_id}: {info['status']} | {info['power_w']}W | {info['room']}")

print("\n=== WORK ROOM 1 ONLY ===")
for device_id, info in get_room_devices("Work Room 1").items():
    print(f"{device_id}: {info['status']}")

watt, count = get_total_usage()
print(f"\n=== USAGE ===\nTotal: {watt}W | Devices ON: {count}")

print("\n=== ALERTS ===")
alerts = get_active_alerts()
print(alerts if alerts else "No active alerts")

print("\n--- Waiting 12 seconds to see a device toggle... ---")
time.sleep(12)

print("\n=== ALL DEVICES (after toggle) ===")
for device_id, info in get_all_devices().items():
    print(f"{device_id}: {info['status']} | last_changed: {info['last_changed']}")