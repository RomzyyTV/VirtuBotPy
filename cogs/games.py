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

        @bot.tree.command(name="jeux-roulette-russe", description="Jeu de roulette russe avec 6 chambres")
        async def roulette_russe(interaction: discord.Interaction):
            chambre = random.randint(1, 6)
            if chambre == 1:
                await interaction.response.send_message(f"💥 Bang! {interaction.user.mention}, vous avez perdu la roulette russe!")
            else:
                await interaction.response.send_message(f"😅 Click! {interaction.user.mention}, vous êtes sauf cette fois-ci!")
            print(f"{interaction.user} a joué à la roulette russe et le résultat de la chambre est {chambre}")
        
        @bot.tree.command(name="jeux-de-culture", description="Question de culture générale")
        async def jeux_de_culture(interaction: discord.Interaction):
            questions = {
                "Quelle est la capitale de la France?": "Paris",
                "Combien de continents y a-t-il sur Terre?": "7",
                "Qui a écrit 'Roméo et Juliette'?": "Shakespeare",
                "Quelle est la planète la plus proche du Soleil?": "Mercure",
                "En quelle année l'homme a-t-il marché sur la Lune pour la première fois?": "1969"
            }
            question, reponse = random.choice(list(questions.items()))
            await interaction.response.send_message(f"❓ {interaction.user.mention}, voici votre question de culture générale:\n**{question}**\nRépondez dans le salon.", ephemeral=True)
            
            def check(m):
                return m.author == interaction.user and m.channel == interaction.channel
            
            try:
                msg = await self.bot.wait_for('message', check=check, timeout=30.0)
                if msg.content.strip().lower() == reponse.lower():
                    await interaction.channel.send(f"🎉 Correct! Bien joué {interaction.user.mention}!")
                else:
                    await interaction.channel.send(f"❌ Incorrect! La bonne réponse était **{reponse}**.")
                print(f"{interaction.user} a répondu à la question '{question}' avec '{msg.content.strip()}' (réponse correcte: '{reponse}')")
            except asyncio.TimeoutError:
                await interaction.channel.send(f"⏰ Temps écoulé! La bonne réponse était **{reponse}**.")
                print(f"{interaction.user} n'a pas répondu à temps à la question '{question}'")



async def setup(bot: commands.Bot):
    await bot.add_cog(Games(bot))
