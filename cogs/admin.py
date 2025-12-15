import discord
import os
import json
from datetime import timedelta
from discord.ext import commands

bot = None

class Admin(commands.Cog):
    def __init__(self, bot_instance: commands.Bot):
        global bot
        bot = bot_instance
        self.bot = bot_instance
        
        #Commandes d'administration.
        @bot.tree.command(name="kick", description="Expulse un membre")
        async def kick(interaction: discord.Interaction, membres: discord.Member, raison: str = "Aucune raison fournie"):
            """Expulse un membre du serveur"""
            if not interaction.user.guild_permissions.kick_members:
                await interaction.response.send_message(
                    "❌ Tu n'as pas la permission d'expulser des membres.",
                    ephemeral=True
                )
                return

            try:
                await membres.send(f"❌ Vous avez été expulsé du serveur.\n**Modérateur :** {interaction.user}\n**Raison :** {raison}")
            except:
                pass
            
            try:
                await membres.kick(reason=f"Expulsé par {interaction.user} - Raison: {raison}")
                await interaction.response.send_message(f"{membres.mention} a été expulsé ✅")
                print(f"{membres} a été expulsé par {interaction.user}")
            except Exception as e:
                await interaction.response.send_message(f"Erreur lors de l'expulsion: {e}")

        @bot.tree.command(name="ban", description="Bannit un membre")
        async def ban(interaction: discord.Interaction, membres: discord.Member, raison: str = "Aucune raison fournie"):
            """Bannit un membre du serveur"""
            if not interaction.user.guild_permissions.ban_members:
                await interaction.response.send_message(
                    "❌ Tu n'as pas la permission de bannir des membres.",
                    ephemeral=True
                )
                return

            try:
                await membres.send(f"❌ Vous avez été banni du serveur.\n**Modérateur :** {interaction.user}\n**Raison :** {raison}")
            except:
                pass
            
            try:
                await membres.ban(reason=f"Banni par {interaction.user} - Raison: {raison}")
                await interaction.response.send_message(f"{membres.mention} a été banni ✅")
                print(f"{membres} a été banni par {interaction.user}")
            except Exception as e:
                await interaction.response.send_message(f"Erreur lors du bannissement: {e}")
            
        @bot.tree.command(name='clear', description='Supprime un nombre spécifié de messages dans le canal actuel')
        async def clear(interaction: discord.Interaction, nombre: int):
            """Supprime un nombre spécifié de messages dans le canal actuel"""
            if not interaction.user.guild_permissions.manage_messages:
                await interaction.response.send_message(
                    "❌ Tu n'as pas la permission de gérer les messages.",
                    ephemeral=True
                )
                return

            if nombre < 1 or nombre > 100:
                await interaction.response.send_message(
                    "❌ Veuillez spécifier un nombre entre 1 et 100.",
                    ephemeral=True
                )
                return


            await interaction.response.defer(ephemeral=True)
            
            deleted = await interaction.channel.purge(limit=nombre)
            await interaction.followup.send(f"✅ {len(deleted)} messages supprimés.", ephemeral=True)
            print(f"{interaction.user} a supprimé {len(deleted)} messages dans {interaction.channel}")

        @bot.tree.command(name="timeout", description="Exclut temporairement un membre (mute)")
        async def timeout(interaction: discord.Interaction, membres: discord.Member, duree: int, raison: str = "Aucune raison fournie"):
            """Exclut temporairement un membre du serveur (timeout/mute)"""
            if not interaction.user.guild_permissions.moderate_members:
                await interaction.response.send_message(
                    "❌ Tu n'as pas la permission d'exclure des membres.",
                    ephemeral=True
                )
                return

            try:
                await membres.send(f"⏱️ Vous avez été exclu(e) temporairement du serveur pour {duree} minutes.\n**Modérateur :** {interaction.user}\n**Raison :** {raison}")
            except:
                pass
            
            try:

                timeout_duration = discord.utils.utcnow() + timedelta(minutes=duree)
                await membres.timeout(timeout_duration, reason=f"Exclu par {interaction.user} pour {duree} minutes - Raison: {raison}")
                await interaction.response.send_message(f"⏱️ {membres.mention} a été exclu(e) pour {duree} minutes ✅")
                print(f"{membres} a été exclu(e) par {interaction.user} pour {duree} minutes")
            except Exception as e:
                await interaction.response.send_message(f"Erreur lors de l'exclusion: {e}")

        @bot.tree.command(name="untimeout", description="Retire l'exclusion temporaire (mute) d'un membre")
        async def untimeout(interaction: discord.Interaction, membres: discord.Member):
            """Retire l'exclusion temporaire (timeout/mute) d'un membre"""
            if not interaction.user.guild_permissions.moderate_members:
                await interaction.response.send_message(
                    "❌ Tu n'as pas la permission de gérer les exclusions.",
                    ephemeral=True
                )
                return

            try:
                await membres.send(f"✅ Votre exclusion temporaire a été levée.\n**Modérateur :** {interaction.user}")
            except:
                pass
            
            try:
                await membres.timeout(None, reason=f"Exclusion levée par {interaction.user}")
                await interaction.response.send_message(f"✅ L'exclusion de {membres.mention} a été levée.")
                print(f"L'exclusion de {membres} a été levée par {interaction.user}")
            except Exception as e:
                await interaction.response.send_message(f"Erreur lors de la levée de l'exclusion: {e}")

        @bot.tree.command(name="blacklist", description="Bannit un utilisateur du bot")
        async def blacklist(interaction: discord.Interaction, user_id: str, raison: str = "Aucune raison fournie"):
            """Bannit un utilisateur du bot en ajoutant son ID à la blacklist"""
            if not interaction.user.guild_permissions.administrator:
                await interaction.response.send_message(
                    "❌ Tu n'as pas la permission d'administrateur.",
                    ephemeral=True
                )
                return

            guild_id = str(interaction.guild.id)

            try:
                if not os.path.exists('config'):
                    os.makedirs('config')
                with open('config/blacklist.json', 'r') as f:
                    blacklist_data = json.load(f)
            except FileNotFoundError:
                blacklist_data = {}

            if guild_id not in blacklist_data:
                blacklist_data[guild_id] = {}

            if user_id in blacklist_data[guild_id]:
                await interaction.response.send_message(f"❌ L'utilisateur avec l'ID {user_id} est déjà dans la blacklist.", ephemeral=True)
                return


            blacklist_data[guild_id][user_id] = raison

            with open('config/blacklist.json', 'w') as f:
                json.dump(blacklist_data, f, indent=4)


            try:
                member = await interaction.guild.fetch_member(int(user_id))
                if member:
                    try:
                        await member.send(f"❌ Vous avez été banni de **{interaction.guild.name}**.\n**Raison :** {raison}\n\nVous avez été ajouté à la blacklist du serveur.")
                    except:
                        pass
                    await member.ban(reason=f"Blacklist - {raison}")
            except discord.NotFound:
                pass
            except Exception as e:
                print(f"Erreur lors de la vérification/bannissement: {e}")

            await interaction.response.send_message(f"✅ L'utilisateur avec l'ID {user_id} a été ajouté à la blacklist.\n**Raison :** {raison}\n\n⚠️ Si cet utilisateur rejoint (ou rejoint à nouveau) le serveur, il sera automatiquement banni.")
            print(f"L'utilisateur avec l'ID {user_id} a été blacklisted par {interaction.user} dans {interaction.guild.name} pour la raison : {raison}")

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        """Bannit automatiquement les utilisateurs blacklistés qui rejoignent le serveur"""
        try:
            with open('config/blacklist.json', 'r') as f:
                blacklist_data = json.load(f)
        except FileNotFoundError:
            return
        
        guild_id = str(member.guild.id)
        user_id_str = str(member.id)
        
        if guild_id in blacklist_data and user_id_str in blacklist_data[guild_id]:
            raison = blacklist_data[guild_id][user_id_str]
            try:
                await member.send(f"❌ Vous avez été automatiquement banni de **{member.guild.name}**.\n**Raison :** {raison}\n\nVous êtes dans la blacklist du serveur.")
            except:
                pass
            
            try:
                await member.ban(reason=f"Blacklist - {raison}")
                print(f"🔨 {member} (ID: {member.id}) a été automatiquement banni de {member.guild.name} (blacklist)")
            except Exception as e:
                print(f"Erreur lors du bannissement automatique de {member}: {e}")


async def setup(bot: commands.Bot):
    await bot.add_cog(Admin(bot))
