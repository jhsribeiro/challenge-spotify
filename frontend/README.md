# HitLab

Protótipo de site para prever se uma música tem potencial de hit com base em perguntas simples, usando métricas inspiradas no `Spotify Tracks Dataset` do Kaggle.

## Como o projeto está organizado

- `src/HitLabApp.jsx`: SPA principal inteira em um único arquivo JSX.
- `public/data/model-artifacts.json`: artefato consumido pelo frontend.
- `scripts/build_artifacts.py`: gera o artefato real a partir do CSV do Kaggle.
- `spotify_popularity_prediction.ipynb`: notebook original com preparação dos dados e métricas dos modelos.

## Relação com o notebook

O notebook prepara o dataset, usa `track_genre` e `artists` para gerar `genre_encoded` e `artist_encoded` e mede desempenho de Random Forest, XGBoost e LightGBM.

O site reaproveita essa mesma estrutura conceitual:

- faz perguntas que viram `danceability`, `energy`, `valence`, `acousticness`, `instrumentalness`, `speechiness`, `liveness` e `tempo`
- usa opções de gênero e artista de referência para aproximar `genre_encoded` e `artist_encoded`
- estima a popularidade pela proximidade com músicas exportadas do dataset
- retorna 3 músicas populares similares
- mostra capa das recomendações usando `cover_url` quando existir no artefato e gera uma capa visual quando o CSV não trouxer imagem

## Como usar com dados reais

1. Baixe o dataset do Kaggle e salve como `data/dataset.csv`.
2. Gere o artefato:

```bash
python3 scripts/build_artifacts.py
```

3. Instale as dependências do frontend:

```bash
npm install
```

4. Rode localmente:

```bash
npm run dev
```

5. Gere a versão de produção:

```bash
npm run build
```

O build final fica em `dist/`.

## Hospedagem gratuita e simples

A opção mais simples é hospedagem estática, porque o site não precisa de backend pago.

### Netlify

1. Rode `npm run build`
2. Entre no Netlify
3. Faça upload da pasta `dist`

### Vercel

1. Suba o repositório para o GitHub
2. Importe o projeto na Vercel
3. Comando de build: `npm run build`
4. Diretório de saída: `dist`

### GitHub Pages

1. Rode `npm run build`
2. Publique a pasta `dist` em GitHub Pages

## Observação importante

O repositório já inclui um `model-artifacts.json` de demonstração para o site abrir mesmo sem o CSV real. Assim que você rodar `scripts/build_artifacts.py`, o frontend passa a usar o artefato real exportado do seu dataset.
