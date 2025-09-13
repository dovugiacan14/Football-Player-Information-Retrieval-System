# ⚽ Football Player Information Retrieval System

A semantic search and information retrieval system for football player data using RDF/SPARQL and natural language processing.

## Features

- **Semantic Search**: Query football player information using natural language
- **RDF/SPARQL Integration**: Leverages semantic web technologies for structured data
- **Hybrid Search**: Combines keyword-based and semantic similarity search
- **REST API**: Flask-based API for easy integration
- **Web Interface**: Interactive UI for searching and viewing player information

## Tech Stack

- **Backend**: Python, Flask
- **Semantic Web**: RDFlib, SPARQL
- **NLP**: spaCy, Sentence Transformers
- **Vector Search**: FAISS, scikit-learn
- **Frontend**: HTML, CSS, JavaScript

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Football-Player-Information-Retrieval-System.git
cd Football-Player-Information-Retrieval-System
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Download spaCy language model:
```bash
python -m spacy download en_core_web_sm
```

## Project Structure

```
Football-Player-Information-Retrieval-System/
│
├── frontend/              # Web interface
│   ├── index.html        # Main UI
│   ├── style.css         # Styling
│   └── script.js         # Frontend logic
│
├── src/                  # Backend source code
│   └── (backend modules)
│
├── raw_data/             # Raw data files
│   └── (data files)
│
├── assets/               # Static assets
│
└── requirements.txt      # Python dependencies
```

## Usage

1. Start the application:
```bash
python manage.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Enter natural language queries like:
- "Show me strikers from Brazil"
- "Players who played for Barcelona"
- "Top scorers in Premier League"
- "Defenders born after 1995"

## API Endpoints

### Search Endpoint
```
POST /api/search
Content-Type: application/json

{
  "query": "your search query",
  "method": "hybrid" | "sparql" | "semantic"
}
```

### Player Details
```
GET /api/player/{player_id}
```

## Configuration

Create a `.env` file in the root directory:
```env
FLASK_PORT=5000
FLASK_DEBUG=True
SPARQL_ENDPOINT=http://localhost:3030/football
```

## Development

Run tests:
```bash
pytest tests/
```

Format code:
```bash
black .
```

Lint code:
```bash
flake8 .
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Football player data sourced from public datasets
- Built as part of CS2037 Ontology Technology course
- Inspired by semantic web best practices
