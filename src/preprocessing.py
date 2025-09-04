from src.utils import parse_date, calculate_age


class PreProcessing:
    def __init__(self, clubs, nationalities, players, player_stats):
        self.clubs = clubs
        self.nationalities = nationalities
        self.players = players
        self.player_stats = player_stats

    def preprocess_player_data(self):
        club_lookup = {club["clubId"]: club for club in self.clubs}
        nationality_lookup = {nat["countryId"]: nat for nat in self.nationalities}

        # Map players to their clubs and seasons
        player_clubs_lookup = {}
        for stat in self.player_stats:
            player_id, club_id, season_id = (
                stat["playerId"],
                stat["clubId"],
                stat["seasonId"],
            )
            if player_id not in player_clubs_lookup:
                player_clubs_lookup[player_id] = {}
            if club_id not in player_clubs_lookup[player_id]:
                player_clubs_lookup[player_id][club_id] = {
                    "club_info": club_lookup.get(club_id),
                    "seasons": [],
                }
            player_clubs_lookup[player_id][club_id]["seasons"].append(season_id)

        # Enrich players with club and nationality info
        for player in self.players:
            player_id = player["playerId"]

            if player_id in player_clubs_lookup:
                latest_season, current_club_id = 0, None
                for club_id, club_data in player_clubs_lookup[player_id].items():
                    max_season = max(club_data["seasons"])
                    if max_season > latest_season:
                        latest_season, current_club_id = max_season, club_id

                if current_club_id and club_lookup.get(current_club_id):
                    player["current_club"] = {
                        "clubId": current_club_id,
                        **club_lookup[current_club_id],
                    }

                player["club_history"] = [
                    {
                        "clubId": cid,
                        "clubName": cdata["club_info"]["clubName"],
                        "seasons": sorted(cdata["seasons"]),
                    }
                    for cid, cdata in player_clubs_lookup[player_id].items()
                    if cdata["club_info"]
                ]

            if player.get("nationalityISO"):
                nat_info = nationality_lookup.get(player["nationalityISO"])
                if nat_info:
                    player["nationality_details"] = nat_info

        return self.players

    def merge_player_with_stats(self, players):
        enriched_players = []
        for player in players:
            player_stats = [
                s for s in self.player_stats if s["playerId"] == player["playerId"]
            ]
            enriched_player = {
                **player,
                "season_statistics": player_stats,
                "total_seasons": len(player_stats),
                "career_goals": sum(stat.get("goals", 0) or 0 for stat in player_stats),
                "career_assists": sum(
                    stat.get("assists", 0) or 0 for stat in player_stats
                ),
            }
            enriched_players.append(enriched_player)
        return enriched_players

    def normalize_data_types(self, player):
        numeric_fields = ["heightCm", "weightKg", "shirtNumber", "totalAppearances"]
        for field in numeric_fields:
            if player.get(field) is not None:
                try:
                    player[field] = (
                        float(player[field]) if player[field] != "" else None
                    )
                except Exception:
                    player[field] = None

        if player.get("dateOfBirth"):
            birth_date = parse_date(player["dateOfBirth"])
            if birth_date:
                player["dateOfBirth"] = birth_date.isoformat()
                player["age"] = calculate_age(birth_date)
            else:
                player["dateOfBirth"], player["age"] = None, None

        return player

    def process_all_data(self):
        players = self.preprocess_player_data()
        enriched_players = self.merge_player_with_stats(players)
        final_players = [self.normalize_data_types(p) for p in enriched_players]
        return final_players


