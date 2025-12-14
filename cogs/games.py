import discord
import os
import json
import random
from discord.ext import commands

bot = None

class Games(commands.Cog):
    def __init__(self, bot_instance: commands.Bot):
        global bot
        bot = bot_instance
        self.bot = bot_instance

        #Commandes de jeux.
        @bot.tree.command(name="jeux-pieces", description="Fait lancer une pièce de monnaie (Pile ou Face)")
        async def jeux_pieces(interaction: discord.Interaction):
            resultat = random.choice(["Pile", "Face"])
            await interaction.response.send_message(f"🪙 Le résultat est : **{resultat}**")
            print(f"{interaction.user} a lancé une pièce et le résultat est {resultat}")

        @bot.tree.command(name="jeux-de", description="Fait lancer un dé à 6 faces")
        async def jeux_de(interaction: discord.Interaction):
            resultat = random.randint(1, 6)
            await interaction.response.send_message(f"🎲 Le résultat est : **{resultat}**")
            print(f"{interaction.user} a lancé un dé et le résultat est {resultat}")

        @bot.tree.command(name="jeux-trouve-nombre", description="Jeu pour deviner un nombre entre 1 et 100")
        async def trouve_nombre(interaction: discord.Interaction, nombre: int):
            if nombre < 1 or nombre > 100:
                await interaction.response.send_message("❌ Veuillez choisir un nombre entre 1 et 100.", ephemeral=True)
                return

            nombre_secret = random.randint(1, 100)
            if nombre == nombre_secret:
                await interaction.response.send_message(f"🎉 Félicitations {interaction.user.mention}! Vous avez deviné le nombre secret **{nombre_secret}**!")
            else:
                await interaction.response.send_message(f"❌ Désolé {interaction.user.mention}, le nombre secret était **{nombre_secret}**. Essayez encore!")
            print(f"{interaction.user} a essayé de deviner le nombre {nombre} et le nombre secret était {nombre_secret}")




async def setup(bot: commands.Bot):
    await bot.add_cog(Games(bot))
