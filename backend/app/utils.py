import csv
from pathlib import Path
from typing import Any

CSV_FIELDS = ["id", "title", "amount", "category", "date", "notes"]

def ensure_csv_file(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        with path.open("w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=CSV_FIELDS)
            writer.writeheader()

def read_csv_rows(path: Path) -> list[dict[str, Any]]:
    ensure_csv_file(path)
    with path.open("r", newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))

def write_csv_rows(path: Path, rows: list[dict[str, Any]]) -> None:
    ensure_csv_file(path)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)