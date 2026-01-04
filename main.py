import discord
import os
import time
import asyncio
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix="!", intents=intents)

print("📁 Démarrage du bot...")

async def load_extensions():
    for extension in os.listdir('./cogs'):
        if extension.endswith('.py'):
            await bot.load_extension(f'cogs.{extension[:-3]}')
            print(f'Le module cogs.{extension[:-3]} a été chargé.')

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
    
    try:
        synced = await bot.tree.sync()
        print(f"{len(synced)} Commandes ont été chargées.")
    except Exception as e:
        print(e)
    
    # Démarrer l'API après que le bot soit prêt
    try:
        from api.main import start_api_thread
        port = int(os.getenv('API_PORT', '3001'))
        start_api_thread(bot, port)
        print(f"✅ API démarrée sur http://localhost:{port}")
    except Exception as e:
        print(f"⚠️ Impossible de démarrer l'API: {e}")

async def main():
    async with bot:
        await load_extensions()
        
        BOT = os.getenv("DISCORD_TOKEN")
        if not BOT:
            print("❌ ERREUR: Variable DISCORD_TOKEN non définie!")
            print("Créez un fichier .env avec: DISCORD_TOKEN=votre_token")
            exit(1)
        await bot.start(BOT)

asyncio.run(main())

