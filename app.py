import streamlit as st
import pandas as pd
import numpy as np
import joblib
import os

# Configuração da página
st.set_page_config(page_title="Preditor de Popularidade - Spotify", page_icon="🎵", layout="wide")

st.title("🎵 Motor de Predição: Popularidade no Spotify")
st.markdown("Selecione o Artista e as características da música abaixo para prever a sua popularidade.")

@st.cache_resource
def load_model():
    model_path = os.path.join("models", "modelo_rf.pkl")
    if os.path.exists(model_path):
        return joblib.load(model_path)
    else:
        return None

@st.cache_data
def load_encoders():
    # Procura o dataset para calcular as médias reais do Target Encoding
    data_path = os.path.join("data", "dataset.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join("..", "data", "dataset.csv")
        
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        # Calcula a média global de popularidade
        global_mean = df['popularity'].mean()
        
        # Cria os dicionários de mapeamento (Nome -> Média de Popularidade)
        genre_means = df.groupby('track_genre')['popularity'].mean().to_dict()
        artist_means = df.groupby('artists')['popularity'].mean().to_dict()
        
        unique_artists = sorted(df['artists'].dropna().unique().tolist())
        unique_genres = sorted(df['track_genre'].dropna().unique().tolist())
        
        return global_mean, genre_means, artist_means, unique_artists, unique_genres
    else:
        # Fallback caso o dataset não seja encontrado
        return 50.0, {}, {}, ["Coldplay", "Ed Sheeran", "Anitta"], ["pop", "rock", "acoustic"]

model = load_model()
global_mean, genre_means, artist_means, unique_artists, unique_genres = load_encoders()

if model is None:
    st.error("⚠️ Modelo não encontrado! Certifique-se de que o arquivo 'modelo_rf.pkl' existe dentro da pasta 'models/'.")
    st.stop()

# Layout com 3 colunas
col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("Informações Básicas")
    # Agora o usuário escolhe o nome do Artista e Gênero, e nós traduzimos para o modelo!
    selected_artist = st.selectbox("Artista(s)", unique_artists, index=unique_artists.index("Coldplay") if "Coldplay" in unique_artists else 0)
    selected_genre = st.selectbox("Gênero Musical", unique_genres, index=unique_genres.index("pop") if "pop" in unique_genres else 0)
    
    explicit = st.checkbox("Música Explícita (Explicit)?", False)
    duration_ms = st.number_input("Duração (ms)", min_value=0, max_value=600000, value=200000, help="Duração total da música em milissegundos.")
    key = st.slider("Key (Tonalidade)", 0, 11, 5, help="Tonalidade principal (0 = Dó, 1 = Dó sustenido, 2 = Ré, etc.)")
    mode = st.radio("Modo da Escala (Mode)", options=[0, 1], format_func=lambda x: "Minor (0) - Mais triste/tensa" if x == 0 else "Major (1) - Mais alegre/positiva", help="O tipo de escala (maior ou menor). Músicas em escalas Maiores tendem a soar mais felizes e brilhantes, enquanto Menores soam mais melancólicas e sombrias.")

with col2:
    st.subheader("Características Rítmicas")
    tempo = st.number_input("Tempo (BPM)", min_value=0.0, max_value=250.0, value=120.0, help="Velocidade ou ritmo da faixa em batidas por minuto (BPM).")
    time_signature = st.slider("Fórmula de Compasso (Time Signature)", 1, 5, 4, help="Quantos tempos há em um compasso (ex: 4/4 é o mais comum, representado por 4).")
    danceability = st.slider("Danceability (Dançabilidade)", 0.0, 1.0, 0.5, help="Adequação da faixa para dançar (0.0 é menos dançante, 1.0 é extremamente dançante).")
    energy = st.slider("Energy (Energia)", 0.0, 1.0, 0.5, help="Intensidade e atividade. Faixas com 1.0 são muito rápidas, altas e barulhentas.")
    loudness = st.slider("Loudness (Volume em dB)", -60.0, 0.0, -10.0, help="Volume médio da faixa em decibéis. Valores próximos de 0 dB são mais altos.")

with col3:
    st.subheader("Atributos Acústicos")
    speechiness = st.slider("Speechiness (Vocalidade)", 0.0, 1.0, 0.1, help="Presença de palavras faladas. Valores perto de 1.0 representam podcasts ou poesias. Músicas normais ficam abaixo de 0.33.")
    acousticness = st.slider("Acousticness (Acústica)", 0.0, 1.0, 0.2, help="Probabilidade de a música ser puramente acústica (sem instrumentos elétricos/eletrônicos).")
    instrumentalness = st.slider("Instrumentalness (Instrumental)", 0.0, 1.0, 0.0, help="Probabilidade de não conter vocais cantados. 1.0 = faixa totalmente instrumental.")
    liveness = st.slider("Liveness (Presença de Público)", 0.0, 1.0, 0.1, help="Probabilidade de a gravação ter sido feita ao vivo com plateia.")
    valence = st.slider("Valence (Positividade)", 0.0, 1.0, 0.5, help="O humor da faixa. Valores altos (1.0) soam felizes, eufóricos e positivos. Valores baixos (0.0) soam tristes ou depressivos.")

st.markdown("---")

if st.button("🚀 Prever Popularidade", use_container_width=True):
    # Traduzindo o nome escolhido para a métrica que o modelo entende (Target Encoding)
    artist_encoded = artist_means.get(selected_artist, global_mean)
    genre_encoded = genre_means.get(selected_genre, global_mean)
    
    # O modelo exportado espera as exatas colunas numéricas
    input_data = pd.DataFrame({
        'duration_ms': [duration_ms],
        'danceability': [danceability],
        'energy': [energy],
        'key': [key],
        'loudness': [loudness],
        'mode': [mode],
        'speechiness': [speechiness],
        'acousticness': [acousticness],
        'instrumentalness': [instrumentalness],
        'liveness': [liveness],
        'valence': [valence],
        'tempo': [tempo],
        'time_signature': [time_signature],
        'explicit': [int(explicit)],
        'genre_encoded': [genre_encoded],
        'artist_encoded': [artist_encoded]
    })
    
    try:
        prediction = model.predict(input_data)[0]
        prediction = max(0, min(100, prediction))
        
        st.success(f"### 🎉 A popularidade prevista é: **{prediction:.1f}** / 100")
        st.progress(int(prediction))
        
        with st.expander("Ver dados processados (O que o modelo enxergou)"):
            st.write(f"**{selected_artist}** foi traduzido para um peso histórico de **{artist_encoded:.2f}**")
            st.write(f"O gênero **{selected_genre}** foi traduzido para um peso de **{genre_encoded:.2f}**")
            st.dataframe(input_data)
            
    except Exception as e:
        st.error(f"Ocorreu um erro ao fazer a predição. Verifique os dados. Detalhe: {e}")
