import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  Database,
  Disc3,
  Gauge,
  LineChart,
  Menu,
  Mic2,
  Music2,
  Play,
  ShieldCheck,
  Sparkles,
  Waves,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'landing', label: 'Início' },
  { id: 'explore', label: 'Explorar Dados' },
  { id: 'about', label: 'Sobre o Modelo' },
];

const FEATURE_KEYS = [
  'danceability',
  'energy',
  'valence',
  'acousticness',
  'instrumentalness',
  'speechiness',
  'liveness',
  'tempo',
  'genre_encoded',
  'artist_encoded',
];

const FEATURE_WEIGHTS = {
  danceability: 1.25,
  energy: 1.25,
  valence: 1.0,
  acousticness: 0.9,
  instrumentalness: 0.8,
  speechiness: 0.8,
  liveness: 0.55,
  tempo: 1.0,
  genre_encoded: 0.75,
  artist_encoded: 0.75,
};

const BASE_QUESTIONS = [
  {
    id: 'energy',
    title: 'Como você descreveria a energia da música?',
    subtitle: 'Pense em intensidade, impacto e sensação geral da faixa.',
    kind: 'choices',
    options: [
      { label: 'Calma', value: 0.28, note: 'Suave e relaxante' },
      { label: 'Moderada', value: 0.52, note: 'Equilibrada e estável' },
      { label: 'Animada', value: 0.78, note: 'Boa pressão rítmica' },
      { label: 'Intensa', value: 0.93, note: 'Alta potência sonora' },
    ],
  },
  {
    id: 'danceability',
    title: 'Essa música faria alguém querer dançar?',
    subtitle: 'O objetivo é estimar groove, constância e apelo rítmico.',
    kind: 'choices',
    options: [
      { label: 'Pouco provável', value: 0.24, note: 'Mais contemplativa' },
      { label: 'Talvez', value: 0.48, note: 'Algum balanço' },
      { label: 'Sim', value: 0.76, note: 'Bem dançante' },
      { label: 'Com certeza', value: 0.91, note: 'Pista de dança' },
    ],
  },
  {
    id: 'valence',
    title: 'Qual sensação a música transmite?',
    subtitle: 'O clima emocional impacta o potencial de apelo amplo.',
    kind: 'choices',
    options: [
      { label: 'Melancólica', value: 0.22, note: 'Introspectiva e densa' },
      { label: 'Reflexiva', value: 0.45, note: 'Emocional, mas neutra' },
      { label: 'Positiva', value: 0.73, note: 'Leve e otimista' },
      { label: 'Eufórica', value: 0.9, note: 'Muito vibrante' },
    ],
  },
  {
    id: 'acousticness',
    title: 'O som parece mais acústico, eletrônico ou misto?',
    subtitle: 'Isso aproxima a percepção humana de uma métrica de produção.',
    kind: 'choices',
    options: [
      { label: 'Eletrônico', value: 0.12, note: 'Síntese em destaque' },
      { label: 'Misto equilibrado', value: 0.42, note: 'Camadas híbridas' },
      { label: 'Acústico moderno', value: 0.68, note: 'Instrumentação forte' },
      { label: 'Bem acústico', value: 0.88, note: 'Soa orgânico' },
    ],
  },
  {
    id: 'vocals',
    title: 'Como os vocais aparecem na música?',
    subtitle: 'Essa resposta ajuda a estimar instrumentalidade e fala/rap.',
    kind: 'choices',
    options: [
      {
        label: 'Principalmente cantada',
        value: { instrumentalness: 0.08, speechiness: 0.12 },
        note: 'Melodia vocal dominante',
      },
      {
        label: 'Cantada com trechos falados',
        value: { instrumentalness: 0.12, speechiness: 0.28 },
        note: 'Híbrida',
      },
      {
        label: 'Mais rap ou falada',
        value: { instrumentalness: 0.05, speechiness: 0.66 },
        note: 'Flow em destaque',
      },
      {
        label: 'Instrumental',
        value: { instrumentalness: 0.87, speechiness: 0.05 },
        note: 'Pouco ou nenhum vocal',
      },
    ],
  },
  {
    id: 'tempo',
    title: 'Qual a velocidade percebida da música?',
    subtitle: 'Mesmo sem BPM real, a sensação de andamento já ajuda bastante.',
    kind: 'choices',
    options: [
      { label: 'Lenta', value: 82, note: 'Respira mais' },
      { label: 'Moderada', value: 110, note: 'Equilibrada' },
      { label: 'Rápida', value: 130, note: 'Mais pulsante' },
      { label: 'Muito rápida', value: 152, note: 'Alta aceleração' },
    ],
  },
];

const LOADING_MESSAGES = [
  'Convertendo respostas em features do Spotify...',
  'Buscando padrões no dataset exportado do Kaggle...',
  'Estimando popularidade a partir dos vizinhos mais próximos...',
  'Selecionando músicas populares similares...',
  'Montando interpretação do resultado...',
];

const COVER_PALETTES = [
  ['#ec4899', '#8b5cf6', '#06b6d4'],
  ['#f97316', '#ef4444', '#eab308'],
  ['#22c55e', '#14b8a6', '#0ea5e9'],
  ['#6366f1', '#a855f7', '#ec4899'],
  ['#f43f5e', '#fb7185', '#f59e0b'],
  ['#10b981', '#22c55e', '#84cc16'],
];

