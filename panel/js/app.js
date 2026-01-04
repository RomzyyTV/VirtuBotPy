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
    
    // Toujours recharger les données de l'utilisateur pour avoir l'avatar à jour
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Auth failed');
    discordUser = await response.json();
    localStorage.setItem('discord_user', JSON.stringify(discordUser));
    
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
        // Afficher l'utilisateur dans le header
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (discordUser) {
            userName.textContent = discordUser.username;
            if (discordUser.avatar) {
                // Détecter si l'avatar est animé (commence par a_)
                const isAnimated = discordUser.avatar.startsWith('a_');
                const extension = isAnimated ? 'gif' : 'png';
                const avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${extension}?size=128`;
                userAvatar.src = avatarUrl;
                userAvatar.style.display = 'block';
                userAvatar.style.cursor = 'pointer';
                
                // Ajouter l'événement click pour voir le profil
                userAvatar.onclick = () => showUserProfile();
            }
        }
        
        const stats = await getBotStats();
        
        // Filtrer les serveurs où l'utilisateur a les permissions admin ET où le bot est présent
        const botGuilds = await getGuilds();
        const adminGuilds = botGuilds.filter(botGuild => {
            const userGuild = userGuilds.find(ug => ug.id === botGuild.id);
            if (!userGuild) return false;
            const hasAdmin = (userGuild.permissions & 0x8) === 0x8; // Permission Administrator
            return hasAdmin;
        });
        
        const totalUserGuilds = userGuilds.length;
        
        document.getElementById('adminGuildCount').textContent = adminGuilds.length;
        const totalGuildCountElement = document.getElementById('totalGuildCount');
        if (totalGuildCountElement) {
            totalGuildCountElement.textContent = totalUserGuilds;
        }
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
        // Afficher quand même l'interface avec des valeurs par défaut
        document.getElementById('adminGuildCount').textContent = '0';
        const totalGuildCountElement = document.getElementById('totalGuildCount');
        if (totalGuildCountElement) {
            totalGuildCountElement.textContent = '0';
        }
        document.getElementById('latency').textContent = '?';
        document.getElementById('commandCount').textContent = '?';
        
        // Afficher un message d'erreur moins intrusif
        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage && !document.querySelector('.error-banner')) {
            const errorBanner = document.createElement('div');
            errorBanner.className = 'error-banner';
            errorBanner.style.cssText = 'background: #ED4245; color: white; padding: 1rem; border-radius: 8px; margin-top: 1rem; text-align: center; display: flex; align-items: center; justify-content: center; gap: 0.5rem;';
            errorBanner.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                <span>Impossible de charger les statistiques du bot. Vérifiez que le bot est en ligne.</span>
                <button onclick="location.reload()" style="margin-left: 1rem; background: white; color: #ED4245; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    <i class="fas fa-sync"></i> Réessayer
                </button>
            `;
            const statsGrid = dashboardPage.querySelector('.stats-grid');
            if (statsGrid) {
                statsGrid.parentElement.insertBefore(errorBanner, statsGrid.nextSibling);
            }
        }
    }
}

async function loadGuilds() {
    const guildsList = document.getElementById('guildsList');
    guildsList.innerHTML = '<p class="loading">Chargement des serveurs...</p>';
    
    try {
        const guilds = await getGuilds();
        
        // Filtrer pour afficher uniquement les serveurs où l'utilisateur est admin
        const adminGuilds = guilds.filter(guild => {
            const userGuild = userGuilds.find(ug => ug.id === guild.id);
            if (!userGuild) return false;
            const hasAdmin = (userGuild.permissions & 0x8) === 0x8; // Permission Administrator
            return hasAdmin;
        });
        
        currentGuilds = adminGuilds;
        
        if (adminGuilds.length === 0) {
            guildsList.innerHTML = '<p class="loading">Aucun serveur trouvé où vous êtes administrateur</p>';
            return;
        }
        
        guildsList.innerHTML = '';
        adminGuilds.forEach(guild => {
            const guildCard = document.createElement('div');
            guildCard.className = 'guild-card';
            guildCard.onclick = () => {
                // Rediriger vers serveur.html avec l'ID du serveur
                window.location.href = `serveur.html?guild=${guild.id}`;
            };
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

function showUserProfile() {
    if (!discordUser) return;
    
    // Créer un modal pour afficher le profil
    const modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    const isAnimated = discordUser.avatar && discordUser.avatar.startsWith('a_');
    const extension = isAnimated ? 'gif' : 'png';
    const avatarUrl = discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${extension}?size=512`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    modal.innerHTML = `
        <div style="
            background: var(--card-bg);
            padding: 2rem;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            position: relative;
        ">
            <button onclick="this.closest('#profileModal').remove()" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: var(--danger-color);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
            ">×</button>
            <img src="${avatarUrl}" alt="Avatar" style="
                width: 200px;
                height: 200px;
                border-radius: 50%;
                margin-bottom: 1rem;
                border: 4px solid var(--primary-color);
            ">
            <h2 style="color: var(--primary-color); margin-bottom: 0.5rem;">${discordUser.username}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">ID: ${discordUser.id}</p>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                <i class="fas fa-calendar-alt"></i> Compte créé le: ${new Date(parseInt(discordUser.id) / 4194304 + 1420070400000).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
                <a href="https://discord.com/users/${discordUser.id}" target="_blank" class="btn btn-primary" style="text-decoration: none; display: inline-block;">
                    <i class="fas fa-external-link-alt"></i> Voir sur Discord
                </a>
            </div>
        </div>
    `;
    
    // Fermer le modal en cliquant en dehors
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    document.body.appendChild(modal);
}
