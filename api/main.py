from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys
import threading
import requests
from collections import deque
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PANEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'panel')

app = Flask(__name__, static_folder=PANEL_DIR)
CORS(app)

bot_client = None
command_logs = deque(maxlen=100)

CLIENT_ID = os.getenv('DISCORD_CLIENT_ID')
CLIENT_SECRET = os.getenv('DISCORD_CLIENT_SECRET')
REDIRECT_URI = 'http://localhost:3001/api/auth/callback'

def set_bot_client(client):
    global bot_client
    bot_client = client

def log_command(command_name, user_name, guild_name):
    command_logs.append({
        'command': command_name,
        'user': user_name,
        'guild': guild_name,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/')
def serve_login():
    return send_from_directory(PANEL_DIR, 'login.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(PANEL_DIR, path)

@app.route('/api/auth/url', methods=['GET'])
def get_auth_url():
    if not CLIENT_ID:
        return jsonify({'error': 'CLIENT_ID not configured'}), 500
    
    scopes = 'identify guilds'
    auth_url = f'https://discord.com/api/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope={scopes}'
    return jsonify({'url': auth_url})

@app.route('/api/auth/callback', methods=['GET'])
def auth_callback():
    code = request.args.get('code')
    if not code:
        return '<h1>Erreur: Code manquant</h1>', 400
    
    if not CLIENT_SECRET:
        return '<h1>Erreur: CLIENT_SECRET not configured</h1>', 500
    
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI
    }
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    response = requests.post('https://discord.com/api/oauth2/token', data=data, headers=headers)
    
    if response.status_code != 200:
        return f'<h1>Erreur OAuth2: {response.text}</h1>', 400
    
    tokens = response.json()
    access_token = tokens.get('access_token')
    
    return f'''
    <html>
    <head><title>Connexion réussie</title></head>
    <body>
        <h1>Connexion réussie!</h1>
        <p>Redirection en cours...</p>
        <script>
            localStorage.setItem('discord_token', '{access_token}');
            window.location.href = '/index.html';
        </script>
    </body>
    </html>
    '''



@app.route('/api/bot/stats', methods=['GET'])
def get_bot_stats():
    """Obtenir les statistiques du bot"""
    if not bot_client or not bot_client.is_ready():
        return jsonify({'error': 'Bot not ready'}), 503
    
    try:
        stats = {
            'username': bot_client.user.name,
            'discriminator': bot_client.user.discriminator,
            'id': str(bot_client.user.id),
            'avatar': str(bot_client.user.avatar.url) if bot_client.user.avatar else None,
            'guilds': len(bot_client.guilds),
            'users': sum(guild.member_count for guild in bot_client.guilds),
            'latency': round(bot_client.latency * 1000, 2)
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/guilds', methods=['GET'])
def get_guilds():
    """Obtenir la liste des serveurs"""
    if not bot_client or not bot_client.is_ready():
        return jsonify({'error': 'Bot not ready'}), 503
    
    try:
        guilds = []
        for guild in bot_client.guilds:
            guilds.append({
                'id': str(guild.id),
                'name': guild.name,
                'icon': str(guild.icon.url) if guild.icon else None,
                'memberCount': guild.member_count,
                'ownerId': str(guild.owner_id)
            })
        return jsonify(guilds)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/guilds/<guild_id>', methods=['GET'])
def get_guild_details(guild_id):
    """Obtenir les détails d'un serveur"""
    if not bot_client or not bot_client.is_ready():
        return jsonify({'error': 'Bot not ready'}), 503
    
    try:
        guild = bot_client.get_guild(int(guild_id))
        if not guild:
            return jsonify({'error': 'Guild not found'}), 404
        
        guild_data = {
            'id': str(guild.id),
            'name': guild.name,
            'icon': str(guild.icon.url) if guild.icon else None,
            'memberCount': guild.member_count,
            'ownerId': str(guild.owner_id),
            'createdAt': guild.created_at.isoformat(),
            'description': guild.description,
            'channels': len(guild.channels),
            'roles': len(guild.roles)
        }
        return jsonify(guild_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/guilds/<guild_id>/members', methods=['GET'])
def get_guild_members(guild_id):
    """Obtenir les membres d'un serveur"""
    if not bot_client or not bot_client.is_ready():
        return jsonify({'error': 'Bot not ready'}), 503
    
    try:
        guild = bot_client.get_guild(int(guild_id))
        if not guild:
            return jsonify({'error': 'Guild not found'}), 404
        
        members = []
        for member in guild.members[:100]:  # Limite à 100 membres
            members.append({
                'id': str(member.id),
                'username': member.name,
                'discriminator': member.discriminator,
                'avatar': str(member.avatar.url) if member.avatar else None,
                'bot': member.bot,
                'joinedAt': member.joined_at.isoformat() if member.joined_at else None
            })
        return jsonify(members)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bot/commands', methods=['GET'])
def get_commands():
    if not bot_client or not bot_client.is_ready():
        return jsonify({'error': 'Bot not ready'}), 503
    
    try:
        commands = []
        for command in bot_client.tree.get_commands():
            commands.append({
                'name': command.name,
                'description': command.description or 'Pas de description',
                'category': 'Slash Commands'
            })
        for cog in bot_client.cogs.values():
            for command in cog.get_commands():
                commands.append({
                    'name': command.name,
                    'description': command.description or 'Pas de description',
                    'category': cog.qualified_name
                })
        return jsonify(commands)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    return jsonify(list(command_logs))

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'bot_ready': bot_client.is_ready() if bot_client else False
    })

def run_api(port=3001, host='0.0.0.0'):
    print(f"🌐 API démarrée sur http://{host}:{port}")
    app.run(host=host, port=port, debug=False, use_reloader=False)

def start_api_thread(client, port=3001):
    """Démarrer l'API dans un thread séparé"""
    set_bot_client(client)
    api_thread = threading.Thread(target=run_api, args=(port,), daemon=True)
    api_thread.start()
    return api_thread
