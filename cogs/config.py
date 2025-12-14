import discord
import os
import json
from discord.ext import commands

bot = None

class Config(commands.Cog):
    def __init__(self, bot_instance: commands.Bot):
        global bot
        bot = bot_instance
        self.bot = bot_instance
        self.config_path = os.path.join(os.path.dirname(__file__), '..', 'config.json')

    def _ensure_file(self):
        if not os.path.exists(self.config_path):
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump({}, f, ensure_ascii=False, indent=2)

    def _load_config(self):
        self._ensure_file()
        with open(self.config_path, 'r', encoding='utf-8') as f:
            try:
                return json.load(f) or {}
            except json.JSONDecodeError:
                return {}

    def _save_config(self, config):
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)


async def setup(bot_instance: commands.Bot):
    await bot_instance.add_cog(Config(bot_instance))
