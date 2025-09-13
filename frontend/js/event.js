class FootballPageElement {
    constructor() {
        // query parts
        this.$queryEle = $('#query');
        this.$topK = $('#top_k');
        this.$searchType = $('#search_type');
        this.$searchBtn = $('#search-btn');

        // result parts
        this.$resultHeader = $('#results-header');
        this.$resultSection = $('#results-section');
        this.$resultContainer = $('#results-container');
        this.$detailSection = $('#player-detail-section');

        // basic information field
        this.$playerName = $('#player_name');
        this.$playerNation = $('#player_nation');
        this.$playerBorn = $('#player_born');
        this.$playerAge = $('#player_age');
        this.$playerPosition = $('#player_position');
        this.$playerSquad = $('#player_squad');

        // statistical
        this.$assists = $('#stat_assists');
        this.$goals = $('#stat_goals');
        this.$scaEle = $('#stat_sca');

        // detail information field
        this.$playerMinutes = $('#player_minutes');
        this.$playerGoalDetail = $('#player_goals_detail');
        this.$playerProgressive = $('#player_progressive');
        this.$playerAvgPassing = $('#player-avg-passing');
        this.$playeAerial = $('#player_aerial');
        this.$playerApperance = $('#player_appearance');

        // similar players element
        this.$similarPlayerName = $('#similar_player_name');
        this.$similarPlayerBody = $('#similar_players_tbody');

        this.playerPhoto = $('#player_photo');
    }
}

const pageElement = new FootballPageElement();

class EventHandler {
    static initPageEvent() {
        pageElement.$searchBtn.on('click', () => {
            PlayerFootballLoadDataHandle.searchPlayer();
        });
    }
}