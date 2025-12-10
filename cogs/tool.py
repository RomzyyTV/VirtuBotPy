import discord
from discord.ext import commands

class Tool(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

        @bot.tree.command(name="say", description="Fait répéter un texte")
        async def say(interaction: discord.Interaction, messages: str):
            if not interaction.user.guild_permissions.manage_messages:
                await interaction.response.send_message("❌ Tu n'as pas la permission d'utiliser cette commande.",ephemeral=True)
            else:
                print(f"{interaction.user} a utilisé la commande /say et a dis : {messages}")
                await interaction.response.send_message(messages)


async def setup(bot: commands.Bot):
    await bot.add_cog(Tool(bot))
