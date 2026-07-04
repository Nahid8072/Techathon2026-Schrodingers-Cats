import os
import discord
from discord.ext import commands, tasks
from dotenv import load_dotenv
from datetime import datetime

from device_simulator import (
    start_simulation,
    get_all_devices,
    get_room_devices,
    get_total_usage,
    get_active_alerts,
)

load_dotenv()

TOKEN = os.getenv("DISCORD_BOT_TOKEN")
CHANNEL_ID = int(os.getenv("DISCORD_CHANNEL_ID"))

intents = discord.Intents.default()
intents.message_content = True  # !command পড়ার জন্য এটা লাগবেই

bot = commands.Bot(command_prefix="!", intents=intents)

# Alert duplicate-avoid করার জন্য — একই alert বারবার পাঠাবে না
_sent_alerts = set()


def _room_summary_text(room_name, devices):
    """Devices dict থেকে human-readable line বানায়। e.g. '2 fans ON, 3 lights ON'"""
    fans_on = sum(1 for d in devices.values() if d["type"] == "fan" and d["status"])
    lights_on = sum(1 for d in devices.values() if d["type"] == "light" and d["status"])

    if fans_on == 0 and lights_on == 0:
        return f"{room_name}: all off."
    return f"{room_name}: {fans_on} fan{'s' if fans_on != 1 else ''} ON, {lights_on} light{'s' if lights_on != 1 else ''} ON."


@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user}")
    start_simulation()
    if not alert_checker.is_running():
        alert_checker.start()


@bot.command(name="status")
async def status(ctx):
    all_devices = get_all_devices()

    rooms = {}
    for device in all_devices.values():
        rooms.setdefault(device["room"], {})[device["name"]] = device

    lines = [_room_summary_text(room, devices) for room, devices in rooms.items()]
    await ctx.send(" ".join(lines))


@bot.command(name="room")
async def room(ctx, *, room_name: str = None):
    if not room_name:
        await ctx.send("দয়া করে room name দিন, যেমন: `!room work1` বা `!room drawing`")
        return

    # user শুধু "work1" লিখলেও যেন "Work Room 1" match করে
    name_map = {
        "drawing": "Drawing Room",
        "work1": "Work Room 1",
        "work2": "Work Room 2",
    }
    resolved_name = name_map.get(room_name.lower().strip(), room_name)

    devices = get_room_devices(resolved_name)

    if not devices:
        await ctx.send(f"'{room_name}' নামে কোনো room পাওয়া যায়নি। Options: drawing, work1, work2")
        return

    details = "\n".join(
        f"- {d['name']}: {'ON' if d['status'] else 'OFF'} ({d['power_w']}W)"
        for d in devices.values()
    )
    await ctx.send(f"**{resolved_name}**\n{details}")


@bot.command(name="usage")
async def usage(ctx):
    total_watt, on_count = get_total_usage()
    # সহজ estimate: এখনকার draw rate যদি সারাদিন (office hours ৮ ঘণ্টা) স্থির থাকে
    estimated_kwh = round((total_watt * 8) / 1000, 2)

    await ctx.send(
        f"⚡ Total power right now: **{total_watt}W** ({on_count} devices ON)\n"
        f"📊 Today's estimated usage: **{estimated_kwh} kWh**"
    )


@tasks.loop(seconds=30)
async def alert_checker():
    """প্রতি ৩০ সেকেন্ডে alert check করে, নতুন alert হলে channel-এ পাঠায়।"""
    alerts = get_active_alerts()
    channel = bot.get_channel(CHANNEL_ID)

    if channel is None:
        return

    for alert in alerts:
        if alert not in _sent_alerts:
            await channel.send(f"🚨 {alert}")
            _sent_alerts.add(alert)


bot.run(TOKEN)