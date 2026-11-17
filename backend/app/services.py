from datetime import date
from fastapi import HTTPException, status

from .config import EXPENSES_FILE
from .models import Expense, ExpenseCreate, ExpenseUpdate
from .utils import read_csv_rows, write_csv_rows

def _convert_row(row: dict) -> Expense:
    return Expense(
        id=int(row["id"]),
        title=row["title"],
        amount=float(row["amount"]),
        category=row["category"],
        date=date.fromisoformat(row["date"]),
        notes=row.get("notes", ""),
    )

def get_all_expenses() -> list[Expense]:
    return sorted((_convert_row(row) for row in read_csv_rows(EXPENSES_FILE)),
    key=lambda item: (item.date, item.id), reverse=True)

def get_expense_by_id(expense_id: int) -> Expense:
    for row in read_csv_rows(EXPENSES_FILE):
        if int(row["id"]) == expense_id:
            return _convert_row(row)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

def create_expense(payload: ExpenseCreate) -> Expense:
    rows = read_csv_rows(EXPENSES_FILE)
    next_id = max((int(row["id"]) for row in rows), default=0) + 1
    new_row = {
        "id": next_id,
        "title": payload.title,
        "amount": payload.amount,
        "category": payload.category,
        "date": payload.date.isoformat(),
        "notes": payload.notes,
    }
    rows.append(new_row)
    write_csv_rows(EXPENSES_FILE, rows)
    return _convert_row(new_row)

def update_expense(expense_id: int, payload: ExpenseUpdate) -> Expense:
    rows = read_csv_rows(EXPENSES_FILE)
    for row in rows:
        if int(row["id"]) == expense_id:
            row.update({
                "title": payload.title,
                "amount": payload.amount,
                "category": payload.category,
                "date": payload.date.isoformat(),
                "notes": payload.notes,
            })
            write_csv_rows(EXPENSES_FILE, rows)
            return _convert_row(row)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

def delete_expense(expense_id: int) -> None:
    rows = read_csv_rows(EXPENSES_FILE)
    remaining = [row for row in rows if int(row["id"]) != expense_id]
    if len(remaining) == len(rows):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    write_csv_rows(EXPENSES_FILE, remaining)