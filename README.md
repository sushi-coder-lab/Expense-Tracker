# Expense Tracker

A full-stack expense management dashboard built with **HTML, CSS, JavaScript, Python, FastAPI, CSV, Pandas and NumPy**.

## Features

- Create, view, update and delete expenses (CRUD)
- Dashboard totals: total spending, count, average and highest expense
- Category-wise and monthly reports
- Search by title/notes, filter by category/date
- Export all recorded expenses from the browser to CSV
- Pydantic validation and useful HTTP status codes
- Interactive API documentation with Swagger UI
- Automated API tests using pytest

## Project structure

```text
expense-tracker/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/{api,dashboard,reports,expenses}.js
├── backend/
│   ├── app/{main,models,services,analytics,utils,config}.py
│   ├── data/expenses.csv
│   ├── tests/test_api.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

## Requirements

- Python 3.10 or newer
- VS Code (recommended)
- A browser
- VS Code Live Server extension for the frontend (recommended)

## Run the backend

Open a terminal in the `backend/` directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On Windows PowerShell, activate the environment with:

```powershell
.venv\\Scripts\\Activate.ps1
```

API base URL: `http://127.0.0.1:8000`

Swagger UI: `http://127.0.0.1:8000/docs`

## Run the frontend

1. Open the `frontend/` folder in VS Code.
2. Install/enable the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Keep the backend terminal running.

The API URL is configured in `frontend/js/api.js`. The backend CORS configuration allows common local Live Server ports. If you use another port, add that origin in `backend/app/main.py`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/expenses` | Create an expense |
| GET | `/expenses` | List expenses |
| GET | `/expenses?category=Food` | Filter by category |
| GET | `/expenses?date=2026-09-25` | Filter by date |
| GET | `/expenses?search=lunch` | Search title/notes |
| GET | `/expenses/{id}` | Get one expense |
| PUT | `/expenses/{id}` | Update an expense |
| DELETE | `/expenses/{id}` | Delete an expense |
| GET | `/reports/statistics` | Overall statistics |
| GET | `/reports/category` | Category totals |
| GET | `/reports/monthly` | Monthly totals |

## Example request

```json
{
  "title": "Lunch",
  "amount": 250,
  "category": "Food",
  "date": "2026-09-25",
  "notes": "Office lunch"
}
```

## Run tests

From the `backend/` directory with the virtual environment activated:

```bash
pytest -q
```

## Important notes

- CSV storage is suitable for learning and a small single-user project. It is not safe for concurrent writes from many users and does not provide database transactions.
- This starter project has no user authentication; it is not intended for storing sensitive financial data on a public deployment.
- For production, use a database such as SQLite/PostgreSQL, authentication, environment-based settings, stricter CORS origins, and deployment-specific storage.

## Future improvements

- SQLite/PostgreSQL
- User accounts and JWT authentication
- Date-range reports and charts
- Excel export
- Docker and CI/CD
- Cloud deployment
