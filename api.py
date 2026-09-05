from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os

app = FastAPI(title="Spotify Hit Predictor API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    duration_ms: int = 200000
    danceability: float
    energy: float
    key: int = 5
    loudness: float = -10.0
    mode: int = 1
    speechiness: float
    acousticness: float
    instrumentalness: float = 0.0
    liveness: float = 0.1
    valence: float
    tempo: float
    time_signature: int = 4
    explicit: int = 0
    genre_encoded: float = None
    artist_encoded: float = None
    
    # Optional raw values in case we want the API to encode them
    genre_name: str = None
    artist_name: str = None

# Global variables to store models and encoders
model = None
global_mean = 50.0
genre_means = {}
artist_means = {}

@app.on_event("startup")
def load_resources():
    global model, global_mean, genre_means, artist_means
    
    # Load model
    model_path = os.path.join("models", "modelo_rf.pkl")
    if os.path.exists(model_path):
        model = joblib.load(model_path)
    else:
        print("Warning: Model not found at models/modelo_rf.pkl")
        
    # Load encoders
    data_path = os.path.join("data", "dataset.csv")
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        global_mean = df['popularity'].mean()
        genre_means = df.groupby('track_genre')['popularity'].mean().to_dict()
        artist_means = df.groupby('artists')['popularity'].mean().to_dict()
        print("Encoders loaded successfully.")
    else:
        print("Warning: dataset.csv not found, using default means.")

@app.post("/predict")
def predict(req: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Modelo não carregado.")
        
    # Calculate encoded values if not provided
    g_encoded = req.genre_encoded
    a_encoded = req.artist_encoded
    
    if g_encoded is None and req.genre_name:
        g_encoded = genre_means.get(req.genre_name, global_mean)
    elif g_encoded is None:
        g_encoded = global_mean
        
    if a_encoded is None and req.artist_name:
        a_encoded = artist_means.get(req.artist_name, global_mean)
    elif a_encoded is None:
        a_encoded = global_mean

    # Prepare input dataframe
    input_data = pd.DataFrame({
        'duration_ms': [req.duration_ms],
        'danceability': [req.danceability],
        'energy': [req.energy],
        'key': [req.key],
        'loudness': [req.loudness],
        'mode': [req.mode],
        'speechiness': [req.speechiness],
        'acousticness': [req.acousticness],
        'instrumentalness': [req.instrumentalness],
        'liveness': [req.liveness],
        'valence': [req.valence],
        'tempo': [req.tempo],
        'time_signature': [req.time_signature],
        'explicit': [req.explicit],
        'genre_encoded': [g_encoded],
        'artist_encoded': [a_encoded]
    })
    
    try:
        prediction = model.predict(input_data)[0]
        prediction_clamped = max(0, min(100, prediction))
        
        return {
            "popularity": float(prediction_clamped),
            "inputs_used": input_data.to_dict(orient="records")[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}