const DEFAULT_ARTIFACTS = {
  source: {
    dataset_name: 'Spotify Tracks Dataset',
    generated_at: '2026-09-03',
    global_mean_popularity: 57.4,
    hit_threshold: 70,
    mode: 'demo',
    note: 'Arquivo de demonstração. Troque por public/data/model-artifacts.json gerado a partir do CSV do Kaggle.',
  },
  stats: {
    total_tracks: 114000,
    unique_genres: 114,
    feature_list: FEATURE_KEYS,
    popularity_buckets: [
      { label: '0-20', percentage: 14 },
      { label: '21-40', percentage: 22 },
      { label: '41-60', percentage: 31 },
      { label: '61-80', percentage: 21 },
      { label: '81-100', percentage: 12 },
    ],
    top_genres: [
      { genre: 'Pop', count: 15240, avg_popularity: 67.9 },
      { genre: 'Rap', count: 11180, avg_popularity: 63.1 },
      { genre: 'Eletrônica', count: 10250, avg_popularity: 61.8 },
      { genre: 'Funk', count: 9980, avg_popularity: 65.4 },
      { genre: 'Sertanejo', count: 9320, avg_popularity: 60.7 },
      { genre: 'Rock', count: 8880, avg_popularity: 57.6 },
    ],
  },
  ranges: {
    danceability: { min: 0.05, max: 0.98 },
    energy: { min: 0.03, max: 0.99 },
    valence: { min: 0.04, max: 0.98 },
    acousticness: { min: 0.0, max: 0.99 },
    instrumentalness: { min: 0.0, max: 0.98 },
    speechiness: { min: 0.02, max: 0.92 },
    liveness: { min: 0.03, max: 0.91 },
    tempo: { min: 66, max: 176 },
    genre_encoded: { min: 38, max: 78 },
    artist_encoded: { min: 32, max: 86 },
  },
  popular_centroid: {
    danceability: 0.77,
    energy: 0.75,
    valence: 0.64,
    acousticness: 0.24,
    instrumentalness: 0.08,
    speechiness: 0.21,
    liveness: 0.19,
    tempo: 124,
    genre_encoded: 66.2,
    artist_encoded: 68.1,
  },
  options: {
    genres: [
      { genre: 'Pop', genre_encoded: 67.9 },
      { genre: 'Funk', genre_encoded: 65.4 },
      { genre: 'Rap', genre_encoded: 63.1 },
      { genre: 'Eletrônica', genre_encoded: 61.8 },
      { genre: 'Sertanejo', genre_encoded: 60.7 },
      { genre: 'Rock', genre_encoded: 57.6 },
      { genre: 'Indie', genre_encoded: 55.9 },
      { genre: 'Lo-fi', genre_encoded: 48.4 },
    ],
    artists_by_genre: {
      Pop: [
        { artist: 'The Weeknd', artist_encoded: 84.1, top_track: 'Blinding Lights', top_popularity: 91, note: 'Destaque: Blinding Lights (91)' },
        { artist: 'Dua Lipa', artist_encoded: 83.2, top_track: 'Levitating', top_popularity: 87, note: 'Destaque: Levitating (87)' },
        { artist: 'Olivia Rodrigo', artist_encoded: 79.8, top_track: 'drivers license', top_popularity: 85, note: 'Destaque: drivers license (85)' },
      ],
      Funk: [
        { artist: 'Anitta', artist_encoded: 78.6, top_track: 'Envolver', top_popularity: 79, note: 'Destaque: Envolver (79)' },
        { artist: 'MC Ryan SP', artist_encoded: 72.8, top_track: 'Casei Com a Putaria', top_popularity: 75, note: 'Destaque: Casei Com a Putaria (75)' },
        { artist: 'Kevin O Chris', artist_encoded: 71.1, top_track: 'Tá OK', top_popularity: 74, note: 'Destaque: Tá OK (74)' },
      ],
      Rap: [
        { artist: 'Travis Scott', artist_encoded: 77.5, top_track: 'SICKO MODE', top_popularity: 84, note: 'Destaque: SICKO MODE (84)' },
        { artist: 'Kendrick Lamar', artist_encoded: 79.4, top_track: 'HUMBLE.', top_popularity: 83, note: 'Destaque: HUMBLE. (83)' },
        { artist: 'Matuê', artist_encoded: 73.2, top_track: 'Kenny G', top_popularity: 74, note: 'Destaque: Kenny G (74)' },
      ],
      Eletrônica: [
        { artist: 'Calvin Harris', artist_encoded: 81.3, top_track: 'One Kiss', top_popularity: 82, note: 'Destaque: One Kiss (82)' },
        { artist: 'Farruko', artist_encoded: 72.4, top_track: 'Pepas', top_popularity: 81, note: 'Destaque: Pepas (81)' },
        { artist: 'David Guetta', artist_encoded: 76.4, top_track: 'Titanium', top_popularity: 80, note: 'Destaque: Titanium (80)' },
      ],
      Sertanejo: [
        { artist: 'Ana Castela', artist_encoded: 74.1, top_track: 'Nosso Quadro', top_popularity: 78, note: 'Destaque: Nosso Quadro (78)' },
        { artist: 'Jorge & Mateus', artist_encoded: 77.2, top_track: 'Molhando o Volante', top_popularity: 77, note: 'Destaque: Molhando o Volante (77)' },
        { artist: 'Gusttavo Lima', artist_encoded: 78.5, top_track: 'Termina Comigo Antes', top_popularity: 76, note: 'Destaque: Termina Comigo Antes (76)' },
      ],
      Rock: [
        { artist: 'Coldplay', artist_encoded: 80.2, top_track: 'Adventure of a Lifetime', top_popularity: 76, note: 'Destaque: Adventure of a Lifetime (76)' },
        { artist: 'Arctic Monkeys', artist_encoded: 74.4, top_track: 'Do I Wanna Know?', top_popularity: 79, note: 'Destaque: Do I Wanna Know? (79)' },
        { artist: 'Imagine Dragons', artist_encoded: 72.6, top_track: 'Believer', top_popularity: 78, note: 'Destaque: Believer (78)' },
      ],
      Indie: [
        { artist: 'Tame Impala', artist_encoded: 71.8, top_track: 'The Less I Know The Better', top_popularity: 78, note: 'Destaque: The Less I Know The Better (78)' },
        { artist: 'Clairo', artist_encoded: 69.1, top_track: 'Sofia', top_popularity: 72, note: 'Destaque: Sofia (72)' },
        { artist: 'Phoebe Bridgers', artist_encoded: 68.4, top_track: 'Motion Sickness', top_popularity: 70, note: 'Destaque: Motion Sickness (70)' },
      ],
      'Lo-fi': [
        { artist: 'Øneheart', artist_encoded: 53.4, top_track: 'snowfall', top_popularity: 68, note: 'Destaque: snowfall (68)' },
        { artist: 'Mikey Mike', artist_encoded: 52.1, top_track: 'After Dark x Sweater Weather', top_popularity: 67, note: 'Destaque: After Dark x Sweater Weather (67)' },
        { artist: 'idealism', artist_encoded: 54.3, top_track: 'both of us', top_popularity: 65, note: 'Destaque: both of us (65)' },
      ],
    },
  },
  reference_tracks: [
    {
      track_name: 'Levitating',
      artist: 'Dua Lipa',
      genre: 'Pop',
      popularity: 87,
      features: {
        danceability: 0.8,
        energy: 0.78,
        valence: 0.86,
        acousticness: 0.06,
        instrumentalness: 0.0,
        speechiness: 0.05,
        liveness: 0.07,
        tempo: 103,
        genre_encoded: 67.9,
        artist_encoded: 83.2,
      },
    },
    {
      track_name: 'Blinding Lights',
      artist: 'The Weeknd',
      genre: 'Pop',
      popularity: 91,
      features: {
        danceability: 0.72,
        energy: 0.73,
        valence: 0.34,
        acousticness: 0.0,
        instrumentalness: 0.0,
        speechiness: 0.06,
        liveness: 0.09,
        tempo: 171,
        genre_encoded: 67.9,
        artist_encoded: 84.1,
      },
    },
    {
      track_name: 'Don’t Start Now',
      artist: 'Dua Lipa',
      genre: 'Pop',
      popularity: 85,
      features: {
        danceability: 0.79,
        energy: 0.79,
        valence: 0.68,
        acousticness: 0.01,
        instrumentalness: 0.0,
        speechiness: 0.08,
        liveness: 0.09,
        tempo: 124,
        genre_encoded: 67.9,
        artist_encoded: 83.2,
      },
    },
    {
      track_name: 'Pepas',
      artist: 'Farruko',
      genre: 'Eletrônica',
      popularity: 81,
      features: {
        danceability: 0.76,
        energy: 0.9,
        valence: 0.44,
        acousticness: 0.03,
        instrumentalness: 0.0,
        speechiness: 0.08,
        liveness: 0.08,
        tempo: 126,
        genre_encoded: 61.8,
        artist_encoded: 72.4,
      },
    },
    {
      track_name: 'Titanium',
      artist: 'David Guetta',
      genre: 'Eletrônica',
      popularity: 80,
      features: {
        danceability: 0.61,
        energy: 0.79,
        valence: 0.3,
        acousticness: 0.02,
        instrumentalness: 0.0,
        speechiness: 0.1,
        liveness: 0.13,
        tempo: 126,
        genre_encoded: 61.8,
        artist_encoded: 76.4,
      },
    },
    {
      track_name: 'One Kiss',
      artist: 'Calvin Harris',
      genre: 'Eletrônica',
      popularity: 82,
      features: {
        danceability: 0.79,
        energy: 0.79,
        valence: 0.59,
        acousticness: 0.04,
        instrumentalness: 0.0,
        speechiness: 0.11,
        liveness: 0.15,
        tempo: 124,
        genre_encoded: 61.8,
        artist_encoded: 81.3,
      },
    },
    {
      track_name: 'SICKO MODE',
      artist: 'Travis Scott',
      genre: 'Rap',
      popularity: 84,
      features: {
        danceability: 0.83,
        energy: 0.73,
        valence: 0.45,
        acousticness: 0.01,
        instrumentalness: 0.0,
        speechiness: 0.22,
        liveness: 0.12,
        tempo: 78,
        genre_encoded: 63.1,
        artist_encoded: 77.5,
      },
    },
    {
      track_name: 'HUMBLE.',
      artist: 'Kendrick Lamar',
      genre: 'Rap',
      popularity: 83,
      features: {
        danceability: 0.91,
        energy: 0.62,
        valence: 0.42,
        acousticness: 0.0,
        instrumentalness: 0.0,
        speechiness: 0.1,
        liveness: 0.1,
        tempo: 150,
        genre_encoded: 63.1,
        artist_encoded: 79.4,
      },
    },
    {
      track_name: 'Kenny G',
      artist: 'Matuê',
      genre: 'Rap',
      popularity: 74,
      features: {
        danceability: 0.81,
        energy: 0.7,
        valence: 0.52,
        acousticness: 0.16,
        instrumentalness: 0.0,
        speechiness: 0.23,
        liveness: 0.09,
        tempo: 130,
        genre_encoded: 63.1,
        artist_encoded: 73.2,
      },
    },
    {
      track_name: 'Envolver',
      artist: 'Anitta',
      genre: 'Funk',
      popularity: 79,
      features: {
        danceability: 0.81,
        energy: 0.82,
        valence: 0.52,
        acousticness: 0.09,
        instrumentalness: 0.0,
        speechiness: 0.08,
        liveness: 0.09,
        tempo: 91,
        genre_encoded: 65.4,
        artist_encoded: 78.6,
      },
    },
    {
      track_name: 'Tubarões',
      artist: 'Diego & Victor Hugo',
      genre: 'Sertanejo',
      popularity: 73,
      features: {
        danceability: 0.67,
        energy: 0.69,
        valence: 0.58,
        acousticness: 0.28,
        instrumentalness: 0.0,
        speechiness: 0.05,
        liveness: 0.11,
        tempo: 126,
        genre_encoded: 60.7,
        artist_encoded: 69.6,
      },
    },
    {
      track_name: 'Nosso Quadro',
      artist: 'Ana Castela',
      genre: 'Sertanejo',
      popularity: 78,
      features: {
        danceability: 0.63,
        energy: 0.75,
        valence: 0.64,
        acousticness: 0.19,
        instrumentalness: 0.0,
        speechiness: 0.04,
        liveness: 0.12,
        tempo: 128,
        genre_encoded: 60.7,
        artist_encoded: 74.1,
      },
    },
    {
      track_name: 'Adventure of a Lifetime',
      artist: 'Coldplay',
      genre: 'Rock',
      popularity: 76,
      features: {
        danceability: 0.64,
        energy: 0.86,
        valence: 0.55,
        acousticness: 0.01,
        instrumentalness: 0.0,
        speechiness: 0.03,
        liveness: 0.23,
        tempo: 112,
        genre_encoded: 57.6,
        artist_encoded: 80.2,
      },
    },
    {
      track_name: 'Do I Wanna Know?',
      artist: 'Arctic Monkeys',
      genre: 'Rock',
      popularity: 79,
      features: {
        danceability: 0.54,
        energy: 0.53,
        valence: 0.34,
        acousticness: 0.19,
        instrumentalness: 0.0,
        speechiness: 0.03,
        liveness: 0.22,
        tempo: 85,
        genre_encoded: 57.6,
        artist_encoded: 74.4,
      },
    },
    {
      track_name: 'The Less I Know The Better',
      artist: 'Tame Impala',
      genre: 'Indie',
      popularity: 78,
      features: {
        danceability: 0.64,
        energy: 0.67,
        valence: 0.69,
        acousticness: 0.03,
        instrumentalness: 0.01,
        speechiness: 0.03,
        liveness: 0.12,
        tempo: 116,
        genre_encoded: 55.9,
        artist_encoded: 71.8,
      },
    },
    {
      track_name: 'Sofia',
      artist: 'Clairo',
      genre: 'Indie',
      popularity: 72,
      features: {
        danceability: 0.66,
        energy: 0.58,
        valence: 0.64,
        acousticness: 0.25,
        instrumentalness: 0.0,
        speechiness: 0.03,
        liveness: 0.11,
        tempo: 115,
        genre_encoded: 55.9,
        artist_encoded: 69.1,
      },
    },
    {
      track_name: 'snowfall',
      artist: 'Øneheart',
      genre: 'Lo-fi',
      popularity: 68,
      features: {
        danceability: 0.39,
        energy: 0.24,
        valence: 0.16,
        acousticness: 0.74,
        instrumentalness: 0.81,
        speechiness: 0.04,
        liveness: 0.1,
        tempo: 89,
        genre_encoded: 48.4,
        artist_encoded: 53.4,
      },
    },
    {
      track_name: 'After Dark x Sweater Weather',
      artist: 'Mikey Mike',
      genre: 'Lo-fi',
      popularity: 67,
      features: {
        danceability: 0.56,
        energy: 0.31,
        valence: 0.21,
        acousticness: 0.69,
        instrumentalness: 0.63,
        speechiness: 0.04,
        liveness: 0.12,
        tempo: 92,
        genre_encoded: 48.4,
        artist_encoded: 52.1,
      },
    },
  ],
  popular_tracks: [
    { track_name: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop', popularity: 91 },
    { track_name: 'Levitating', artist: 'Dua Lipa', genre: 'Pop', popularity: 87 },
    { track_name: 'Don’t Start Now', artist: 'Dua Lipa', genre: 'Pop', popularity: 85 },
    { track_name: 'SICKO MODE', artist: 'Travis Scott', genre: 'Rap', popularity: 84 },
    { track_name: 'HUMBLE.', artist: 'Kendrick Lamar', genre: 'Rap', popularity: 83 },
    { track_name: 'One Kiss', artist: 'Calvin Harris', genre: 'Eletrônica', popularity: 82 },
    { track_name: 'Pepas', artist: 'Farruko', genre: 'Eletrônica', popularity: 81 },
    { track_name: 'Adventure of a Lifetime', artist: 'Coldplay', genre: 'Rock', popularity: 76 },
  ],
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getArtifactsUrl() {
  return `${import.meta.env.BASE_URL}data/model-artifacts.json`;
}

function formatFeatureLabel(label) {
  const labels = {
    danceability: 'Danceability',
    energy: 'Energia',
    valence: 'Valence',
    acousticness: 'Acousticness',
    instrumentalness: 'Instrumentalness',
    speechiness: 'Speechiness',
    liveness: 'Liveness',
    tempo: 'Tempo',
    genre_encoded: 'Genre Encoded',
    artist_encoded: 'Artist Encoded',
  };
  return labels[label] || label;
}

function compareValue(value) {
  if (typeof value === 'number' && value <= 1) {
    if (value >= 0.8) return 'Muito alto';
    if (value >= 0.6) return 'Alto';
    if (value >= 0.4) return 'Médio';
    if (value >= 0.2) return 'Baixo';
    return 'Muito baixo';
  }
  if (typeof value === 'number') {
    if (value >= 145) return 'Muito rápido';
    if (value >= 120) return 'Rápido';
    if (value >= 95) return 'Moderado';
    return 'Lento';
  }
  return String(value);
}

function escapeSvgText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildGeneratedCover(track) {
  const seed = hashString(`${track.track_name}-${track.artist}-${track.genre}`);
  const [start, middle, end] = COVER_PALETTES[seed % COVER_PALETTES.length];
  const title = escapeSvgText(track.track_name);
  const artist = escapeSvgText(track.artist);
  const genre = escapeSvgText(track.genre || 'HitLab');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="52%" stop-color="${middle}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" rx="56" fill="url(#bg)" />
      <circle cx="478" cy="122" r="88" fill="rgba(255,255,255,0.12)" />
      <circle cx="124" cy="498" r="132" fill="rgba(0,0,0,0.14)" />
      <rect x="56" y="56" width="488" height="488" rx="36" fill="rgba(7,10,22,0.15)" stroke="rgba(255,255,255,0.16)" />
      <text x="72" y="382" fill="white" font-size="52" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>
      <text x="72" y="438" fill="rgba(255,255,255,0.86)" font-size="28" font-family="Arial, Helvetica, sans-serif">${artist}</text>
      <text x="72" y="494" fill="rgba(255,255,255,0.72)" font-size="22" font-family="Arial, Helvetica, sans-serif">${genre}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getTrackCover(track) {
  return track.cover_url || buildGeneratedCover(track);
}

function buildQuestions(artifacts, answers) {
  const genreOptions = artifacts.options.genres.map((item) => ({
    label: item.label || item.genre,
    note: `Média histórica simulada: ${item.genre_encoded.toFixed(1)}`,
    value: { genre: item.genre, genre_label: item.label || item.genre, genre_encoded: item.genre_encoded },
  }));

  const selectedGenre = answers.genre?.genre || artifacts.options.genres[0]?.genre || 'Pop';
  const artistSource = artifacts.options.artists_by_genre[selectedGenre] || [];
  const fallbackArtists =
    artistSource.length > 0 ? artistSource : artifacts.options.artists_by_genre[artifacts.options.genres[0]?.genre] || [];
  const artistOptions = [...fallbackArtists]
    .sort(
      (left, right) =>
        (right.top_popularity ?? right.artist_encoded) - (left.top_popularity ?? left.artist_encoded)
    )
    .map((item) => ({
      label: item.artist,
      note:
        item.note ||
        (item.top_track
          ? `Destaque: ${item.top_track} (${item.top_popularity})`
          : `Histórico médio: ${item.artist_encoded.toFixed(1)}`),
      value: { artist: item.artist, artist_encoded: item.artist_encoded },
    }));

  return [
    BASE_QUESTIONS[0],
    BASE_QUESTIONS[1],
    BASE_QUESTIONS[2],
    BASE_QUESTIONS[3],
    BASE_QUESTIONS[4],
    {
      id: 'genre',
      title: 'Qual gênero mais se aproxima da sua música?',
      subtitle: 'Esse campo usa o mesmo conceito de target encoding do notebook.',
      kind: 'grid',
      options: genreOptions,
    },
    {
      id: 'artist',
      title: 'Qual artista popular de referência combina mais com a sua ideia?',
      subtitle: 'A lista prioriza artistas mais fortes dentro do gênero escolhido para aproximar melhor o `artist_encoded`.',
      kind: 'grid',
      options: artistOptions,
    },
    BASE_QUESTIONS[5],
  ];
}

function mapAnswersToFeatures(answers, artifacts) {
  const genre = answers.genre || {
    genre: artifacts.options.genres[0]?.genre || 'Pop',
    genre_label: artifacts.options.genres[0]?.label || artifacts.options.genres[0]?.genre || 'Pop',
    genre_encoded: artifacts.options.genres[0]?.genre_encoded || artifacts.source.global_mean_popularity,
  };
  const artist = answers.artist || {
    artist: artifacts.options.artists_by_genre[genre.genre]?.[0]?.artist || 'Referência',
    artist_encoded:
      artifacts.options.artists_by_genre[genre.genre]?.[0]?.artist_encoded || artifacts.source.global_mean_popularity,
  };
  const vocals = answers.vocals || { instrumentalness: 0.08, speechiness: 0.12 };

  const danceability = answers.danceability ?? 0.65;
  const energy = answers.energy ?? 0.7;
  const valence = answers.valence ?? 0.62;
  const acousticness = answers.acousticness ?? 0.35;
  const tempo = answers.tempo ?? 118;
  const liveness = clamp(0.1 + energy * 0.22 + Math.abs(tempo - 110) / 250, 0.05, 0.88);

  return {
    danceability,
    energy,
    valence,
    acousticness,
    instrumentalness: vocals.instrumentalness,
    speechiness: vocals.speechiness,
    liveness,
    tempo,
    genre: genre.genre,
    genre_label: genre.genre_label || genre.genre,
    genre_encoded: genre.genre_encoded,
    artist: artist.artist,
    artist_encoded: artist.artist_encoded,
  };
}

function getRangeValue(ranges, key) {
  const range = ranges[key];
  if (!range) return 1;
  return Math.max((range.max || 1) - (range.min || 0), 0.0001);
}

function computeDistance(a, b, ranges) {
  let total = 0;
  FEATURE_KEYS.forEach((key) => {
    const range = getRangeValue(ranges, key);
    const weight = FEATURE_WEIGHTS[key] || 1;
    const difference = ((a[key] || 0) - (b[key] || 0)) / range;
    total += difference * difference * weight;
  });
  return Math.sqrt(total);
}

function findNearestTracks(features, tracks, ranges, limit) {
  return tracks
    .map((track) => {
      const distance = computeDistance(features, track.features, ranges);
      return { ...track, distance };
    })
    .sort((left, right) => left.distance - right.distance)
    .slice(0, limit);
}

function estimateCentroidScore(features, artifacts) {
  let totalNormalizedDifference = 0;
  FEATURE_KEYS.forEach((key) => {
    const range = getRangeValue(artifacts.ranges, key);
    totalNormalizedDifference += Math.abs((features[key] || 0) - (artifacts.popular_centroid[key] || 0)) / range;
  });
  const averageDifference = totalNormalizedDifference / FEATURE_KEYS.length;
  return Math.round(clamp((1 - averageDifference * 1.35) * 100, 0, 100));
}

function classificationFromScore(score, hitThreshold) {
  if (score >= hitThreshold + 12) return 'Forte potencial de hit';
  if (score >= hitThreshold) return 'Potencial de hit';
  if (score >= hitThreshold - 10) return 'Faixa competitiva';
  if (score >= hitThreshold - 20) return 'Potencial moderado';
  return 'Nicho mais específico';
}

function summarizeProfile(features, score) {
  const mood = features.valence > 0.68 ? 'positivo' : features.valence > 0.42 ? 'emocional' : 'mais denso';
  const groove =
    features.danceability > 0.75 ? 'dançante' : features.danceability > 0.5 ? 'acessível' : 'menos orientado à pista';
  const production =
    features.acousticness < 0.28 ? 'produção eletrônica' : features.acousticness < 0.58 ? 'produção híbrida' : 'produção acústica';
  const impact = score >= 70 ? 'boa chance de circular em playlists amplas' : 'melhor encaixe em audiência mais segmentada';

  return `A música soa ${groove}, com clima ${mood} e ${production}. Dentro da referência escolhida em ${features.genre_label || features.genre}, o conjunto indica ${impact}.`;
}

function buildProsAndCons(features, artifacts, score) {
  const pros = [];
  const cons = [];
  const centroid = artifacts.popular_centroid;
  const globalMean = artifacts.source.global_mean_popularity;

  if (features.energy >= centroid.energy - 0.08) {
    pros.push('Energia próxima do centro das faixas mais populares.');
  }
  if (features.danceability >= centroid.danceability - 0.08) {
    pros.push('Danceability compatível com consumo recorrente.');
  }
  if (Math.abs(features.tempo - centroid.tempo) <= 16) {
    pros.push('Tempo em faixa comum para músicas de forte tração.');
  }
  if (features.genre_encoded >= globalMean + 4) {
    pros.push(`O gênero ${features.genre_label || features.genre} tem média histórica acima do conjunto geral.`);
  }
  if (features.artist_encoded >= globalMean + 6) {
    pros.push(`A referência de artista ${features.artist} puxa o histórico para cima.`);
  }

  if (features.acousticness >= centroid.acousticness + 0.28) {
    cons.push('Acousticness alta pode reduzir aderência a playlists mainstream.');
  }
  if (features.instrumentalness >= 0.55) {
    cons.push('Faixas instrumentais tendem a ter menor popularidade média.');
  }
  if (features.speechiness >= 0.58) {
    cons.push('Speechiness alta costuma restringir o alcance fora de nichos.');
  }
  if (features.energy <= centroid.energy - 0.26) {
    cons.push('Energia abaixo do padrão das faixas mais fortes do conjunto.');
  }
  if (score < artifacts.source.hit_threshold) {
    cons.push('A combinação geral ainda não supera com folga o limiar de hit escolhido.');
  }

  return {
    pros: pros.slice(0, 4),
    cons: cons.slice(0, 4),
  };
}

function simulatePrediction(answers, artifacts) {
  const features = mapAnswersToFeatures(answers, artifacts);
  const neighbors = findNearestTracks(features, artifacts.reference_tracks, artifacts.ranges, 12);
  const popularPool =
    Array.isArray(artifacts.popular_tracks) && artifacts.popular_tracks.length > 0
      ? artifacts.popular_tracks
      : artifacts.reference_tracks.filter((track) => track.popularity >= (artifacts.source.hit_threshold || 70));

  let weightedPopularity = 0;
  let totalWeight = 0;
  neighbors.forEach((neighbor) => {
    const weight = 1 / (neighbor.distance + 0.12);
    weightedPopularity += neighbor.popularity * weight;
    totalWeight += weight;
  });

  const neighborScore = totalWeight > 0 ? weightedPopularity / totalWeight : artifacts.source.global_mean_popularity;
  const priorScore = features.genre_encoded * 0.55 + features.artist_encoded * 0.45;
  const centroidScore = estimateCentroidScore(features, artifacts);
  const score = Math.round(clamp(neighborScore * 0.65 + priorScore * 0.2 + centroidScore * 0.15, 0, 100));
  const hitThreshold = artifacts.source.hit_threshold || 70;

  const similarTracks = findNearestTracks(features, popularPool, artifacts.ranges, 6)
    .slice(0, 3)
    .map((track) => ({
      ...track,
      match: Math.round(clamp((1 - track.distance / 1.55) * 100, 55, 99)),
    }));

  const fallbackSimilar = similarTracks.length > 0
    ? similarTracks
    : popularPool
        .slice(0, 3)
        .map((track) => ({
          ...track,
          distance: 0.95,
          match: 61,
        }));

  return {
    score,
    isHit: score >= hitThreshold,
    hitThreshold,
    classification: classificationFromScore(score, hitThreshold),
    profile: summarizeProfile(features, score),
    neighbors,
    similarTracks: fallbackSimilar,
    technical: features,
    ...buildProsAndCons(features, artifacts, score),
  };
}

function TrackCover({ track, className = '' }) {
  return (
    <img
      src={getTrackCover(track)}
      alt={`Capa de ${track.track_name} por ${track.artist}`}
      className={className}
      loading="lazy"
    />
  );
}

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [artifacts, setArtifacts] = useState(DEFAULT_ARTIFACTS);
  const [artifactStatus, setArtifactStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    async function loadArtifacts() {
      try {
        const response = await fetch(getArtifactsUrl());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        if (!active) return;
        setArtifacts(payload);
        setArtifactStatus(payload.source?.mode === 'demo' ? 'demo' : 'ready');
      } catch (error) {
        if (!active) return;
        setArtifacts(DEFAULT_ARTIFACTS);
        setArtifactStatus('demo');
      }
    }

    loadArtifacts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (currentView !== 'loading') return undefined;

    const fetchPrediction = async () => {
      try {
        const features = mapAnswersToFeatures(quizAnswers, artifacts);
        const payload = {
          duration_ms: 200000,
          danceability: features.danceability || 0.5,
          energy: features.energy || 0.5,
          key: 5,
          loudness: -10.0,
          mode: 1,
          speechiness: features.speechiness || 0.1,
          acousticness: features.acousticness || 0.2,
          instrumentalness: features.instrumentalness || 0.0,
          liveness: features.liveness || 0.1,
          valence: features.valence || 0.5,
          tempo: features.tempo || 120.0,
          time_signature: 4,
          explicit: 0,
          genre_encoded: features.genre_encoded || null,
          artist_encoded: features.artist_encoded || null,
          genre_name: features.genre || null,
          artist_name: features.artist || null
        };

        const response = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Erro na API");
        
        const data = await response.json();
        const simulated = simulatePrediction(quizAnswers, artifacts);
        
        // Override simulated result with actual API prediction
        simulated.score = Math.round(data.popularity);
        simulated.isHit = simulated.score >= (simulated.hitThreshold || 70);
        simulated.classification = classificationFromScore(simulated.score, simulated.hitThreshold || 70);
        
        if (isMounted) {
          setPrediction(simulated);
          setCurrentView('results');
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setPrediction(simulatePrediction(quizAnswers, artifacts));
          setCurrentView('results');
        }
      }
    };

    const timer = window.setTimeout(() => {
      fetchPrediction();
    }, 1500);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [artifacts, currentView, quizAnswers]);

  const handleStartQuiz = () => {
    setCurrentView('quiz');
    setMobileOpen(false);
  };

  const handleAnalyze = (answers) => {
    setQuizAnswers(answers);
    setCurrentView('loading');
  };

  function renderView() {
    if (currentView === 'quiz') {
      return (
        <QuizView
          artifacts={artifacts}
          initialAnswers={quizAnswers}
          onBack={() => setCurrentView('landing')}
          onAnalyze={handleAnalyze}
        />
      );
    }
    if (currentView === 'loading') {
      return <LoadingView />;
    }
    if (currentView === 'results') {
      return (
        <ResultsView
          result={prediction}
          artifacts={artifacts}
          onRestart={() => {
            setQuizAnswers({});
            setPrediction(null);
            setCurrentView('quiz');
          }}
          onGoHome={() => setCurrentView('landing')}
        />
      );
    }
    if (currentView === 'about') {
      return <AboutView artifacts={artifacts} onAnalyzeClick={handleStartQuiz} />;
    }
    if (currentView === 'explore') {
      return <ExploreView artifacts={artifacts} onAnalyzeClick={handleStartQuiz} />;
    }
    return (
      <LandingView
        artifacts={artifacts}
        artifactStatus={artifactStatus}
        onAnalyzeClick={handleStartQuiz}
        onExploreClick={() => setCurrentView('explore')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-gray-950/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => {
              setCurrentView('landing');
              setMobileOpen(false);
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-purple-950/40">
              <Disc3 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold tracking-wide">HitLab</div>
              <div className="text-xs text-gray-400">Music Hit Predictor</div>
            </div>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className="text-sm text-gray-300 transition hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleStartQuiz}
              className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-medium transition hover:scale-105"
            >
              Analisar Música
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-2xl border border-white/10 p-3 text-gray-200 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-gray-950 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileOpen(false);
                  }}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-gray-200"
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleStartQuiz}
                className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-sm font-medium"
              >
                Analisar Música
              </button>
            </div>
          </div>
        )}
      </div>

      <main className="pt-24">{renderView()}</main>
    </div>
  );
}

