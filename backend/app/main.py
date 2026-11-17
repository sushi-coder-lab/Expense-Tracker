from datetime import date
from typing import Optional

from fastapi import FastAPI, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware

from . import analytics, services
from .config import EXPENSES_FILE
from .models import Expense, ExpenseCreate, ExpenseUpdate, MessageResponse
from .utils import ensure_csv_file

app = FastAPI(
    title="Expense Tracker API",
    description="A beginner-friendly REST API for recording expenses and viewing spending reports.",
    version="1.0.0",
)

# Development CORS: frontend may be opened with Live Server on port 5500.
# For production, restrict allow_origins to your deployed frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "null",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    ensure_csv_file(EXPENSES_FILE)


@app.get("/", tags=["Health"])
def root() -> dict:
    return {"message": "Expense Tracker API is running", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health() -> dict:
    return {"status": "ok"}


@app.post("/expenses", response_model=Expense, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def add_expense(payload: ExpenseCreate) -> Expense:
    return services.create_expense(payload)


@app.get("/expenses", response_model=list[Expense], tags=["Expenses"])
def list_expenses(
    category: Optional[str] = Query(default=None, min_length=1),
    expense_date: Optional[date] = Query(default=None, alias="date"),
    search: Optional[str] = Query(default=None, min_length=1),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[Expense]:
    items = services.get_all_expenses()
    if category:
        items = [item for item in items if item.category.casefold() == category.casefold()]
    if expense_date:
        items = [item for item in items if item.date == expense_date]
    if search:
        needle = search.casefold()
        items = [item for item in items if needle in item.title.casefold() or needle in item.notes.casefold()]
    return items[skip:skip + limit]


@app.get("/expenses/{expense_id}", response_model=Expense, tags=["Expenses"])
def get_expense(expense_id: int) -> Expense:
    return services.get_expense_by_id(expense_id)


@app.put("/expenses/{expense_id}", response_model=Expense, tags=["Expenses"])
def edit_expense(expense_id: int, payload: ExpenseUpdate) -> Expense:
    return services.update_expense(expense_id, payload)


@app.delete("/expenses/{expense_id}", response_model=MessageResponse, tags=["Expenses"])
def remove_expense(expense_id: int) -> MessageResponse:
    services.delete_expense(expense_id)
    return MessageResponse(message="Expense deleted successfully")


@app.get("/reports/statistics", tags=["Reports"])
def statistics() -> dict:
    return analytics.get_statistics()


@app.get("/reports/category", tags=["Reports"])
def category_report() -> dict[str, float]:
    return analytics.get_category_report()


@app.get("/reports/monthly", tags=["Reports"])
def monthly_report() -> dict[str, float]:
    return analytics.get_monthly_report()
