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
    
    // Toujours recharger les données de l'utilisateur pour avoir l'avatar à jour
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Auth failed');
    discordUser = await response.json();
    localStorage.setItem('discord_user', JSON.stringify(discordUser));
    
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
        
        // Charger les bans
        await loadGuildBans();
    } catch (error) {
        console.error('Erreur lors du chargement du serveur:', error);
        alert('Erreur lors du chargement des informations du serveur');
    }
}

async function loadGuildBans() {
    const bansContainer = document.getElementById('bansContainer');
    bansContainer.innerHTML = '<p class="loading">Chargement des bans...</p>';
    
    try {
        const bans = await getGuildBans(currentGuildId);
        
        if (!bans || bans.length === 0) {
            bansContainer.innerHTML = '<p class="loading">Aucun ban actif sur ce serveur</p>';
            return;
        }
        
        bansContainer.innerHTML = '';
        const bansList = document.createElement('div');
        bansList.className = 'bans-list';
        bansList.style.display = 'grid';
        bansList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        bansList.style.gap = '1rem';
        
        bans.forEach(ban => {
            const banItem = document.createElement('div');
            banItem.className = 'ban-item';
            banItem.style.padding = '1rem';
            banItem.style.background = 'rgba(220, 38, 38, 0.1)';
            banItem.style.border = '1px solid rgba(220, 38, 38, 0.3)';
            banItem.style.borderRadius = '8px';
            banItem.style.display = 'flex';
            banItem.style.alignItems = 'center';
            banItem.style.gap = '1rem';
            banItem.style.justifyContent = 'space-between';
            
            const avatarUrl = ban.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
            
            banItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden;">
                        <img src="${avatarUrl}" alt="${ban.username}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1rem;">${ban.username}#${ban.discriminator}</h4>
                        <p style="margin: 0; font-size: 0.85rem; opacity: 0.7;">${ban.reason}</p>
                    </div>
                </div>
                <button class="btn btn-danger" onclick="handleUnban('${ban.user_id}', '${ban.username}')" style="white-space: nowrap;">
                    <i class="fas fa-user-check"></i> Débannir
                </button>
            `;
            bansList.appendChild(banItem);
        });
        
        bansContainer.appendChild(bansList);
    } catch (error) {
        console.error('Erreur lors du chargement des bans:', error);
        bansContainer.innerHTML = '<p class="loading">Erreur lors du chargement des bans</p>';
    }
}

async function handleUnban(userId, username) {
    if (!confirm(`Êtes-vous sûr de vouloir débannir ${username} ?`)) {
        return;
    }
    
    try {
        await unbanUser(currentGuildId, userId);
        alert(`${username} a été débanni avec succès`);
        await loadGuildBans(); // Recharger la liste
    } catch (error) {
        alert(`Erreur lors du débannissement: ${error.message}`);
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
            
            // Formater les paramètres de la commande
            let parametersHtml = '';
            if (log.parameters && Object.keys(log.parameters).length > 0) {
                parametersHtml = '<div class="log-parameters" style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(255, 255, 255, 0.03); border-radius: 4px; font-size: 0.9rem;">';
                parametersHtml += '<i class="fas fa-cog"></i> <strong>Paramètres:</strong><br>';
                for (const [key, value] of Object.entries(log.parameters)) {
                    parametersHtml += `<span style="margin-left: 1.5rem; opacity: 0.8;">• ${key}: <code style="background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 3px;">${value}</code></span><br>`;
                }
                parametersHtml += '</div>';
            }
            
            logItem.innerHTML = `
                <div class="log-header">
                    <span class="log-command"><i class="fas fa-terminal"></i> /${log.command}</span>
                    <span class="log-time">${new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                </div>
                <div class="log-details">
                    <span><i class="fas fa-user"></i> ${log.user}</span>
                    ${log.channel ? `<span style="margin-left: 1rem;"><i class="fas fa-hashtag"></i> ${log.channel}</span>` : ''}
                </div>
                ${parametersHtml}
            `;
            logsContainer.appendChild(logItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des logs:', error);
        logsContainer.innerHTML = '<p class="loading">Erreur lors du chargement des logs</p>';
    }
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

async function loadGuildMembers() {
    const membersContainer = document.getElementById('membersContainer');
    membersContainer.innerHTML = '<p class="loading">Chargement des membres...</p>';
    
    try {
        const members = await getGuildMembers(currentGuildId);
        
        if (!members || members.length === 0) {
            membersContainer.innerHTML = '<p class="loading">Aucun membre trouvé</p>';
            return;
        }
        
        membersContainer.innerHTML = '';
        const membersList = document.createElement('div');
        membersList.className = 'members-list';
        membersList.style.display = 'grid';
        membersList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        membersList.style.gap = '1rem';
        
        members.forEach(member => {
            const memberName = member.username || member.name || 'Membre';
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            memberItem.style.padding = '1rem';
            memberItem.style.background = 'rgba(255, 255, 255, 0.05)';
            memberItem.style.borderRadius = '8px';
            memberItem.style.display = 'flex';
            memberItem.style.alignItems = 'center';
            memberItem.style.gap = '1rem';
            memberItem.style.cursor = 'pointer';
            memberItem.style.transition = 'all 0.2s ease';
            
            // Ajouter l'événement click
            memberItem.onclick = () => showMemberDetails(member);
            
            // Hover effect
            memberItem.onmouseenter = () => {
                memberItem.style.background = 'rgba(255, 255, 255, 0.1)';
                memberItem.style.transform = 'scale(1.02)';
            };
            memberItem.onmouseleave = () => {
                memberItem.style.background = 'rgba(255, 255, 255, 0.05)';
                memberItem.style.transform = 'scale(1)';
            };
            
            memberItem.innerHTML = `
                <div class="member-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #5865f2; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; overflow: hidden;">
                    ${member.avatar ? `<img src="${member.avatar}" alt="${memberName}" style="width: 100%; height: 100%; object-fit: cover;">` : memberName.charAt(0).toUpperCase()}
                </div>
                <div class="member-info">
                    <h4 style="margin: 0; font-size: 1rem;">${memberName}${member.bot ? ' <span style="background: #5865f2; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">BOT</span>' : ''}</h4>
                    <p style="margin: 0; font-size: 0.85rem; opacity: 0.7;">${member.discriminator ? `#${member.discriminator}` : ''}</p>
                </div>
            `;
            membersList.appendChild(memberItem);
        });
        
        membersContainer.appendChild(membersList);
    } catch (error) {
        console.error('Erreur lors du chargement des membres:', error);
        membersContainer.innerHTML = `<p class="loading">Erreur lors du chargement des membres: ${error.message}</p>`;
    }
}

function showMemberDetails(member) {
    const memberName = member.username || member.name || 'Membre';
    const avatarUrl = member.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    // Calculer la date de création du compte
    const createdDate = member.createdAt ? new Date(member.createdAt) : new Date(parseInt(member.id) / 4194304 + 1420070400000);
    const joinedDate = member.joinedAt ? new Date(member.joinedAt) : null;
    
    // Créer la modale
    const modal = document.createElement('div');
    modal.id = 'memberModal';
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
    
    modal.innerHTML = `
        <div style="
            background: var(--card-bg);
            padding: 2rem;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            position: relative;
        ">
            <button onclick="this.closest('#memberModal').remove()" style="
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
            
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <img src="${avatarUrl}" alt="Avatar" style="
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    margin-bottom: 1rem;
                    border: 4px solid var(--primary-color);
                ">
                <h2 style="color: var(--primary-color); margin-bottom: 0.5rem;">${memberName}${member.bot ? ' <span style="background: #5865f2; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">BOT</span>' : ''}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${member.discriminator ? `#${member.discriminator}` : ''}</p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">ID: ${member.id}</p>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                        <i class="fas fa-calendar-plus"></i> Compte créé le
                    </p>
                    <p style="margin: 0.25rem 0 0 0; font-weight: bold;">
                        ${createdDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                
                ${joinedDate ? `
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                        <i class="fas fa-sign-in-alt"></i> A rejoint le serveur le
                    </p>
                    <p style="margin: 0.25rem 0 0 0; font-weight: bold;">
                        ${joinedDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                ` : ''}
            </div>
            

            
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
                <a href="https://discord.com/users/${member.id}" target="_blank" class="btn btn-primary" style="text-decoration: none; display: inline-block;">
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


