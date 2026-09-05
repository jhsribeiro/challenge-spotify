# 🎵 Spotify Popularity Prediction Engine

> **Motor de Predição de Popularidade Musical com Machine Learning** desenvolvido a partir do Spotify Dataset (114.000 faixas musicais em 114 gêneros).

---

## Visão Geral do Projeto

Este projeto investiga os fatores determinantes para o sucesso e alcance de faixas musicais no ecossistema do Spotify. Utilizando técnicas avançadas de Engenharia de Features (*Target Encoding* com validação cruzada *Out-of-Fold* para mitigar *Data Leakage*) e modelos de Machine Learning (Random Forest, XGBoost, LightGBM e Regressão Linear), o motor estima o índice de popularidade de faixas musicais (0 a 100).

### Principais Descobertas
- **O peso do artista e gênero:** A análise de importância das variáveis (*Feature Importance*) revelou que o prestígio e tração histórica do artista e gênero concentram a maior fatia do poder preditivo (~65% combinados), enquanto as variáveis acústicas (dançabilidade, energia, volume, etc.) desempenham papel secundário e modulador.
- **Melhor Modelo:** O **Random Forest Regressor** apresentou a melhor performance global:
  - **$R^2$ (Poder de Explicação):** ~64,24%
  - **MAE (Erro Médio Absoluto):** ~8,06 pontos (escala de 0 a 100)
  - **RMSE (Raiz do Erro Quadrático):** ~13,39 pontos

---

## Estrutura do Diretório

A organização do repositório segue as melhores práticas de projetos de Data Science e Machine Learning:

```text
spotify-popularity-prediction/
│
├── data/                               # Dados tabulares do projeto
│   └── dataset.csv                     # Base de dados original (114k faixas do Spotify)
│
├── frontend/                           # Aplicação web React/Vite
│   ├── public/                         # Assets estáticos
│   ├── src/                            # Código fonte da interface
│   └── package.json                    # Dependências NPM
│
├── models/                             # Modelos serializados e checkpoints
│   ├── .gitkeep                        # Controle de versão do diretório
│   └── modelo_rf.pkl                   # Modelo Random Forest (gerenciado via Git LFS)
│
├── notebooks/                          # Jupyter Notebooks de experimentação e modelagem
│   ├── spotify_popularity_prediction.ipynb   # Pipeline completo de EDA, validação e treino detalhado
│   └── spotify_model_benchmark.ipynb         # Benchmark comparativo direto de todos os algoritmos
│
├── reports/                            # Documentação analítica e relatórios
│   ├── Relatorio_Tecnico.md            # Relatório técnico do projeto em Markdown
│   ├── Relatorio_Tecnico.pdf           # Relatório técnico exportado em PDF
│   └── plots/                          # Gráficos e visualizações exportadas
│       ├── correlation_matrix.png
│       ├── feature_importance.png
│       ├── residuals_plot.png
│       └── target_distribution.png
│
├── .gitattributes                      # Configuração do Git LFS
├── .gitignore                          # Regras de exclusão do Git
├── api.py                              # Backend API (FastAPI)
├── app.py                              # Dashboard analítico (Streamlit)
├── LICENSE                             # Licença do projeto
├── README.md                           # Documentação principal do projeto
└── requirements.txt                    # Dependências do projeto (Python)
```

> **Nota sobre o modelo treinado:** O artefato serializado do modelo (`modelo_rf.pkl`) é versionado no repositório utilizando **Git Large File Storage (Git LFS)** após compressão do arquivo, permitindo o versionamento e download de arquivos pesados diretamente pelo GitHub.

---

## Como Executar o Projeto

### 1. Pré-requisitos
* **Python 3.9+**
* **Git Large File Storage (Git LFS)**: Para clonar o repositório e obter o arquivo do modelo treinado (`models/modelo_rf.pkl`), é **obrigatório ter o Git LFS instalado** no seu sistema antes da clonagem.
  * [Download oficial do Git LFS](https://git-lfs.com/)
  * Comandos de instalação rápida:
    * **Windows:** Baixe o instalador no site oficial ou use `winget install GitHub.GitLFS`
    * **Linux (Ubuntu/Debian):** `sudo apt install git-lfs`
    * **macOS:** `brew install git-lfs`
  * Após a instalação, inicialize o LFS no seu terminal (necessário apenas uma vez):
    ```bash
    git lfs install
    ```

### 2. Clonagem do Repositório e Download dos Arquivos (Git LFS)
> **Importante:** Se você clonar o projeto sem o Git LFS instalado, o arquivo `modelo_rf.pkl` será baixado apenas como um ponteiro de texto de ~130 bytes e não como o binário real do modelo (~115 MB), causando erro ao tentar carregá-lo no Python.

Com o Git LFS pronto, clone o repositório e baixe o modelo:

```bash
# 1. Clone o repositório
git clone https://github.com/jhsribeiro/spotify-popularity-prediction.git
cd spotify-popularity-prediction

# 2. Garanta o download do arquivo do modelo via LFS
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

## Modelos Comparados

| Modelo | MAE (Erro Médio) | RMSE | $R^2$ (Poder de Explicação) | $R^2$ (%) |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest Regressor** | **8.06** | **13.39** | **0.6424** | **64.24%** |
| **XGBoost (Boosting)** | 8.63 | 13.78 | 0.6213 | 62.13% |
| **LightGBM (Boosting)** | 8.70 | 13.84 | 0.6179 | 61.79% |
| **Árvore de Decisão** | 8.80 | 14.42 | 0.5848 | 58.48% |
| **Regressão Linear (Baseline)** | 9.69 | 14.62 | 0.5737 | 57.37% |

Para detalhes completos de engenharia de atributos (Target Encoding e K-Fold), justificativa dos modelos e respostas às perguntas norteadoras, consulte o [Relatório Técnico](reports/Relatorio_Tecnico.md).

---

## Desenvolvedores

* **Jhiovana Ribeiro**
* **Cauan Soares**
* **Larissa Giffoni**
* **Marcos Bittar**
* **Pedro Henrique de Sousa**

