import faiss 
import numpy as np 
from src.preprocessing import PlayerDataProcessor
from sentence_transformers import SentenceTransformer

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class PlayerEmbeddingEngine:
    def __init__(self, model_name): 
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.index = None 
        self.player_metadata = {}

    def build_index(self, players_data):
        """Build FAISS index from play profiles"""

        # build player profiles 
        profiles = []
        player_ids = []

        processor = PlayerDataProcessor()
        for player in players_data: 
            player_id = player.get('playerId', '')
            profile_text = processor.build_player_profile(player)
            profiles.append(profile_text)
            player_ids.append(player_id)

            # store metadata for retrieval 
            self.player_metadata[player_id] = player

        # create embeddings 
        embeddings = self.model.encode(profiles, show_progress_bar=True)
        embeddings = np.array(embeddings).astype('float32')

        # build FAISS index (using HNSW for better recall)
        self.index = faiss.IndexHNSWFlat(self.dimension, 32)
        self.index.hnsw.efConstruction = 200
        self.index.add(embeddings)
        self.player_ids = player_ids   # store player IDs mapping

        return self.index

    def search(self, query, top_k=5): 
        """Semantic search for players"""
        if not self.index: 
            raise ValueError("Index not built yet")
        
        # embedding query 
        query_embedding = self.model.encode([query]).astype('float32')

        # search 
        scores, indicies = self.index.search(query_embedding, top_k)

        # prepare results 
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indicies[0])):
            if idx != -1: 
                player_id = self.player_ids[idx]
                player_data = self.player_metadata[player_id]

                results.append({
                    'rank': i + 1, 
                    'player_id': player_id, 
                    'similarity_score': float(score), 
                    'player_data': player_data
                })
        return results
    

class HybridPlayerSearch: 
    def __init__(self, embedding_engine):
        self.embedding_engine = embedding_engine
        self.tfidf_vectorizer = None 
        self.tfidf_matrix = None 
        self.profiles = []

    def build_tfidf_index(self, players_data): 
        """Build TF-IDF index for keyword search"""
        processor = PlayerDataProcessor()
        self.profiles = []
        for player in players_data: 
            profile = processor.build_player_profile(player)
            self.profiles.append(profile)

        # build TF-IDF vectorizer 
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,        # only keep 5000 important features 
            stop_words='english',      # remove stop words like: the, is, and, in, ...
            ngram_range=(1, 2),       # get unigram (one word) and bigram
            max_df=0.8,                 # remove words that appear more than 80% in document 
            min_df=2                   
        )
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.profiles)  # train

    def hybrid_search(self, query, top_k=10, alpha=0.7):
        """
        Combine semantic - TF-IDF search 
        alpha: weight for semantic search (70% semantic)
        """
        # semantic search 
        semantic_results = self.embedding_engine.search(query, top_k)

        # TF-IDF search 
        query_vector = self.tfidf_vectorizer.transform([query])
        tfidf_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        # combine semantic scores with TF-IDF scores 
        final_scores = {}
        for result in semantic_results:
            player_id = result['player_id']
            semantic_score = 1 / (1 + result['similarity_score'])
            final_scores[player_id] = alpha * semantic_score

        for idx, tfidf_score in enumerate(tfidf_scores):
            player_id = self.embedding_engine.player_ids[idx]
            if player_id in final_scores:
                final_scores[player_id] += (1 - alpha) * tfidf_score 
            else: 
                final_scores[player_id] = (1 - alpha) * tfidf_score 

        # Re-rank and return top results 
        sorted_players = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        results = []
        for rank, (player_id, score) in enumerate(sorted_players): 
            player_data = self.embedding_engine.player_metadata[player_id]
            results.append({
                'rank': rank + 1, 
                'player_id': player_id, 
                'combined_score': score, 
                'player_data': player_data
            })
        return results
    