import discord
import os
import time
import json
from discord.ext import commands

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix="!", intents=intents)

print("📁 Démarrage du bot...")

#Événement lorsque le bot est prêt.
@bot.event
async def on_ready():
    print(f'🤖 Votre bot {bot.user} est ONLINE.')
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║                                                                ║
    ║   ██╗   ██╗██╗██████╗ ████████╗██╗   ██╗██████╗  ██████╗ ████  ║
    ║   ██║   ██║██║██╔══██╗╚══██╔══╝██║   ██║██╔══██╗██╔═══██╗╚██║  ║ 
    ║   ██║   ██║██║██████╔╝   ██║   ██║   ██║██████╔╝██║   ██║ ██║  ║
    ║   ╚██╗ ██╔╝██║██╔══██╗   ██║   ██║   ██║██╔══██╗██║   ██║ ██║  ║
    ║    ╚████╔╝ ██║██║  ██║   ██║   ╚██████╔╝██████╔╝╚██████╔╝ ██║  ║
    ║     ╚═══╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═════╝  ╚═════╝  ╚═╝  ║
    ║                                                                ║
    ║                       - Python -                               ║
    ║                   Open Source Discord Bot                      ║
    ║                                                                ║
    ╚════════════════════════════════════════════════════════════════╝
    """)
    time.sleep(5)
    print(f"{bot.user} est dans {len(bot.guilds)} serveurs.")
    await bot.change_presence(
        status=discord.Status.dnd,
        activity=discord.Game("VirtuBot | Open Source Bot")
    )
    for extension in os.listdir('./cogs'):
        if extension.endswith('.py'):
            await bot.load_extension(f'cogs.{extension[:-3]}')
            print(f'Le module cogs.{extension[:-3]} a été chargé.')
    try:
        synced = await bot.tree.sync()
        print(f"{len(synced)} Commandes ont été chargées.")
    except Exception as e:
        print(e)

BOT = os.getenv("DISCORD_TOKEN")
bot.run(BOT)