function LandingView({ artifacts, artifactStatus, onAnalyzeClick, onExploreClick }) {
  const liveStatus =
    artifactStatus === 'ready' ? 'Dados reais do dataset carregados' : artifactStatus === 'loading' ? 'Carregando artefatos...' : 'Modo demonstração ativo';

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.20),_transparent_28%),radial-gradient(circle_at_80%_18%,_rgba(168,85,247,0.25),_transparent_22%),linear-gradient(180deg,_rgba(3,7,18,0.25),_rgba(3,7,18,1))]" />
      <div className="absolute left-12 top-32 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8 lg:py-24">
        <div className="max-w-3xl flex-1">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-sm text-pink-100">
            <Sparkles className="h-4 w-4" />
            {liveStatus}
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Descubra se a sua próxima música tem cara de hit.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            O HitLab transforma respostas simples em métricas presentes no Spotify Tracks Dataset, estima popularidade e retorna 3 músicas populares com perfil semelhante.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onAnalyzeClick}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-base font-semibold transition hover:scale-105"
            >
              <Play className="h-4 w-4" />
              Analisar minha música
            </button>
            <button
              type="button"
              onClick={onExploreClick}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-gray-100 transition hover:border-pink-500/40 hover:bg-white/10"
            >
              <BarChart3 className="h-4 w-4" />
              Explorar dataset
            </button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <StatBadge icon={Database} title={`${artifacts.stats.total_tracks.toLocaleString('pt-BR')} faixas`} subtitle="Base exportada do Kaggle" />
            <StatBadge icon={Brain} title="Predição por similaridade" subtitle="Com encodings de gênero e artista" />
            <StatBadge icon={Gauge} title={`Limiar de hit: ${artifacts.source.hit_threshold}`} subtitle="Escala prevista de 0 a 100" />
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-950/30 backdrop-blur">
            <div className="rounded-[1.5rem] border border-white/10 bg-gray-900/80 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-pink-200/80">Pipeline</p>
                  <h2 className="mt-2 text-2xl font-semibold">Do questionário ao resultado</h2>
                </div>
                <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-200">
                  <Activity className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-4">
                <PreviewStep icon={Mic2} title="Respostas simples" description="Você descreve energia, clima, vocais, gênero, artista de referência e tempo." />
                <PreviewStep icon={Waves} title="Conversão em features" description="O app monta atributos como `danceability`, `energy`, `genre_encoded` e `artist_encoded`." />
                <PreviewStep icon={LineChart} title="Predição e comparação" description="O score final usa a proximidade com músicas do dataset e retorna 3 faixas populares similares." />
              </div>

              <div className="mt-6 rounded-3xl bg-gradient-to-r from-pink-500/15 to-purple-500/15 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-300">Exemplo de score previsto</div>
                    <div className="mt-2 text-5xl font-semibold">78</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                    Potencial de hit
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBadge({ icon: Icon, title, subtitle }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-100">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-gray-400">{subtitle}</div>
    </div>
  );
}

