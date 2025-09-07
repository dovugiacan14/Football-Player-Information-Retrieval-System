const API_BASE = 'http://localhost:8000';

class FootballPageElement {
    constructor() {
        this.$queryEle = $('#query');
        this.$topK = $('#top_k');
        this.$searchType = $('#search_type');
        this.$resultHeader = $('#results-header');
        this.$resultSection = $('#results-section');
        this.$resultContainer = $('#results-container');
        this.$searchBtn = $('#search-btn');
    }
}

let pageElement = new FootballPageElement();

class CommonFunction {
    static async searchPlayers() {
        const query = pageElement.$queryEle.val().trim();
        const topK = parseInt(pageElement.$topK.val());
        const searchType = pageElement.$searchType.val();

        // Validation
        if (!query) {
            pageElement.$queryEle.focus();
            this.showError('Please enter a search query');
            return;
        }

        if (topK < 1 || topK > 50) {
            pageElement.$topK.focus();
            this.showError('Number of results must be between 1 and 50');
            return;
        }

        this.showLoading();

        // send request 
        try {
            const response = await fetch(`${API_BASE}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    top_k: topK,
                    search_type: searchType
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.displayResults(data);
        } catch (error) {
            console.error('Search error:', error);
            this.showError(`Search failed: ${error.message}`);
        }
    }

    static showLoading() {
        pageElement.$searchBtn.prop('disabled', true).text('Searching...');
        pageElement.$resultSection.show();
        pageElement.$resultContainer.html('<div class="loading">Searching players...</div>');

        $('html, body').animate({
            scrollTop: pageElement.$resultSection.offset().top - 20
        }, 500);
    }

    static displayResults(data) {
        pageElement.$searchBtn.prop('disabled', false).html('🔍 Search Players');

        const searchTypeText = data.search_type === 'hybrid' ? 'Hybrid' : 'Semantic Only';
        pageElement.$resultHeader.html(`
            <h3>Search Results (${searchTypeText})</h3>
            <div class="results-meta">
                Query: "<strong>${this.escapeHtml(data.query)}</strong>" | 
                Found: <strong>${data.total_results}</strong> players
            </div>
        `);

        if (data.results && data.results.length > 0) {
            const cardsHtml = data.results.map(player => this.createPlayerCard(player)).join('');
            pageElement.$resultContainer.html(cardsHtml);
            pageElement.$resultSection.show();
        } else {
            pageElement.$resultContainer.html('<div class="no-results">No players found matching your search criteria.<br>Try different keywords or search type.</div>');
        }
    }

    static createPlayerCard(result) {
        const player = result.player_data; 
        const score = result.combine_score || result.similarity_score || 0;
        const playerId = player.playerId;

        return `
            <div class="player-card">
                <div class="player-header" onclick="EventHandler.togglePlayerDetails('${playerId}')">
                    <div class="score-badge">Score: ${score.toFixed(3)}</div>
                    <div class="player-name">${this.escapeHtml(player.fullName)}</div>
                    <div class="player-basic">
                        <span>📍 ${this.escapeHtml(player.position)}</span>
                        <span>🏳️ ${this.escapeHtml(player.nationality)}</span>
                        <span>⚽ ${this.escapeHtml(player.current_club?.clubName || 'N/A')}</span>
                        <span>👤 ${player.age} years</span>
                    </div>
                </div>
                <div class="player-details" id="details-${playerId}">
                    ${this.createPlayerDetailsHTML(player)}
                </div>
            </div>
        `;
    }

    static createPlayerDetailsHTML(player) {
        const latestStats = player.season_statistics && player.season_statistics.length > 0 
            ? player.season_statistics[0] : null;

        return `
            <div class="details-grid">
                <div class="detail-section">
                    <h4>📊 Basic Info</h4>
                    <div class="stat-item">
                        <span class="stat-label">Full Name</span>
                        <span class="stat-value">${this.escapeHtml(player.fullName)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Date of Birth</span>
                        <span class="stat-value">${player.dateOfBirth || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Height</span>
                        <span class="stat-value">${player.heightCm || 'N/A'} ${player.heightCm ? 'cm' : ''}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Weight</span>
                        <span class="stat-value">${player.weightKg || 'N/A'} ${player.weightKg ? 'kg' : ''}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Preferred Foot</span>
                        <span class="stat-value">${player.preferredFoot || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>⚽ Career Stats</h4>
                    <div class="stat-item">
                        <span class="stat-label">Total Appearances</span>
                        <span class="stat-value">${player.totalAppearances || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Career Goals</span>
                        <span class="stat-value">${player.career_goals || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Career Assists</span>
                        <span class="stat-value">${player.career_assists || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Seasons</span>
                        <span class="stat-value">${player.total_seasons || 'N/A'}</span>
                    </div>
                </div>
                
                ${latestStats ? `
                <div class="detail-section">
                    <h4>📈 Latest Season (${latestStats.seasonId || 'Unknown'})</h4>
                    <div class="stat-item">
                        <span class="stat-label">Appearances</span>
                        <span class="stat-value">${latestStats.appearances || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Goals</span>
                        <span class="stat-value">${latestStats.goals || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Assists</span>
                        <span class="stat-value">${latestStats.assists || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Minutes Played</span>
                        <span class="stat-value">${this.formatMinutes(latestStats.minutesPlayed)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Yellow Cards</span>
                        <span class="stat-value">${latestStats.yellowCards || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tackles</span>
                        <span class="stat-value">${latestStats.tackles || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Dribbles Completed</span>
                        <span class="stat-value">${latestStats.dribblesCompleted || 0}</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="detail-section">
                    <h4>🏟️ Club Info</h4>
                    <div class="stat-item">
                        <span class="stat-label">Current Club</span>
                        <span class="stat-value">${this.escapeHtml(player.current_club?.clubName || 'N/A')}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Stadium</span>
                        <span class="stat-value">${this.escapeHtml(player.current_club?.stadium || 'N/A')}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Joined Season</span>
                        <span class="stat-value">${player.joinedSeason || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Shirt Number</span>
                        <span class="stat-value">${player.shirtNumber || 'N/A'}</span>
                    </div>
                    ${player.club_history && player.club_history.length > 1 ? `
                    <div class="stat-item">
                        <span class="stat-label">Clubs Played</span>
                        <span class="stat-value">${player.club_history.length} clubs</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static showError(message) {
        pageElement.$searchBtn.prop('disabled', false).html('🔍 Search Players');
        pageElement.$resultContainer.html(`<div class="error-message">${this.escapeHtml(message)}</div>`);
        pageElement.$resultSection.show();

        setTimeout(() => {
            if (pageElement.$resultContainer.html().includes('error-message')) {
                pageElement.$resultSection.hide();
            }
        }, 5000);
    }

    static escapeHtml(text) {
        if (!text) return ''; 
        const div = document.createElement('div'); 
        div.textContent = text;
        return div.innerHTML;
    }

    static formatMinutes(minutes) {
        if (!minutes || minutes === 0) return 'N/A';
        
        if (minutes >= 90) {
            const games = Math.floor(minutes / 90);
            const remainingMinutes = minutes % 90;
            return remainingMinutes > 0 
                ? `${minutes} min (~${games}.${Math.floor(remainingMinutes/9)} games)`
                : `${minutes} min (~${games} games)`;
        }
        
        return `${minutes} min`;
    }
}


class EventHandler{
    static initPageEvent() {
        pageElement.$searchBtn.on('click', () => CommonFunction.searchPlayers()); 
    }

    static togglePlayerDetails(playerId) {
        $(`#details-${playerId}`).slideToggle();
    }
}

$(document).ready(function() {
    EventHandler.initPageEvent();
    EventHandler.togglePlayerDetails();
});