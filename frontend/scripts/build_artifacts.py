#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path

FEATURE_KEYS = [
    "danceability",
    "energy",
    "valence",
    "acousticness",
    "instrumentalness",
    "speechiness",
    "liveness",
    "tempo",
    "genre_encoded",
    "artist_encoded",
]

RAW_FEATURE_KEYS = [
    "danceability",
    "energy",
    "valence",
    "acousticness",
    "instrumentalness",
    "speechiness",
    "liveness",
    "tempo",
]

NOTEBOOK_METRICS = {
    "random_forest": {"mae": 8.06, "r2": 0.64},
    "xgboost": {"mae": 8.63, "r2": 0.62},
    "lightgbm": {"mae": 8.70, "r2": 0.62},
}

PREFERRED_GENRES = [
    ("pop", "Pop"),
    ("funk", "Funk"),
    ("hip-hop", "Rap / Hip-Hop"),
    ("electronic", "Eletrônica"),
    ("sertanejo", "Sertanejo"),
    ("rock", "Rock"),
    ("indie", "Indie"),
    ("dance", "Dance"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gera public/data/model-artifacts.json a partir do dataset do Kaggle."
    )
    parser.add_argument(
        "--input",
        default="data/dataset.csv",
        help="Caminho para o CSV do Kaggle. Padrão: data/dataset.csv",
    )
    parser.add_argument(
        "--output",
        default="public/data/model-artifacts.json",
        help="Arquivo de saída JSON. Padrão: public/data/model-artifacts.json",
    )
    parser.add_argument(
        "--hit-threshold",
        type=int,
        default=70,
        help="Limiar para classificar uma faixa como hit. Padrão: 70",
    )
    parser.add_argument(
        "--reference-limit",
        type=int,
        default=360,
        help="Quantidade aproximada de faixas de referência exportadas. Padrão: 360",
    )
    parser.add_argument(
        "--popular-limit",
        type=int,
        default=240,
        help="Quantidade máxima de faixas populares exportadas. Padrão: 240",
    )
    return parser.parse_args()


def to_float(row: dict[str, str], field: str) -> float | None:
    value = row.get(field)
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def to_int(row: dict[str, str], field: str) -> int | None:
    value = row.get(field)
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def normalize_artist(raw: str) -> str:
    text = (raw or "").strip()
    if text.startswith("[") and text.endswith("]"):
        text = text[1:-1]
    text = text.replace("'", "").replace('"', "")
    for separator in [";", ","]:
        if separator in text:
            text = text.split(separator, 1)[0]
            break
    return text.strip() or "Artista desconhecido"


def pick_cover_url(row: dict[str, str]) -> str | None:
    possible_fields = [
        "cover_url",
        "image_url",
        "album_image_url",
        "artwork_url",
        "artworkUrl100",
        "artworkUrl60",
    ]
    for field in possible_fields:
        value = (row.get(field) or "").strip()
        if value.startswith("http://") or value.startswith("https://"):
            return value
    return None


def bucket_label(popularity: int) -> str:
    if popularity <= 20:
        return "0-20"
    if popularity <= 40:
        return "21-40"
    if popularity <= 60:
        return "41-60"
    if popularity <= 80:
        return "61-80"
    return "81-100"


def sample_evenly(items: list[dict], limit: int) -> list[dict]:
    if limit <= 0 or len(items) <= limit:
        return items[:]
    if limit == 1:
        return [items[0]]

    result = []
    step = (len(items) - 1) / (limit - 1)
    for index in range(limit):
        result.append(items[round(index * step)])
    return result


def dedupe_tracks(items: list[dict]) -> list[dict]:
    seen: set[tuple[str, str]] = set()
    deduped: list[dict] = []
    for item in items:
        key = (item["track_name"].lower(), item["artist"].lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def export_track(record: dict) -> dict:
    exported = {
        "track_name": record["track_name"],
        "artist": record["artist"],
        "genre": record["genre"],
        "popularity": record["popularity"],
        "features": {key: record["features"][key] for key in FEATURE_KEYS},
    }
    if record.get("cover_url"):
        exported["cover_url"] = record["cover_url"]
    return exported


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        raise SystemExit(
            f"Dataset não encontrado em {input_path}. Coloque o CSV do Kaggle nesse caminho ou use --input."
        )

    records: list[dict] = []
    genre_stats: dict[str, dict[str, float]] = defaultdict(lambda: {"sum": 0.0, "count": 0})
    artist_stats: dict[str, dict[str, float]] = defaultdict(lambda: {"sum": 0.0, "count": 0})
    genre_artist_stats: dict[str, dict[str, dict[str, float | str | None]]] = defaultdict(
        lambda: defaultdict(
            lambda: {
                "sum": 0.0,
                "count": 0,
                "top_track": "",
                "top_popularity": -1,
                "cover_url": None,
            }
        )
    )
    popularity_buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}

    global_popularity_sum = 0.0

    with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            track_name = (row.get("track_name") or "").strip()
            genre = (row.get("track_genre") or "").strip()
            artist = normalize_artist(row.get("artists", ""))
            popularity = to_int(row, "popularity")

            if not track_name or not genre or popularity is None:
                continue

            raw_features: dict[str, float] = {}
            valid = True
            for feature in RAW_FEATURE_KEYS:
                parsed = to_float(row, feature)
                if parsed is None:
                    valid = False
                    break
                raw_features[feature] = parsed

            if not valid:
                continue

            record = {
                "track_name": track_name,
                "artist": artist,
                "genre": genre,
                "popularity": popularity,
                "cover_url": pick_cover_url(row),
                "features": raw_features,
            }
            records.append(record)

            global_popularity_sum += popularity
            genre_stats[genre]["sum"] += popularity
            genre_stats[genre]["count"] += 1
            artist_stats[artist]["sum"] += popularity
            artist_stats[artist]["count"] += 1
            genre_artist_stats[genre][artist]["sum"] += popularity
            genre_artist_stats[genre][artist]["count"] += 1
            if popularity > genre_artist_stats[genre][artist]["top_popularity"]:
                genre_artist_stats[genre][artist]["top_popularity"] = popularity
                genre_artist_stats[genre][artist]["top_track"] = track_name
                genre_artist_stats[genre][artist]["cover_url"] = record["cover_url"]
            popularity_buckets[bucket_label(popularity)] += 1

    if not records:
        raise SystemExit("Nenhuma linha válida foi encontrada no CSV.")

    total_tracks = len(records)
    global_mean = global_popularity_sum / total_tracks

    genre_encoded = {
        genre: values["sum"] / values["count"] for genre, values in genre_stats.items() if values["count"] > 0
    }
    artist_encoded = {
        artist: values["sum"] / values["count"] for artist, values in artist_stats.items() if values["count"] > 0
    }

    for record in records:
        record["features"]["genre_encoded"] = genre_encoded.get(record["genre"], global_mean)
        record["features"]["artist_encoded"] = artist_encoded.get(record["artist"], global_mean)

    ranges = {
        key: {"min": float("inf"), "max": float("-inf")} for key in FEATURE_KEYS
    }
    for record in records:
        for key in FEATURE_KEYS:
            value = record["features"][key]
            if value < ranges[key]["min"]:
                ranges[key]["min"] = value
            if value > ranges[key]["max"]:
                ranges[key]["max"] = value

    popular_records = [record for record in records if record["popularity"] >= args.hit_threshold]
    centroid_source = popular_records if popular_records else records
    popular_centroid = {}
    for key in FEATURE_KEYS:
        popular_centroid[key] = sum(item["features"][key] for item in centroid_source) / len(centroid_source)

    sorted_genres = sorted(
        genre_stats.items(),
        key=lambda item: (item[1]["count"], item[1]["sum"] / item[1]["count"]),
        reverse=True,
    )
    top_genres = [
        {
            "genre": genre,
            "count": int(values["count"]),
            "avg_popularity": round(values["sum"] / values["count"], 2),
        }
        for genre, values in sorted_genres[:8]
    ]

    options_genres = []
    genre_lookup = {genre.lower(): genre for genre in genre_stats.keys()}
    selected_genres: set[str] = set()

    for raw_name, label in PREFERRED_GENRES:
        actual_name = genre_lookup.get(raw_name)
        if not actual_name:
            continue
        options_genres.append(
            {
                "genre": actual_name,
                "label": label,
                "genre_encoded": round(genre_encoded[actual_name], 2),
            }
        )
        selected_genres.add(actual_name)

    for item in top_genres:
        if len(options_genres) >= 8:
            break
        if item["genre"] in selected_genres:
            continue
        options_genres.append(
            {
                "genre": item["genre"],
                "label": item["genre"].replace("-", " ").title(),
                "genre_encoded": item["avg_popularity"],
            }
        )
        selected_genres.add(item["genre"])

    sorted_records = dedupe_tracks(sorted(records, key=lambda item: item["popularity"], reverse=True))
    sorted_popular = [item for item in sorted_records if item["popularity"] >= args.hit_threshold]

    artists_by_genre: dict[str, list[dict]] = {}
    for genre_item in options_genres:
        genre = genre_item["genre"]
        genre_records = [item for item in sorted_records if item["genre"] == genre]
        chosen_artists: list[dict] = []
        seen_artists: set[str] = set()

        for track in genre_records:
            artist = track["artist"]
            if artist in seen_artists:
                continue

            stats = genre_artist_stats[genre][artist]
            average = stats["sum"] / stats["count"]
            chosen_artists.append(
                {
                    "artist": artist,
                    "artist_encoded": round(average, 2),
                    "top_track": str(stats["top_track"]),
                    "top_popularity": int(stats["top_popularity"]),
                    "note": f"Destaque: {stats['top_track']} ({int(stats['top_popularity'])})",
                    "cover_url": stats["cover_url"],
                }
            )
            seen_artists.add(artist)
            if len(chosen_artists) == 6:
                break

        if len(chosen_artists) < 6:
            fallback_candidates = []
            for artist, values in genre_artist_stats[genre].items():
                if artist in seen_artists:
                    continue
                average = values["sum"] / values["count"]
                fallback_candidates.append(
                    {
                        "artist": artist,
                        "artist_encoded": round(average, 2),
                        "top_track": str(values["top_track"]),
                        "top_popularity": int(values["top_popularity"]),
                        "note": f"Destaque: {values['top_track']} ({int(values['top_popularity'])})",
                        "cover_url": values["cover_url"],
                    }
                )
            fallback_candidates.sort(
                key=lambda item: (item["top_popularity"], item["artist_encoded"]),
                reverse=True,
            )
            chosen_artists.extend(fallback_candidates[: max(0, 6 - len(chosen_artists))])

        artists_by_genre[genre] = chosen_artists

    grouped_by_bucket: dict[str, list[dict]] = defaultdict(list)
    for item in sorted_records:
        grouped_by_bucket[bucket_label(item["popularity"])].append(item)

    per_bucket_limit = max(args.reference_limit // 5, 1)
    reference_tracks: list[dict] = []
    reference_tracks.extend(sample_evenly(sorted_records[:120], min(120, len(sorted_records))))
    for label in ["0-20", "21-40", "41-60", "61-80", "81-100"]:
        reference_tracks.extend(sample_evenly(grouped_by_bucket[label], per_bucket_limit))

    reference_tracks = dedupe_tracks(reference_tracks)
    reference_tracks = reference_tracks[: args.reference_limit]
    popular_tracks = sample_evenly(sorted_popular, min(args.popular_limit, len(sorted_popular)))

    popularity_percentages = []
    for label in ["0-20", "21-40", "41-60", "61-80", "81-100"]:
        percentage = popularity_buckets[label] * 100 / total_tracks
        popularity_percentages.append({"label": label, "percentage": round(percentage, 2)})

    artifact = {
        "source": {
            "dataset_name": "Spotify Tracks Dataset (Kaggle)",
            "generated_at": datetime.now().date().isoformat(),
            "global_mean_popularity": round(global_mean, 2),
            "hit_threshold": args.hit_threshold,
            "mode": "generated",
            "notebook_metrics": NOTEBOOK_METRICS,
            "note": "Artefato gerado localmente a partir do CSV do Kaggle para uso estático no frontend.",
        },
        "stats": {
            "total_tracks": total_tracks,
            "unique_genres": len(genre_stats),
            "feature_list": FEATURE_KEYS,
            "popularity_buckets": popularity_percentages,
            "top_genres": top_genres,
        },
        "ranges": {key: {"min": round(value["min"], 4), "max": round(value["max"], 4)} for key, value in ranges.items()},
        "popular_centroid": {key: round(value, 4) for key, value in popular_centroid.items()},
        "options": {
            "genres": options_genres,
            "artists_by_genre": artists_by_genre,
        },
        "reference_tracks": [export_track(item) for item in reference_tracks],
        "popular_tracks": [export_track(item) for item in popular_tracks],
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Artefato gerado em {output_path} com {len(reference_tracks)} referências e {len(popular_tracks)} faixas populares.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