function PreviewStep({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-800 text-pink-200">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-medium text-white">{title}</div>
        <div className="mt-1 text-sm text-gray-400">{description}</div>
      </div>
    </div>
  );
}

function QuizView({ artifacts, initialAnswers, onBack, onAnalyze }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers || {});

  const questions = buildQuestions(artifacts, answers);
  const question = questions[step];
  const progress = ((step + 1) / questions.length) * 100;
  const currentAnswer = answers[question.id];
  const canAdvance = typeof currentAnswer !== 'undefined';

  const selectOption = (optionValue) => {
    setAnswers((previous) => {
      if (question.id === 'genre') {
        return {
          ...previous,
          genre: optionValue,
          artist: undefined,
        };
      }
      return {
        ...previous,
        [question.id]: optionValue,
      };
    });
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-purple-950/20 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-purple-200/80">Questionário guiado</div>
            <h1 className="mt-2 text-3xl font-semibold">Descreva sua música sem termos técnicos</h1>
            <p className="mt-3 max-w-2xl text-gray-400">
              As respostas vão virar métricas do dataset e serão comparadas com músicas reais para estimar popularidade.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gray-900/70 px-4 py-3 text-sm text-gray-300">
            Etapa {step + 1} de {questions.length}
          </div>
        </div>

        <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-pink-200/70">
            {question.id === 'genre' || question.id === 'artist' ? 'Encoding contextual' : 'Feature simulada'}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">{question.title}</h2>
          <p className="mt-3 text-gray-400">{question.subtitle}</p>
        </div>

        <div className={`mt-8 grid gap-4 ${question.kind === 'grid' ? 'sm:grid-cols-2' : ''}`}>
          {question.options.map((option) => {
            const isSelected = JSON.stringify(currentAnswer) === JSON.stringify(option.value);
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => selectOption(option.value)}
                className={`rounded-3xl border px-5 py-5 text-left transition duration-200 ${
                  isSelected
                    ? 'border-pink-400 bg-gradient-to-br from-pink-500/20 to-purple-500/20 shadow-lg shadow-pink-950/20'
                    : 'border-white/10 bg-white/5 hover:border-purple-400/40 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-medium text-white">{option.label}</div>
                    <div className="mt-2 text-sm text-gray-400">{option.note || 'Selecionar esta opção'}</div>
                  </div>
                  <div
                    className={`mt-1 h-5 w-5 rounded-full border ${
                      isSelected ? 'border-pink-300 bg-pink-400' : 'border-white/20'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              if (step === 0) {
                onBack();
                return;
              }
              setStep((value) => value - 1);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-200 transition hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 0 ? 'Voltar ao início' : 'Anterior'}
          </button>

          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => {
              if (step === questions.length - 1) {
                onAnalyze(answers);
                return;
              }
              setStep((value) => value + 1);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-medium transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === questions.length - 1 ? 'Analisar agora' : 'Próxima'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function LoadingView() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % LOADING_MESSAGES.length);
    }, 760);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center shadow-2xl shadow-purple-950/30 backdrop-blur">
        <div className="mx-auto flex w-fit items-end gap-2 rounded-full border border-pink-500/20 bg-pink-500/5 px-6 py-4">
          <div className="h-8 w-2 animate-pulse rounded-full bg-pink-400" />
          <div className="h-12 w-2 animate-pulse rounded-full bg-purple-400 [animation-delay:120ms]" />
          <div className="h-6 w-2 animate-pulse rounded-full bg-fuchsia-300 [animation-delay:240ms]" />
          <div className="h-10 w-2 animate-pulse rounded-full bg-purple-400 [animation-delay:360ms]" />
          <div className="h-7 w-2 animate-pulse rounded-full bg-pink-400 [animation-delay:480ms]" />
        </div>
        <h1 className="mt-8 text-3xl font-semibold">Processando sua faixa</h1>
        <p className="mt-4 text-lg text-gray-300">{LOADING_MESSAGES[messageIndex]}</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
          Nesta versão, o app usa artefatos exportados do dataset para prever popularidade e localizar músicas populares parecidas.
        </p>
      </div>
    </section>
  );
}

