"""Extract dated qualifying squad records from the UEFA 2025 U19 press kit.

Usage: python scripts/extract-u19.py /path/to/2025_u19_tournament_final.pdf
Install the optional parser with: python -m pip install -r requirements-extract.txt
The source PDF is not redistributed with this repository.
"""
import argparse
import csv
import re
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
POSITIONS = {"Goalkeepers", "Defenders", "Midfielders", "Forwards"}


def extract(pdf_path):
    rows = []
    for number, page in enumerate(PdfReader(pdf_path).pages, 1):
        text = page.extract_text() or ""
        if not ("Qualifying phase" in text and "Squad" in text and "Date of birth" in text):
            continue
        country = re.search(r"TEAM PROFILE: ([A-Z ]+)", text).group(1).strip().title()
        pending = []
        for line in text.splitlines():
            line = line.strip()
            if (not line or line in POSITIONS or line == "Goals scored"
                    or "PRESS KIT" in line or "TEAM PROFILE:" in line
                    or "Qualifying phase" in line or "Date of birth" in line):
                continue
            match = re.search(r"(\d{2}/\d{2}/\d{4})", line)
            if not match:
                pending.append(line)
                continue
            name = " ".join(pending + [line[:match.start()].strip()]).strip()
            if not name:
                raise ValueError(f"Missing player name on page {number}")
            birth_date = datetime.strptime(match.group(1), "%d/%m/%Y").date().isoformat()
            rows.append(dict(country=country, player_name=name,
                             birth_date=birth_date, source_page=number))
            pending = []
        if pending:
            raise ValueError(f"Unparsed squad text on page {number}: {pending}")
    keys = {(r["country"], r["player_name"], r["birth_date"]) for r in rows}
    if len(keys) != len(rows) or len(rows) != 182 or len({r["country"] for r in rows}) != 7:
        raise ValueError(f"Unexpected coverage or duplicate records: {len(rows)} rows")
    return rows


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "data/raw/u19-players.csv")
    args = parser.parse_args()
    records = extract(args.pdf)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(records[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(records)
    print(f"Extracted {len(records)} dated qualifying squad records to {args.output.name}")
