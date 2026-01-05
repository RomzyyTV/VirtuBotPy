const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:3001';

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur API');
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

async function getBotStats() {
    return fetchAPI('/api/bot/stats');
}

async function getGuilds() {
    return fetchAPI('/api/guilds');
}

async function getGuildDetails(guildId) {
    return fetchAPI(`/api/guilds/${guildId}`);
}

async function getGuildMembers(guildId) {
    return fetchAPI(`/api/guilds/${guildId}/members`);
}

async function getBotCommands() {
    return fetchAPI('/api/bot/commands');
}

async function getCommandLogs() {
    return fetchAPI('/api/logs');
}

async function checkHealth() {
    return fetchAPI('/api/health');
}

async function getGuildBans(guildId) {
    return fetchAPI(`/api/guilds/${guildId}/bans`);
}

async function unbanUser(guildId, userId) {
    return fetchAPI(`/api/guilds/${guildId}/bans/${userId}`, {
        method: 'DELETE'
    });
}
