import discord
import threading
from discord.ext import commands

try:
    from api import main as api_module
    API_AVAILABLE = True
except ImportError:
    API_AVAILABLE = False
    print("⚠️ Flask non disponible. Panel désactivé.")

class Panel(commands.Cog):
    def __init__(self, bot_instance: commands.Bot):
        self.bot = bot_instance
        self.api_started = False
    
    @commands.Cog.listener()
    async def on_ready(self):
        if not self.api_started and API_AVAILABLE:
            try:
                api_module.start_api_thread(self.bot, port=3001)
                print("🌐 Panel API démarrée sur http://localhost:3001")
                print("📊 Accédez au panel: http://localhost:3001")
                self.api_started = True
            except Exception as e:
                print(f"⚠️ Erreur Panel API: {e}")

async def setup(bot: commands.Bot):
    await bot.add_cog(Panel(bot))