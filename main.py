import json 
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException 
from src import HybridPlayerSearch, PlayerEmbeddingEngine


app = FastAPI(title= "Football Player Semantic Search")

search_engine = None 

class SearchRequest(BaseModel):
    query: str 
    top_k: int = 10 
    search_type: str = "hybrid"


@app.on_event("startup")
async def startup_event():
    global search_engine
    
    # Load data
    with open('summary_player_info.json', 'r', encoding='utf-8') as f:
        players_data = json.load(f)
    
    # Initialize search engines
    embedding_engine = PlayerEmbeddingEngine("all-MiniLM-L6-v2")
    embedding_engine.build_index(players_data)
    
    search_engine = HybridPlayerSearch(embedding_engine)
    search_engine.build_tfidf_index(players_data)
    
    print("Search engines initialized!")

@app.post("/search")
async def search_players(request: SearchRequest):
    try: 
        if request.search_type == "hybrid":
            results = search_engine.hybrid_search(request.query, request.top_k)
        elif request.search_type == "semantic": 
            results = search_engine.embedding_engine.search(request.query, request.top_k)
        else: 
            raise HTTPException(status_code= 400, detail= "Invalid search type")

        return {
            "query": request.query,
            "total_results": len(results),
            "results": results
        }
    except Exception as e: 
        raise HTTPException(status_code= 500, detail= str(e))

@app.get("/player/{player_id}")
async def get_player_details(player_id: str):
    if player_id in search_engine.embedding_engine.player_metadata:
        return search_engine.embedding_engine.player_metadata[player_id]
    else:
        raise HTTPException(status_code=404, detail="Player not found")
    