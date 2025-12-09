import discord
import os
from discord.ext import commands

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f'Votre bot {bot.user} est ONLINE.')
    await bot.change_presence(
        status=discord.Status.dnd,
        activity=discord.Game("VirtuBot")
    )
    try:
        synced = await bot.tree.sync()
        print(f"{len(synced)} Commandes on était charger.")
    except Exception as e:
        print(e)

@bot.tree.command(name="help", description="Listes des commandes disponible.")
async def help(interaction: discord.Interaction):
    embed = discord.Embed(
        title="VirtuBot",
        description="Liste des commandes VirtuBot.",
        color=discord.Color.green()
    )
    embed.add_field(name="/help", value="Affiche ce message d'aide", inline=True)
    embed.add_field(name="/hello", value="Dis bonjour au bot", inline=True)
    await interaction.response.send_message(embed=embed, ephemeral=True)

@bot.tree.command(name="hello", description="Dis bonjour au bot" )
async def hello(interaction: discord.Interaction):
    latency_ms = round(bot.latency * 1000)
    await interaction.response.send_message(f"Hello 😊 latence: {latency_ms} ms", ephemeral=True)


BOT = os.getenv("DISCORD_TOKEN")
bot.run(BOT)


