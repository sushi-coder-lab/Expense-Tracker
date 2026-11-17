from datetime import date
from pydantic import BaseModel, ConfigDict, Field, field_validator

class ExpenseBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0, allow_inf_nan=False)
    category: str = Field(min_length=1, max_length=50)
    date: date
    notes: str = Field(default="", max_length=500)

    @field_validator("title", "category")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be empty")
        return value

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    message: str