function ResultsView({ result, artifacts, onRestart, onGoHome }) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  if (!result) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-purple-950/25 backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-pink-200/80">Resultado previsto</div>
                <h1 className="mt-3 text-3xl font-semibold">Popularidade estimada</h1>
                <p className="mt-3 max-w-2xl text-gray-400">{result.profile}</p>
              </div>
              <div className="rounded-[2rem] bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-6 text-center">
                <div className="text-6xl font-semibold">{result.score}</div>
                <div className="mt-2 text-sm text-gray-300">/100</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm ${result.isHit ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border border-amber-400/20 bg-amber-400/10 text-amber-200'}`}>
                {result.isHit ? 'Hit estimado: Sim' : 'Hit estimado: Não'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                {result.classification}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                Gênero: {result.technical.genre_label || result.technical.genre}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                Referência: {result.technical.artist}
              </span>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <SignalList title="O que impulsionou o score" items={result.pros} positive />
              <SignalList title="O que reduziu o score" items={result.cons} />
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={onRestart}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-medium transition hover:scale-105"
              >
                Analisar outra música
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-gray-200 transition hover:bg-white/10"
              >
                Voltar ao início
              </button>
              <button
                type="button"
                onClick={() => setShowTechnical((value) => !value)}
                className="rounded-full border border-purple-400/30 bg-purple-500/10 px-6 py-3 text-sm text-purple-100 transition hover:bg-purple-500/20"
              >
                {showTechnical ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}
              </button>
            </div>

            {showTechnical && (
              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-gray-900/80 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-purple-200" />
                  <h3 className="text-lg font-semibold">Payload técnico usado na estimativa</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FEATURE_KEYS.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200"
                    >
                      <span className="text-gray-400">{formatFeatureLabel(feature)}:</span>{' '}
                      {result.technical[feature].toFixed(feature === 'tempo' ? 0 : 2)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-pink-200/80">Faixas parecidas</div>
                <h2 className="mt-2 text-2xl font-semibold">3 músicas populares similares</h2>
              </div>
              <div className="text-sm text-gray-400">Clique para comparar</div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {result.similarTracks.map((track) => (
                <button
                  key={`${track.track_name}-${track.artist}`}
                  type="button"
                  onClick={() => setSelectedTrack(track)}
                  className="rounded-[1.75rem] border border-white/10 bg-gray-900/75 p-4 text-left transition hover:-translate-y-1 hover:border-purple-400/40"
                >
                  <div className="relative">
                    <TrackCover
                      track={track}
                      className="h-40 w-full rounded-[1.25rem] object-cover shadow-lg shadow-black/20"
                    />
                    <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white/90 backdrop-blur">
                      {track.match}% match
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-lg font-medium">{track.track_name}</div>
                    <div className="mt-1 text-sm text-gray-400">{track.artist}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                    <span>{track.genre}</span>
                    <span>Popularidade {track.popularity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/12 to-purple-500/12 p-8 backdrop-blur">
            <div className="text-sm uppercase tracking-[0.3em] text-pink-200/80">Resumo do pipeline</div>
            <h2 className="mt-2 text-2xl font-semibold">Como o site decide</h2>
            <div className="mt-6 space-y-4">
              <MiniPipelineStep icon={Mic2} title="Entrada leiga" text="Você responde um formulário simples sem precisar de áudio bruto." />
              <MiniPipelineStep icon={Waves} title="Conversão de métricas" text="O app monta o vetor de features nas mesmas dimensões usadas no notebook." />
              <MiniPipelineStep icon={Brain} title="Estimativa da nota" text="A popularidade é aproximada pela semelhança com faixas do dataset e pelos encodings históricos." />
              <MiniPipelineStep icon={Music2} title="Retorno de similares" text="As 3 recomendações vêm das músicas populares mais próximas no espaço de features." />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold">Leitura rápida</h2>
            <div className="mt-6 space-y-4">
              <QuickMetric label="Energia" value={result.technical.energy} />
              <QuickMetric label="Danceability" value={result.technical.danceability} />
              <QuickMetric label="Clima emocional" value={result.technical.valence} />
              <QuickMetric label="Acousticness" value={result.technical.acousticness} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold">Contexto do dataset</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <div>Fonte: {artifacts.source.dataset_name}</div>
              <div>Média global de popularidade: {artifacts.source.global_mean_popularity.toFixed(1)}</div>
              <div>Limiar de hit aplicado: {artifacts.source.hit_threshold}</div>
              <div>Gerado em: {artifacts.source.generated_at}</div>
            </div>
          </div>
        </div>
      </div>

      {selectedTrack && (
        <ComparisonModal
          technical={result.technical}
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </section>
  );
}

function SignalList({ title, items, positive = false }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-gray-900/70 p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item} className="flex gap-3 text-sm text-gray-300">
              <span className={positive ? 'text-emerald-300' : 'text-rose-300'}>{positive ? '✓' : '✗'}</span>
              <span>{item}</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">Nenhum sinal forte nesta categoria.</div>
        )}
      </div>
    </div>
  );
}

function QuickMetric({ label, value }) {
  const percentage = typeof value === 'number' && value <= 1 ? Math.round(value * 100) : Math.round((value / 180) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-gray-300">
        <span>{label}</span>
        <span>{compareValue(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
          style={{ width: `${clamp(percentage, 8, 100)}%` }}
        />
      </div>
    </div>
  );
}

function MiniPipelineStep({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-4 rounded-3xl border border-white/10 bg-gray-900/60 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-pink-100">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-sm text-gray-400">{text}</div>
      </div>
    </div>
  );
}

function ComparisonModal({ technical, track, onClose }) {
  const rows = [
    ['Energia', technical.energy, track.features.energy],
    ['Danceability', technical.danceability, track.features.danceability],
    ['Valence', technical.valence, track.features.valence],
    ['Acousticness', technical.acousticness, track.features.acousticness],
    ['Tempo', technical.tempo, track.features.tempo],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-gray-900 p-6 shadow-2xl shadow-purple-950/30 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <TrackCover
              track={track}
              className="h-24 w-24 rounded-[1.25rem] object-cover shadow-lg shadow-black/30"
            />
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-pink-200/80">Comparação direta</div>
              <h2 className="mt-2 text-2xl font-semibold">
                Sua música vs. {track.track_name}
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                {track.artist} · {track.genre} · popularidade {track.popularity}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 p-3 text-gray-300 transition hover:bg-white/5"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/10">
          <div className="grid grid-cols-3 bg-white/5 px-5 py-4 text-sm font-medium text-gray-300">
            <div>Atributo</div>
            <div>Sua música</div>
            <div>{track.track_name}</div>
          </div>
          {rows.map(([label, ownValue, refValue]) => (
            <div
              key={label}
              className="grid grid-cols-3 border-t border-white/10 px-5 py-4 text-sm text-gray-200"
            >
              <div>{label}</div>
              <div>{compareValue(ownValue)}</div>
              <div>{compareValue(refValue)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AboutView({ artifacts, onAnalyzeClick }) {
  const notebookMetrics = artifacts.source.notebook_metrics;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-purple-950/20 backdrop-blur">
        <div className="max-w-3xl">
          <div className="text-sm uppercase tracking-[0.3em] text-pink-200/80">Sobre o projeto</div>
          <h1 className="mt-3 text-4xl font-semibold">Como o site se relaciona com o notebook</h1>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            O notebook prepara as colunas do dataset, cria `genre_encoded` e `artist_encoded` e mede o desempenho dos modelos. O site reaproveita essa estrutura conceitual para transformar perguntas em features e comparar o resultado com faixas exportadas do Kaggle.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          <FlowCard icon={Mic2} title="1. Perguntas" text="O usuário descreve a música sem precisar entender métricas técnicas." />
          <FlowCard icon={Waves} title="2. Features" text="O frontend monta o vetor com as mesmas dimensões principais do notebook." />
          <FlowCard icon={Brain} title="3. Predição" text="A nota é estimada usando histórico de popularidade e similaridade com o dataset exportado." />
          <FlowCard icon={Music2} title="4. Recomendação" text="O app retorna 3 músicas populares próximas ao perfil encontrado." />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-gray-900/70 p-6">
            <h2 className="text-xl font-semibold">Features usadas</h2>
            <p className="mt-3 text-sm text-gray-400">
              {artifacts.stats.feature_list.join(', ')}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-400/20 bg-amber-500/10 p-6">
            <h2 className="text-xl font-semibold text-amber-100">Limitação importante</h2>
            <p className="mt-3 text-sm text-amber-50/80">
              Esta versão foi desenhada para hospedagem estática gratuita. Ela usa artefatos exportados do dataset, não um backend Python rodando Random Forest em tempo real.
            </p>
          </div>
        </div>

        {notebookMetrics && (
          <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-gray-900/70 p-6">
            <h2 className="text-xl font-semibold">Métricas medidas no notebook</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <MetricCard label="Random Forest" value={`MAE ${notebookMetrics.random_forest.mae} · R² ${notebookMetrics.random_forest.r2}`} />
              <MetricCard label="XGBoost" value={`MAE ${notebookMetrics.xgboost.mae} · R² ${notebookMetrics.xgboost.r2}`} />
              <MetricCard label="LightGBM" value={`MAE ${notebookMetrics.lightgbm.mae} · R² ${notebookMetrics.lightgbm.r2}`} />
            </div>
          </div>
        )}

        <div className="mt-10">
          <button
            type="button"
            onClick={onAnalyzeClick}
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-medium transition hover:scale-105"
          >
            Experimentar análise
          </button>
        </div>
      </div>
    </section>
  );
}

function FlowCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-gray-900/70 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-100">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-400">{text}</p>
    </div>
  );
}

function ExploreView({ artifacts, onAnalyzeClick }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-purple-950/20 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-sm uppercase tracking-[0.3em] text-pink-200/80">Exploração do dataset</div>
              <h1 className="mt-3 text-4xl font-semibold">Panorama do arquivo exportado do Kaggle</h1>
              <p className="mt-4 text-lg text-gray-300">
                As estatísticas abaixo vêm do artefato JSON consumido pelo site. Quando você gerar um novo artefato, esta tela passa a refletir os seus dados reais.
              </p>
            </div>
            <button
              type="button"
              onClick={onAnalyzeClick}
              className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-medium transition hover:scale-105"
            >
              Analisar uma música
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Faixas" value={artifacts.stats.total_tracks.toLocaleString('pt-BR')} />
            <MetricCard label="Gêneros" value={String(artifacts.stats.unique_genres)} />
            <MetricCard label="Média de popularidade" value={artifacts.source.global_mean_popularity.toFixed(1)} />
            <MetricCard label="Limiar de hit" value={String(artifacts.source.hit_threshold)} />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold">Distribuição de popularidade</h2>
            <div className="mt-8 space-y-4">
              {artifacts.stats.popularity_buckets.map((bucket) => (
                <div key={bucket.label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-gray-300">
                    <span>{bucket.label}</span>
                    <span>{bucket.percentage}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                      style={{ width: `${bucket.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold">Gêneros mais representados</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {artifacts.stats.top_genres.map((genre) => (
                <div key={genre.genre} className="rounded-3xl border border-white/10 bg-gray-900/70 p-5">
                  <div className="text-lg font-medium">{genre.genre}</div>
                  <div className="mt-2 text-sm text-gray-400">{genre.count.toLocaleString('pt-BR')} faixas</div>
                  <div className="mt-1 text-sm text-gray-400">Popularidade média {genre.avg_popularity.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold">Features utilizadas</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {artifacts.stats.feature_list.map((feature) => (
              <div key={feature} className="rounded-full border border-white/10 bg-gray-900/70 px-4 py-2 text-sm text-gray-200">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-gray-900/70 p-5">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}

export default App;
