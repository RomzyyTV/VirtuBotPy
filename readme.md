<div align="center">

# 🤖 VirtuBot

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![Discord.py](https://img.shields.io/badge/discord.py-2.3+-blue.svg)](https://discordpy.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()

**Un bot Discord moderne, modulaire et open-source 🚀**

_Fait par [Falous-dev](https://github.com/Falous-dev) avec ❤️_

[Installation](#-installation) • [Fonctionnalités](#-fonctionnalités) • [Configuration](#%EF%B8%8F-configuration) • [Commandes](#-commandes) • [Contributing](#-contribuer)

---

</div>

## 📋 Description

**VirtuBot** est un bot Discord complet et personnalisable écrit en Python, conçu pour enrichir votre serveur avec des fonctionnalités de modération, de divertissement, et bien plus encore.

### ✨ Pourquoi VirtuBot ?

- 🎯 **Modulaire** : Architecture basée sur des Cogs pour une organisation claire
- 🔧 **Personnalisable** : Code ouvert et facilement modifiable
- 🌐 **Multi-serveurs** : Supporte plusieurs serveurs avec configurations indépendantes
- 🎨 **Interface moderne** : Utilise les dernières fonctionnalités Discord (Slash Commands, Embeds, Buttons)
- 📦 **Sans base de données** : Utilise JSON pour une simplicité maximale

---

## 🌟 Fonctionnalités

### 🛡️ Modération

- **Kick/Ban** : Expulsion et bannissement avec notifications MP et raisons
- **Système de tickets** : Support client avec canaux privés et staff
- **Gestion des rôles** : Attribution de rôles de support pour les tickets

### 🎮 Divertissement

- **Jeux** : Pile ou face, dé, deviner un nombre
- **Commandes utiles** : Say, embeds personnalisés, système de partenariats

### 🎫 Système de Tickets Avancé

- Création automatique de salons privés
- Canal staff séparé pour la coordination
- Boutons interactifs (Claim, Join, Priority, Transfer, Close)
- Archivage automatique des tickets fermés
- Statistiques utilisateurs et historique

### 🔧 Configuration

- Configuration par serveur avec JSON
- Commande `/adminbot` pour gérer toutes les options
- Interface avec menus déroulants et boutons

---

## 🚀 Installation

### Prérequis

- **Python 3.14+** ([Télécharger](https://www.python.org/downloads/))
- **Git** ([Télécharger](https://git-scm.com/))
- **Un token Discord Bot** ([Guide](https://discord.com/developers/applications))

### Installation rapide

```bash
# 1. Cloner le repository
git clone https://github.com/Falous-dev/VirtuBot.git
cd VirtuBot

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Créer le fichier .env
echo DISCORD_TOKEN=votre_token_ici > .env

# 4. Lancer le bot
python main.py
```

### Configuration du Token Discord

1. Allez sur le [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une nouvelle application
3. Allez dans l'onglet **Bot**
4. Cliquez sur **Reset Token** et copiez-le
5. Collez le token dans votre fichier `.env`

**Important :** Activez les **Privileged Gateway Intents** :

- ✅ Presence Intent
- ✅ Server Members Intent
- ✅ Message Content Intent

---

## 🎯 Commandes

### 📌 Commandes de Base

| Commande | Description                                |
| -------- | ------------------------------------------ |
| `/help`  | Affiche la liste des commandes disponibles |
| `/hello` | Salue le bot et affiche la latence         |

### 🛠️ Modération

| Commande                  | Description                  | Permissions requises |
| ------------------------- | ---------------------------- | -------------------- |
| `/kick <membre> [raison]` | Expulse un membre du serveur | Expulser des membres |
| `/ban <membre> [raison]`  | Bannit un membre du serveur  | Bannir des membres   |

### 🎮 Jeux

| Commande                  | Description                               |
| ------------------------- | ----------------------------------------- |
| `/jeux-pieces`            | Lance une pièce de monnaie (Pile ou Face) |
| `/jeux-de`                | Lance un dé à 6 faces                     |
| `/trouve-nombre <nombre>` | Devine un nombre entre 1 et 100           |

### 🎫 Tickets

| Commande                                       | Description                                 | Permissions requises |
| ---------------------------------------------- | ------------------------------------------- | -------------------- |
| `/setup_ticket <channel> <category> [archive]` | Configure le système de tickets             | Gérer le serveur     |
| `/ticket_support_roles <action>`               | Gère les rôles de support (add/remove/list) | Gérer le serveur     |

### 🎨 Utilitaires

| Commande                                    | Description                      | Permissions requises |
| ------------------------------------------- | -------------------------------- | -------------------- |
| `/say <message>`                            | Fait parler le bot               | Gérer les messages   |
| `/sayembed <titre> <description> <couleur>` | Crée un embed personnalisé       | Gérer les messages   |
| `/partenariats`                             | Envoie un message de partenariat | Gérer le serveur     |

### ⚙️ Configuration

| Commande    | Description                              | Permissions requises |
| ----------- | ---------------------------------------- | -------------------- |
| `/adminbot` | Ouvre le panneau de configuration du bot | Gérer le serveur     |

---

## ⚙️ Configuration

Le bot utilise des fichiers JSON pour stocker les configurations :

### Structure des fichiers

```
VirtuBot/
├── main.py                 # Point d'entrée du bot
├── config.json            # Configuration globale (généré automatiquement)
├── ticket_config.json     # Configuration des tickets
├── ticket_data.json       # Données des tickets
├── cogs/                  # Modules du bot
│   ├── admin.py          # Commandes de modération
│   ├── base.py           # Commandes de base
│   ├── config.py         # Système de configuration
│   ├── games.py          # Jeux
│   ├── ticket.py         # Système de tickets
│   └── tool.py           # Utilitaires
├── requirements.txt       # Dépendances Python
└── .env                  # Variables d'environnement (TOKEN)
```

### Configuration par serveur

Chaque serveur a sa propre configuration stockée avec son ID :

```json
{
  "123456789": {
    "ticket_channel": 987654321,
    "ticket_category": 111222333,
    "ticket_support_roles": [444555666],
    "archive_category": 777888999
  }
}
```

---

## 🎨 Personnalisation

### Ajouter un nouveau module (Cog)

```python
# cogs/mon_module.py
import discord
from discord.ext import commands

bot = None

class MonModule(commands.Cog):
    def __init__(self, bot_instance: commands.Bot):
        global bot
        bot = bot_instance
        self.bot = bot_instance

        @bot.tree.command(name="ma-commande", description="Ma commande personnalisée")
        async def ma_commande(interaction: discord.Interaction):
            await interaction.response.send_message("Hello!")

async def setup(bot: commands.Bot):
    await bot.add_cog(MonModule(bot))
```

Le bot chargera automatiquement tous les fichiers `.py` du dossier `cogs/`.

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment vous pouvez aider :

1. **Fork** le projet
2. Créez une **branche** pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

### Guidelines

- Suivez le style de code existant
- Commentez votre code en français
- Testez vos modifications avant de soumettre
- Mettez à jour la documentation si nécessaire

---

## ⚠️ Clause de non-responsabilité

Ce projet est fourni **"tel quel"**, sans aucune garantie, explicite ou implicite.

L'auteur ne peut être tenu responsable des dommages, pertes de données, erreurs, pannes ou tout autre problème résultant de l'utilisation, de la mauvaise utilisation ou de la modification de ce code.

**En utilisant ce projet, vous acceptez l'entière responsabilité de son usage.**

---

## 👥 Contributeurs

<div align="center">

### 🌟 Créé par

**[Falous-dev](https://github.com/Falous-dev)**

### 💡 Remerciements spéciaux

Merci à tous ceux qui contribuent à rendre **VirtuBot** meilleur chaque jour !

---

<sub>Made with ❤️ and Python | © 2025 VirtuBot</sub>

</div>
