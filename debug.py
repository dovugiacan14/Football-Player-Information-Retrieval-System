import json
from src import HybridPlayerSearch, PlayerEmbeddingEngine

def load_players(file_path: str = "summary_player_info.json"):
    """Load player data from JSON file"""
    with open(file_path, "r", encoding="utf-8") as f:
        players_data = json.load(f)
    print(f"Loaded {len(players_data)} players")
    return players_data


def init_search_engine(players_data):
    """Initialize embedding and hybrid search engines"""
    embedding_engine = PlayerEmbeddingEngine("all-MiniLM-L6-v2")
    print("🔄 Building embedding index...")
    embedding_engine.build_index(players_data)

    search_engine = HybridPlayerSearch(embedding_engine)
    print("🔄 Building TF-IDF index...")
    search_engine.build_tfidf_index(players_data)

    print("✅ Search engines initialized successfully!")
    return search_engine


def search_players(search_engine, query: str, top_k: int = 10, search_type: str = "hybrid"):
    """Perform search (hybrid or semantic)"""
    if not search_engine:
        raise RuntimeError("Search engine not initialized")

    if search_type == "hybrid":
        results = search_engine.hybrid_search(query, top_k)
    elif search_type == "semantic":
        results = search_engine.embedding_engine.search(query, top_k)
    else:
        raise ValueError("Invalid search type. Use 'hybrid' or 'semantic'")

    print(f"🔍 Query: {query}")
    print(f"Search type: {search_type}")
    print(f"Total results: {len(results)}")
    return results


def get_player_details(search_engine, player_id: str):
    """Fetch player details by ID"""
    if not search_engine:
        raise RuntimeError("❌ Search engine not initialized")

    metadata = search_engine.embedding_engine.player_metadata
    if player_id in metadata:
        return metadata[player_id]
    else:
        raise KeyError(f"Player with ID '{player_id}' not found")


if __name__ == "__main__":
    # Debug flow step by step
    players = load_players("summary_player_info.json")
    engine = init_search_engine(players)

    # Example search
    results = search_players(engine, "Brazilian striker good at dribbling", top_k=10, search_type="hybrid")
    with open("mockup_data.json", "w", encoding="utf-8") as file:
        json.dump(results, file, ensure_ascii=False, indent=4)

    print("Search Results:")
    for r in results:
        print(r)

    # Example get details
    try:
        player_info = get_player_details(engine, "player_001")
        print("Player Info:", player_info)
    except KeyError as e:
        print(e)
