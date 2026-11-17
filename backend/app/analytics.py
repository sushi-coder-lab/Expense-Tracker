from fastapi import HTTPException
from .services import get_all_expenses

def get_statistics() -> dict:
    expenses = get_all_expenses()
    if not expenses:
        return {"total": 0, "average": 0, "highest": 0, "count": 0}
    amounts = [float(item.amount) for item in expenses]
    total = sum(amounts)
    count = len(amounts)
    return {
        "total": round(total, 2),
        "average": round(total / count if count else 0, 2),
        "highest": round(max(amounts), 2),
        "count": count,
    }

def get_category_report() -> dict[str, float]:
    expenses = get_all_expenses()
    if not expenses:
        return {}
    totals = {}
    for item in expenses:
        cat = str(item.category)
        totals[cat] = totals.get(cat, 0.0) + float(item.amount)
    sorted_totals = sorted(totals.items(), key=lambda x: x[1], reverse=True)
    return {category: round(amount, 2) for category, amount in sorted_totals}

def get_monthly_report() -> dict[str, float]:
    expenses = get_all_expenses()
    if not expenses:
        return {}
    totals = {}
    for item in expenses:
        month = item.date.strftime("%Y-%m")
        totals[month] = totals.get(month, 0.0) + float(item.amount)
    sorted_totals = sorted(totals.items(), key=lambda x: x[0], reverse=True)
    return {month: round(amount, 2) for month, amount in sorted_totals}