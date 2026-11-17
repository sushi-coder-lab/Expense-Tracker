from fastapi.testclient import TestClient
from app.main import app
from app.config import EXPENSES_FILE
from app.utils import write_csv_rows

client = TestClient(app)


def setup_function():
    # Isolate tests by resetting the CSV before each test.
    write_csv_rows(EXPENSES_FILE, [])


def test_create_and_get_expense():
    response = client.post("/expenses", json={
        "title": "Lunch", "amount": 250, "category": "Food",
        "date": "2026-09-25", "notes": "Office lunch"
    })
    assert response.status_code == 201
    created = response.json()
    assert created["id"] == 1
    assert created["title"] == "Lunch"

    fetched = client.get("/expenses/1")
    assert fetched.status_code == 200
    assert fetched.json()["amount"] == 250


def test_amount_must_be_positive():
    response = client.post("/expenses", json={
        "title": "Invalid", "amount": 0, "category": "Food", "date": "2026-09-25"
    })
    assert response.status_code == 422


def test_missing_expense_returns_404():
    response = client.get("/expenses/999")
    assert response.status_code == 404


def test_reports():
    client.post("/expenses", json={
        "title": "Lunch", "amount": 250, "category": "Food", "date": "2026-09-25"
    })
    stats = client.get("/reports/statistics").json()
    assert stats["total"] == 250
    assert stats["count"] == 1
    assert client.get("/reports/category").json()["Food"] == 250
