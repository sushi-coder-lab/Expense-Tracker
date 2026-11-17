from pathlib import Path

# Resolve paths relative to the backend folder, not the terminal's current directory.
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
EXPENSES_FILE = DATA_DIR / "expenses.csv"