class PlayerDataProcessor:
    def __init__(self, model):
        self.model = model

    def build_player_profile(self, player_data):
        """create rich text profile for embedding"""

        # basic information
        basic_info = (
            f"{player_data['fullName']} is a {player_data['age']} year old\n"
            f" from {player_data['nationality']} and play at {player_data['position']} position"
        )

        # club information 
        club_info = f"Currently plays for {player_data['current_club']['clubName']}" 

        # physical attribute 
        physical = (
            f"Height: {player_data['heightCm']}cm, \n"
            f"Weight: {player_data['weightKg']}kg, \n"
            f"{player_data['preferredFoot']} footed"
        )
        stats = self.get_performance_summary(player_data['season_statistics']) # performance summary 
        style = self.extract_playing_style(player_data)   # playing style 
        
        return f"{basic_info}. {club_info}. {physical}. {stats} {style} {club_info}"
 
    def get_performance_summary(self, season_stats): 
        """generate performance summary from season statistics"""
        if not season_stats: 
            return "No performance data is available"
        
        # get last season stats(with data)
        total_stats = {
            'appearances': 0,
            'goals': 0,
            'assists': 0,
            'minutesPlayed': 0,
            'tackles': 0,
            'interceptions': 0,
            'dribblesCompleted': 0,
            'crossesCompleted': 0,
            'yellowCards': 0,
            'redCards': 0,
            'passesCompleted': 0,
            'touchesInBox': 0,
            'duelsWon': 0
        }
        valid_seasons = 0

        for stats in season_stats: 
            if any(stats.get(key) is not None for key in total_stats.keys()):
                valid_seasons += 1 

                for key in total_stats.keys(): 
                    value = stats.get(key, 0)
                    if value is not None: 
                        total_stats[key] += value
        if valid_seasons == 0: 
            return "Limited performance data" 
        
        # build performance summary from aggregated data 
        summary_parts = []
        if total_stats["appearances"] > 0: 
            summary_parts.append(f"Career: {int(total_stats['appearances'])} appearances")

        if total_stats["goals"] > 0: 
            summary_parts.append(f"{int(total_stats['goals'])} total goals")
        
        if total_stats['assists'] > 0:
            summary_parts.append(f"{int(total_stats['assists'])} total assists")

        # playing time 
        if total_stats['minutesPlayed'] > 0:
            summary_parts.append(f"{total_stats['minutesPlayed']} minutes played")

        if valid_seasons > 0:
            avg_goals = total_stats['goals'] / valid_seasons
            avg_assists = total_stats['assists'] / valid_seasons
            
            if avg_goals > 5:
                summary_parts.append(f"averages {avg_goals:.1f} goals per season")
            if avg_assists > 3:
                summary_parts.append(f"{avg_assists:.1f} assists per season")
        
        # defensive contribution 
        if total_stats['tackles'] > 0: 
            summary_parts.append(f"{int(total_stats['tackles'])} career tackles")
        if total_stats['interceptions'] > 0: 
            summary_parts.append(f"{int(total_stats['interceptions'])} interceptions")

        # technical skills 
        if total_stats['dribblesCompleted'] > 0:
            summary_parts.append(f"{int(total_stats['dribblesCompleted'])} successful dribbles")
        if total_stats['crossesCompleted'] > 0:
            summary_parts.append(f"{int(total_stats['crossesCompleted'])} accurate crosses")

        # rate-based stats (per game averages)
        if total_stats['appearances'] > 0:
            if total_stats['touchesInBox'] > 0:
                touches_per_game = total_stats['touchesInBox'] / total_stats['appearances']
                if touches_per_game > 10:  # Active in attack
                    summary_parts.append(f"active in penalty area")

        # discipline 
        if total_stats['yellowCards'] > 0:
            summary_parts.append(f"{int(total_stats['yellowCards'])} career yellow cards")
        if total_stats['redCards'] > 0:
            summary_parts.append(f"{int(total_stats['redCards'])} red cards")
        
        return ". ".join(summary_parts) if summary_parts else "limitied statistical"


    def aggregate_all_stats(self, season_stats):
        """aggregate statistics across all seasons"""
        if not season_stats:
            return {}
        
        aggregated = {
            'appearances': 0,
            'goals': 0,
            'assists': 0,
            'minutesPlayed': 0,
            'tackles': 0,
            'interceptions': 0,
            'dribblesCompleted': 0,
            'crossesCompleted': 0,
            'yellowCards': 0,
            'redCards': 0,
            'passesCompleted': 0,
            'touchesInBox': 0,
            'duelsWon': 0,
            'expectedGoals': 0,
            'expectedAssists': 0
        }
        valid_seasons = 0 
        for stats in season_stats: 
            # check if this season has any meaningful data 
            has_data = any(stats.get(key) is not None for key in aggregated.keys()) 
            if has_data: 
                valid_seasons += 1 

                # sum all numeric stats 
                for key in aggregated.keys(): 
                    value = stats.get(key)
                    if value is not None: 
                        aggregated[key] += value
        aggregated['total_seasons'] = valid_seasons
        return aggregated

    def extract_playing_style(self, player_data):
        """extract playing style keywords from stats"""
        career_stats = self.aggregate_all_stats(player_data['season_statistics'])

        if not career_stats or career_stats.get('total_seasons', 0) == 0:
            return ""
        
        style_keywords = []
        total_appearances = career_stats.get('appearances', 0)
        if total_appearances == 0:
            return ""
        
        # career-based style analysis 
        career_goals = career_stats.get('goals', 0)
        career_assists = career_stats.get('assists', 0)
        career_dribbles = career_stats.get('dribblesCompleted', 0)
        career_tackles = career_stats.get('tackles', 0)
        career_minutes = career_stats.get('minutesPlayed', 0)

        # goalscoring ability (career rate)
        goals_per_game = career_goals / total_appearances if total_appearances > 0 else 0
        if goals_per_game > 0.5:
            style_keywords.append("prolific goalscorer")
        elif goals_per_game > 0.2: 
            style_keywords.append("regular goalscorer")
        elif goals_per_game > 0.05:
            style_keywords.append("occasional goalscorer")

        # playmaking ability (career rate)
        assists_per_game = assists_per_game = career_assists / total_appearances if total_appearances > 0 else 0
        if assists_per_game > 0.3: 
            style_keywords.append("creative playmaker")
        elif assists_per_game > 0.1: 
            style_keywords.append("supportive playmaker")
        
        # dribbling ability (career total relative to games)
        dribbles_per_game = career_dribbles / total_appearances if total_appearances > 0 else 0
        if dribbles_per_game > 3: 
            style_keywords.append("skillful dribbler")
        elif dribbles_per_game > 1:
            style_keywords.append("technical player")
        
        # defensive contribution 
        tackles_per_game = career_tackles / total_appearances if total_appearances > 0 else 0
        if tackles_per_game > 2:
            style_keywords.append("strong defender")
        elif tackles_per_game > 1:
            style_keywords.append("defensive contributor")

        # work rate and consistency 
        if career_minutes > 1000: 
            minutes_per_game = career_minutes / total_appearances if total_appearances > 0 else 0
            if minutes_per_game > 70: 
                style_keywords.append("consistent starter")
            elif minutes_per_game > 30: 
                style_keywords.append("regular player")
            else: 
                style_keywords.append("squad player")
        
        # experience level 
        total_seasons = career_stats.get('total_seasons', 0)
        if total_seasons >= 5: 
            style_keywords.append("experienced player") 
        elif total_seasons >= 3: 
            style_keywords.append("established player")
        else: 
            style_keywords.append("developing player")

        return " ".join(style_keywords)
