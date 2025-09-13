import json
import uvicorn
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src import HybridPlayerSearch, PlayerEmbeddingEngine

app = FastAPI(title="Football Player Semantic Search")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

search_engine = None


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    search_type: str = "hybrid"


@app.on_event("startup")
async def startup_event():
    global search_engine

    try:
        # Load data
        with open('summary_player_info.json', 'r', encoding='utf-8') as f:
            players_data = json.load(f)

        print(f"✅ Loaded {len(players_data)} players")

        # Initialize search engines
        embedding_engine = PlayerEmbeddingEngine("all-MiniLM-L6-v2")
        print("🔄 Building embedding index...")
        embedding_engine.build_index(players_data)

        search_engine = HybridPlayerSearch(embedding_engine)
        print("🔄 Building TF-IDF index...")
        search_engine.build_tfidf_index(players_data)

        print("✅ Search engines initialized successfully!")

    except Exception as e:
        print(f"❌ Error during startup: {e}")
        raise


@app.get("/")
async def root():
    return {
        "message": "Football Player Semantic Search API",
        "version": "1.0.0",
        "endpoints": {
            "search": "/search (POST)",
            "player_details": "/player/{player_id} (GET)",
            "health": "/health (GET)"
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "search_engine_ready": search_engine is not None,
        "total_players": len(search_engine.embedding_engine.player_metadata) if search_engine else 0
    }


@app.post("/search")
async def search_players(request: SearchRequest):
    try:
        if not search_engine:
            raise HTTPException(status_code=503, detail="Search engine not initialized")

        if request.search_type == "hybrid":
            results = search_engine.hybrid_search(request.query, request.top_k)
        elif request.search_type == "semantic":
            results = search_engine.embedding_engine.search(request.query, request.top_k)
        else:
            raise HTTPException(status_code=400, detail="Invalid search type. Use 'hybrid' or 'semantic'")

        return {
            "query": request.query,
            "search_type": request.search_type,
            "total_results": len(results),
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.get("/player/{player_id}")
async def get_player_details(player_id: str):
    try:
        if not search_engine:
            raise HTTPException(status_code=503, detail="Search engine not initialized")

        if player_id in search_engine.embedding_engine.player_metadata:
            return search_engine.embedding_engine.player_metadata[player_id]
        else:
            raise HTTPException(status_code=404, detail=f"Player with ID '{player_id}' not found")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Player fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch player: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
