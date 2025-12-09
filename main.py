import discord
import os
from discord.ext import commands

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

#Événement lorsque le bot est prêt
@bot.event
async def on_ready():
    print(f'Votre bot {bot.user} est ONLINE.')
    await bot.change_presence(
        status=discord.Status.dnd,
        activity=discord.Game("VirtuBot")
    )
    try:
        synced = await bot.tree.sync()
        print(f"{len(synced)} Commandes ont été chargées.")
    except Exception as e:
        print(e)

#Commandes qui regroupent toutes les commandes
@bot.tree.command(name="help", description="Affiche la liste des commandes disponibles.")
async def help(interaction: discord.Interaction):
    embed = discord.Embed(
        title="VirtuBot",
        description="Liste des commandes VirtuBot.",
        color=discord.Color.green()
    )
    embed.add_field(name="/help", value="Affiche ce message d'aide", inline=True)
    embed.add_field(name="/hello", value="Dis bonjour au bot", inline=True)
    await interaction.response.send_message(embed=embed, ephemeral=True)

#Commande simple pour dire bonjour au bot(avec latence)
@bot.tree.command(name="hello", description="Dis bonjour au bot" )
async def hello(interaction: discord.Interaction):
    latency_ms = round(bot.latency * 1000)
    await interaction.response.send_message(f"Hello 😊 latence: {latency_ms} ms", ephemeral=True)

# Groupe de commandes admin
group = discord.app_commands.Group(name="admin", description="Commandes admin")

@group.command(name="kick", description="Expulse un membre")
async def kick(interaction: discord.Interaction, member: discord.Member):
    if not interaction.user.guild_permissions.kick_members:
        await interaction.response.send_message(
            "❌ Tu n'as pas la permission d'expulser des membres.",
            ephemeral=True
        )
        return

    try:
        await member.kick(reason=f"Expulsé par {interaction.user}")
        await interaction.response.send_message(f"{member.mention} a été expulsé ✅")
        print(f"{member} a été expulsé par {interaction.user}")
    except Exception as e:
        await interaction.response.send_message(f"Erreur lors de l'expulsion: {e}")

@group.command(name="ban", description="Bannit un membre")
async def ban(interaction: discord.Interaction, member: discord.Member):
    if not interaction.user.guild_permissions.ban_members:
        await interaction.response.send_message(
            "❌ Tu n'as pas la permission de bannir des membres.",
            ephemeral=True
        )
        return

    try:
        await member.ban(reason=f"Banni par {interaction.user}")
        await interaction.response.send_message(f"{member.mention} a été banni ✅")
        print(f"{member} a été banni par {interaction.user}")
    except Exception as e:
        await interaction.response.send_message(f"Erreur lors du bannissement: {e}")

bot.tree.add_command(group)




BOT = os.getenv("DISCORD_TOKEN")
bot.run(BOT)


