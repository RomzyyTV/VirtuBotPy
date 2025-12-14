import discord
import os
import time
import json
import flask
from discord.ext import commands

bot = None

class Panel(commands.Cog):
    def __init__(self, bot_instance: commands.Bot):
        global bot
        bot = bot_instance
        self.bot = bot_instance
        
        #Panel en cours de développement.
        #soon...


async def setup(bot: commands.Bot):
    await bot.add_cog(Panel(bot))