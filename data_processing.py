from src.utils import load_json, save_json 
from src.preprocessing import PreProcessing


if __name__ == "__main__": 
    # load raw data files 
    clubs = load_json("raw_data/clubs.json")
    nationalities = load_json("raw_data/nationalities.json")
    players = load_json("raw_data/players.json")
    player_stats = load_json("raw_data/player_season_stats.json")

    # run processing pipeline
    processor = PreProcessing(clubs, nationalities, players, player_stats)
    processed_players = processor.process_all_data()

    # save final results
    save_json(processed_players, "summary_player_info.json")
    