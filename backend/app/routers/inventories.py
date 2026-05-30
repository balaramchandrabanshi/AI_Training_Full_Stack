from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_user

router = APIRouter(prefix="/api/inventories", tags=["Inventories"])


@router.get("", response_model=List[schemas.InventoryOut])
def list_inventories(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_inventories(db, current_user.id)


@router.post("", response_model=schemas.InventoryOut, status_code=201)
def create_inventory(
    data: schemas.InventoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_inventory(db, data, current_user.id)


@router.get("/{inv_id}", response_model=schemas.InventoryOut)
def get_inventory(
    inv_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inv = crud.get_inventory(db, inv_id, current_user.id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    cats = inv.categories
    category_count = len(cats)
    item_count = sum(len(c.items) for c in cats)
    return schemas.InventoryOut(
        id=inv.id,
        name=inv.name,
        description=inv.description,
        category_count=category_count,
        item_count=item_count,
        created_at=inv.created_at,
    )


@router.put("/{inv_id}", response_model=schemas.InventoryOut)
def update_inventory(
    inv_id: str,
    data: schemas.InventoryUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inv = crud.get_inventory(db, inv_id, current_user.id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return crud.update_inventory(db, inv, data)


@router.delete("/{inv_id}", status_code=204)
def delete_inventory(
    inv_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inv = crud.get_inventory(db, inv_id, current_user.id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    crud.delete_inventory(db, inv)


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/{inv_id}/categories", response_model=List[schemas.CategoryOut])
def list_categories(
    inv_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cats = crud.get_categories(db, inv_id, current_user.id)
    if cats is None:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return cats


@router.post(
    "/{inv_id}/categories",
    response_model=schemas.CategoryOut,
    status_code=201,
)
def create_category(
    inv_id: str,
    data: schemas.CategoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inv = crud.get_inventory(db, inv_id, current_user.id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return crud.create_category(db, inv_id, data)


@router.put(
    "/{inv_id}/categories/{cat_id}",
    response_model=schemas.CategoryOut,
)
def update_category(
    inv_id: str,
    cat_id: str,
    data: schemas.CategoryUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = crud.get_category(db, cat_id, current_user.id)
    if not cat or cat.inventory_id != inv_id:
        raise HTTPException(status_code=404, detail="Category not found")
    return crud.update_category(db, cat, data)


@router.delete("/{inv_id}/categories/{cat_id}", status_code=204)
def delete_category(
    inv_id: str,
    cat_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = crud.get_category(db, cat_id, current_user.id)
    if not cat or cat.inventory_id != inv_id:
        raise HTTPException(status_code=404, detail="Category not found")
    crud.delete_category(db, cat)
