let currentGuildId = null;
let guildData = null;
let discordUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard Serveur chargé');
    
    const token = localStorage.getItem('discord_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Récupérer l'ID du serveur depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    currentGuildId = urlParams.get('guild');
    
    if (!currentGuildId) {
        alert('ID du serveur manquant');
        window.location.href = 'index.html';
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
            const page = item.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                navigateToPage(page);
                
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                sidebar.classList.remove('active');
            }
        });
    });

    await loadGuildOverview();
    await checkBotStatus();
    
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
    
    // Afficher l'utilisateur dans le header
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (discordUser) {
        userName.textContent = discordUser.username;
        if (discordUser.avatar) {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
            userAvatar.src = avatarUrl;
            userAvatar.style.display = 'block';
        }
    }
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
            case 'overview':
                loadGuildOverview();
                break;
            case 'logs':
                loadGuildLogs();
                break;
            case 'members':
                loadGuildMembers();
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

async function loadGuildOverview() {
    try {
        guildData = await getGuildDetails(currentGuildId);
        
        // Afficher les informations du serveur dans le header
        const guildName = document.getElementById('guildName');
        const guildIcon = document.getElementById('guildIcon');
        
        guildName.textContent = guildData.name;
        if (guildData.icon) {
            guildIcon.src = guildData.icon;
            guildIcon.style.display = 'block';
        }
        
        // Afficher les statistiques
        document.getElementById('memberCount').textContent = guildData.memberCount || '-';
        document.getElementById('channelCount').textContent = guildData.channels?.length || '-';
        document.getElementById('roleCount').textContent = guildData.roles?.length || '-';
        
        // Afficher les informations
        document.getElementById('guildOwner').textContent = guildData.ownerName || 'Inconnu';
        document.getElementById('guildRegion').textContent = guildData.region || 'Automatique';
        
        if (guildData.createdAt) {
            const createdDate = new Date(guildData.createdAt);
            document.getElementById('guildCreated').textContent = createdDate.toLocaleDateString('fr-FR');
        }
    } catch (error) {
        console.error('Erreur lors du chargement du serveur:', error);
        alert('Erreur lors du chargement des informations du serveur');
    }
}

async function loadGuildLogs() {
    const logsContainer = document.getElementById('logsContainer');
    logsContainer.innerHTML = '<p class="loading">Chargement des logs...</p>';
    
    try {
        const allLogs = await getCommandLogs();
        
        // Filtrer les logs pour ce serveur uniquement
        const guildLogs = allLogs.filter(log => log.guild_id === currentGuildId);
        
        if (guildLogs.length === 0) {
            logsContainer.innerHTML = '<p class="loading">Aucun log disponible pour ce serveur</p>';
            return;
        }
        
        logsContainer.innerHTML = '';
        guildLogs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            logItem.innerHTML = `
                <div class="log-header">
                    <span class="log-command"><i class="fas fa-terminal"></i> /${log.command}</span>
                    <span class="log-time">${new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                </div>
                <div class="log-details">
                    <span><i class="fas fa-user"></i> ${log.user}</span>
                </div>
            `;
            logsContainer.appendChild(logItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des logs:', error);
        logsContainer.innerHTML = '<p class="loading">Erreur lors du chargement des logs</p>';
    }
}

async function loadGuildMembers() {
    const membersContainer = document.getElementById('membersContainer');
    membersContainer.innerHTML = '<p class="loading">Chargement des membres...</p>';
    
    try {
        const members = await getGuildMembers(currentGuildId);
        
        if (members.length === 0) {
            membersContainer.innerHTML = '<p class="loading">Aucun membre trouvé</p>';
            return;
        }
        
        membersContainer.innerHTML = '';
        const membersList = document.createElement('div');
        membersList.className = 'members-list';
        
        members.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            memberItem.innerHTML = `
                <div class="member-avatar">
                    ${member.avatar ? `<img src="${member.avatar}" alt="${member.name}">` : member.name.charAt(0)}
                </div>
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p>${member.roles?.join(', ') || 'Aucun rôle'}</p>
                </div>
            `;
            membersList.appendChild(memberItem);
        });
        
        membersContainer.appendChild(membersList);
    } catch (error) {
        console.error('Erreur lors du chargement des membres:', error);
        membersContainer.innerHTML = '<p class="loading">Erreur lors du chargement des membres</p>';
    }
}
