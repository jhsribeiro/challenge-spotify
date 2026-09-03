# 🎵 Spotify Popularity Prediction Engine

> **Motor de Predição de Popularidade Musical com Machine Learning** desenvolvido a partir do Spotify Dataset (114.000 faixas musicais em 114 gêneros).

---

## 📌 Visão Geral do Projeto

Este projeto investiga os fatores determinantes para o sucesso e alcance de faixas musicais no ecossistema do Spotify. Utilizando técnicas avançadas de Engenharia de Features (*Target Encoding* com validação cruzada *Out-of-Fold* para mitigar *Data Leakage*) e modelos de Machine Learning (Random Forest, XGBoost, LightGBM e Regressão Linear), o motor estima o índice de popularidade de faixas musicais (0 a 100).

### 🎯 Principais Descobertas
- **O peso do artista e gênero:** A análise de importância das variáveis (*Feature Importance*) revelou que o prestígio e tração histórica do artista e gênero concentram a maior fatia do poder preditivo (~65% combinados), enquanto as variáveis acústicas (dançabilidade, energia, volume, etc.) desempenham papel secundário e modulador.
- **Melhor Modelo:** O **Random Forest Regressor** apresentou a melhor performance global:
  - **$R^2$ (Poder de Explicação):** ~64,24%
  - **MAE (Erro Médio Absoluto):** ~8,06 pontos (escala de 0 a 100)
  - **RMSE (Raiz do Erro Quadrático):** ~13,39 pontos

---

## 📁 Estrutura do Diretório

A organização do repositório segue as melhores práticas de projetos de Data Science e Machine Learning:

```text
challenge-spotify/
│
├── data/                               # Dados tabulares do projeto
│   └── dataset.csv                     # Base de dados original (114k faixas do Spotify)
│
├── notebooks/                          # Jupyter Notebooks de experimentação e modelagem
│   ├── spotify_popularity_prediction.ipynb   # Pipeline completo de EDA, validação e treino detalhado
│   └── spotify_model_benchmark.ipynb         # Benchmark comparativo direto de todos os algoritmos
│
├── models/                             # Modelos serializados e checkpoints
│   ├── .gitkeep                        # Controle de versão do diretório
│   └── modelo_rf.pkl                   # Modelo Random Forest (gerenciado via Git LFS)
│
├── reports/                            # Documentação analítica e relatórios
│   └── Relatorio_Tecnico.md            # Relatório técnico do projeto
│
├── .gitignore                          # Regras de exclusão do Git (ignora caches, checkpoints, etc.)
└── README.md                           # Documentação principal do projeto
```

> **Nota sobre o modelo treinado:** O artefato serializado do modelo (`modelo_rf.pkl`) é versionado no repositório utilizando **Git Large File Storage (Git LFS)** após compressão do arquivo, permitindo o versionamento e download de arquivos pesados diretamente pelo GitHub.

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
Certifique-se de possuir Python 3.9+ e o [Git LFS](https://git-lfs.github.com/) instalados em sua máquina.

### 2. Clonagem e Download dos Modelos (Git LFS)
Ao clonar o repositório, utilize o Git LFS para baixar o arquivo do modelo serializado:

```bash
git clone https://github.com/jhsribeiro/challenge-spotify.git
cd challenge-spotify
git lfs pull
```

### 3. Instalação das Dependências
Instale as bibliotecas necessárias para executar a análise e os modelos:

```bash
pip install pandas numpy scikit-learn xgboost lightgbm jupyter matplotlib seaborn
```

### 4. Execução dos Jupyter Notebooks
Inicie o Jupyter Notebook ou abra diretamente no VS Code:

* **Pipeline Completo com EDA e Validação:**
  ```bash
  jupyter notebook notebooks/spotify_popularity_prediction.ipynb
  ```

* **Benchmark Comparativo dos Modelos:**
  ```bash
  jupyter notebook notebooks/spotify_model_benchmark.ipynb
  ```

Os notebooks estão configurados de forma resiliente para localizar automaticamente o dataset em `data/dataset.csv`.

---

## 📊 Modelos Comparados

| Modelo | MAE (Erro Médio) | RMSE | $R^2$ (Poder de Explicação) | $R^2$ (%) |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest Regressor** | **8.06** | **13.39** | **0.6424** | **64.24%** |
| **XGBoost (Boosting)** | 8.63 | 13.78 | 0.6213 | 62.13% |
| **LightGBM (Boosting)** | 8.70 | 13.84 | 0.6179 | 61.79% |
| **Árvore de Decisão** | 8.80 | 14.42 | 0.5848 | 58.48% |
| **Regressão Linear (Baseline)** | 9.69 | 14.62 | 0.5737 | 57.37% |

Para detalhes completos de engenharia de atributos (Target Encoding e K-Fold), justificativa dos modelos e respostas às perguntas norteadoras, consulte o [Relatório Técnico](reports/Relatorio_Tecnico.md).
