let currentGuilds = [];
let userGuilds = [];
let discordUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Panel VirtuBot chargé');
    
    const token = localStorage.getItem('discord_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        await loadUserData();
    } catch (error) {
        console.error('Erreur auth:', error);
        localStorage.removeItem('discord_token');
        window.location.href = 'login.html';
        return;
    }
    
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateToPage(page);
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            sidebar.classList.remove('active');
        });
    });

    await loadDashboard();
    
    setInterval(checkBotStatus, 30000);
});

async function loadUserData() {
    const token = localStorage.getItem('discord_token');
    const userStr = localStorage.getItem('discord_user');
    
    if (!userStr) {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Auth failed');
        discordUser = await response.json();
        localStorage.setItem('discord_user', JSON.stringify(discordUser));
    } else {
        discordUser = JSON.parse(userStr);
    }
    
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!guildsResponse.ok) throw new Error('Failed to fetch guilds');
    userGuilds = await guildsResponse.json();
}

function logout() {
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_user');
    window.location.href = 'login.html';
}

function navigateToPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        switch(pageName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'guilds':
                loadGuilds();
                break;
            case 'commands':
                loadCommands();
                break;
            case 'logs':
                loadLogs();
                break;
        }
    }
}

async function checkBotStatus() {
    try {
        const health = await checkHealth();
        const botStatus = document.getElementById('botStatus');
        
        if (health.bot_ready) {
            botStatus.innerHTML = '<i class="fas fa-circle"></i> En ligne';
            botStatus.classList.add('online');
            botStatus.classList.remove('offline');
        } else {
            botStatus.innerHTML = '<i class="fas fa-circle"></i> Hors ligne';
            botStatus.classList.add('offline');
            botStatus.classList.remove('online');
        }
    } catch (error) {
        const botStatus = document.getElementById('botStatus');
        botStatus.innerHTML = '<i class="fas fa-circle"></i> Erreur';
        botStatus.classList.add('offline');
        botStatus.classList.remove('online');
    }
}

async function loadDashboard() {
    try {
        const stats = await getBotStats();
        
        const botName = document.getElementById('botName');
        const botAvatar = document.getElementById('botAvatar');
        
        botName.textContent = stats.username;
        if (stats.avatar) {
            botAvatar.src = stats.avatar;
            botAvatar.style.display = 'block';
        }
        
        document.getElementById('guildCount').textContent = stats.guilds;
        document.getElementById('userCount').textContent = stats.users.toLocaleString();
        document.getElementById('latency').textContent = stats.latency;
        
        try {
            const commands = await getBotCommands();
            document.getElementById('commandCount').textContent = commands.length;
        } catch (error) {
            document.getElementById('commandCount').textContent = '?';
        }
        
        await checkBotStatus();
    } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
        showError('Impossible de charger les statistiques du bot');
    }
}

async function loadGuilds() {
    const guildsList = document.getElementById('guildsList');
    guildsList.innerHTML = '<p class="loading">Chargement des serveurs...</p>';
    
    try {
        const guilds = await getGuilds();
        currentGuilds = guilds;
        
        if (guilds.length === 0) {
            guildsList.innerHTML = '<p class="loading">Aucun serveur trouvé</p>';
            return;
        }
        
        guildsList.innerHTML = '';
        guilds.forEach(guild => {
            const guildCard = document.createElement('div');
            guildCard.className = 'guild-card';
            guildCard.innerHTML = `
                <div class="guild-icon">
                    ${guild.icon ? `<img src="${guild.icon}" alt="${guild.name}">` : guild.name.charAt(0)}
                </div>
                <div class="guild-info">
                    <h3>${guild.name}</h3>
                    <p><i class="fas fa-users"></i> ${guild.memberCount} membres</p>
                </div>
            `;
            guildsList.appendChild(guildCard);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des serveurs:', error);
        guildsList.innerHTML = '<p class="loading">Erreur lors du chargement des serveurs</p>';
    }
}

async function loadCommands() {
    const commandsList = document.getElementById('commandsList');
    commandsList.innerHTML = '<p class="loading">Chargement des commandes...</p>';
    
    try {
        const commands = await getBotCommands();
        
        if (commands.length === 0) {
            commandsList.innerHTML = '<p class="loading">Aucune commande trouvée</p>';
            return;
        }
        
        const categories = {};
        commands.forEach(cmd => {
            if (!categories[cmd.category]) {
                categories[cmd.category] = [];
            }
            categories[cmd.category].push(cmd);
        });
        
        commandsList.innerHTML = '';
        Object.keys(categories).forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'command-category';
            categoryDiv.innerHTML = `<h3>${category}</h3>`;
            
            categories[category].forEach(cmd => {
                const commandItem = document.createElement('div');
                commandItem.className = 'command-item';
                commandItem.innerHTML = `
                    <span class="command-name">/${cmd.name}</span>
                    <span class="command-description">${cmd.description}</span>
                `;
                categoryDiv.appendChild(commandItem);
            });
            
            commandsList.appendChild(categoryDiv);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        commandsList.innerHTML = '<p class="loading">Erreur lors du chargement des commandes</p>';
    }
}

async function loadLogs() {
    const logsContainer = document.getElementById('logsContainer');
    const logGuildFilter = document.getElementById('logGuildFilter');
    
    logsContainer.innerHTML = '<p class="loading">Chargement des logs...</p>';
    
    try {
        const guilds = currentGuilds.length > 0 ? currentGuilds : await getGuilds();
        currentGuilds = guilds;
        
        logGuildFilter.innerHTML = '<option value="">Tous les serveurs</option>';
        guilds.forEach(guild => {
            const option = document.createElement('option');
            option.value = guild.id;
            option.textContent = guild.name;
            logGuildFilter.appendChild(option);
        });
        
        const logs = await getCommandLogs();
        
        if (logs.length === 0) {
            logsContainer.innerHTML = '<p class="loading">Aucun log disponible</p>';
            return;
        }
        
        logsContainer.innerHTML = '';
        logs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            logItem.innerHTML = `
                <div class="log-header">
                    <span class="log-command"><i class="fas fa-terminal"></i> /${log.command}</span>
                    <span class="log-time">${new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                </div>
                <div class="log-details">
                    <span><i class="fas fa-user"></i> ${log.user}</span>
                    <span><i class="fas fa-server"></i> ${log.guild}</span>
                </div>
            `;
            logsContainer.appendChild(logItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des logs:', error);
        logsContainer.innerHTML = '<p class="loading">Erreur lors du chargement des logs</p>';
    }
}

function saveApiUrl() {
    const apiUrl = document.getElementById('apiUrl').value;
    localStorage.setItem('apiUrl', apiUrl);
    showSuccess('URL de l\'API sauvegardée');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}
