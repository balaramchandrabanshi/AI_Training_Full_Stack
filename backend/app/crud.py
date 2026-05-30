import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import hash_password


# ── Users ─────────────────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, email: str, password: str, name: Optional[str] = None) -> models.User:
    user = models.User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hash_password(password),
        name=name if name else email.split("@")[0],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Inventories ───────────────────────────────────────────────────────────────

def get_inventories(db: Session, owner_id: str) -> List[schemas.InventoryOut]:
    inventories = (
        db.query(models.Inventory)
        .filter(models.Inventory.owner_id == owner_id)
        .all()
    )
    result = []
    for inv in inventories:
        category_count = len(inv.categories)
        item_count = sum(len(cat.items) for cat in inv.categories)
        result.append(
            schemas.InventoryOut(
                id=inv.id,
                name=inv.name,
                description=inv.description,
                category_count=category_count,
                item_count=item_count,
                created_at=inv.created_at,
            )
        )
    return result


def get_inventory(db: Session, inv_id: str, owner_id: str) -> Optional[models.Inventory]:
    return (
        db.query(models.Inventory)
        .filter(models.Inventory.id == inv_id, models.Inventory.owner_id == owner_id)
        .first()
    )


def create_inventory(db: Session, data: schemas.InventoryCreate, owner_id: str) -> schemas.InventoryOut:
    inv = models.Inventory(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description,
        owner_id=owner_id,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return schemas.InventoryOut(
        id=inv.id,
        name=inv.name,
        description=inv.description,
        category_count=0,
        item_count=0,
        created_at=inv.created_at,
    )


def update_inventory(
    db: Session, inv: models.Inventory, data: schemas.InventoryUpdate
) -> schemas.InventoryOut:
    inv.name = data.name
    inv.description = data.description
    db.commit()
    db.refresh(inv)
    category_count = len(inv.categories)
    item_count = sum(len(cat.items) for cat in inv.categories)
    return schemas.InventoryOut(
        id=inv.id,
        name=inv.name,
        description=inv.description,
        category_count=category_count,
        item_count=item_count,
        created_at=inv.created_at,
    )


def delete_inventory(db: Session, inv: models.Inventory) -> None:
    db.delete(inv)
    db.commit()


# ── Categories ────────────────────────────────────────────────────────────────

def get_categories(
    db: Session, inv_id: str, owner_id: str
) -> Optional[List[schemas.CategoryOut]]:
    inv = get_inventory(db, inv_id, owner_id)
    if inv is None:
        return None
    result = []
    for cat in inv.categories:
        item_count = len(cat.items)
        total_quantity = sum(item.quantity for item in cat.items)
        result.append(
            schemas.CategoryOut(
                id=cat.id,
                name=cat.name,
                description=cat.description,
                inventory_id=cat.inventory_id,
                item_count=item_count,
                total_quantity=total_quantity,
                created_at=cat.created_at,
            )
        )
    return result


def get_category(
    db: Session, cat_id: str, owner_id: str
) -> Optional[models.Category]:
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if cat is None:
        return None
    inv = get_inventory(db, cat.inventory_id, owner_id)
    if inv is None:
        return None
    return cat


def create_category(
    db: Session, inv_id: str, data: schemas.CategoryCreate
) -> schemas.CategoryOut:
    cat = models.Category(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description,
        inventory_id=inv_id,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return schemas.CategoryOut(
        id=cat.id,
        name=cat.name,
        description=cat.description,
        inventory_id=cat.inventory_id,
        item_count=0,
        total_quantity=0,
        created_at=cat.created_at,
    )


def update_category(
    db: Session, cat: models.Category, data: schemas.CategoryUpdate
) -> schemas.CategoryOut:
    cat.name = data.name
    cat.description = data.description
    db.commit()
    db.refresh(cat)
    item_count = len(cat.items)
    total_quantity = sum(item.quantity for item in cat.items)
    return schemas.CategoryOut(
        id=cat.id,
        name=cat.name,
        description=cat.description,
        inventory_id=cat.inventory_id,
        item_count=item_count,
        total_quantity=total_quantity,
        created_at=cat.created_at,
    )


def delete_category(db: Session, cat: models.Category) -> None:
    db.delete(cat)
    db.commit()


# ── Items ─────────────────────────────────────────────────────────────────────

def get_items(
    db: Session,
    owner_id: str,
    cat_id: Optional[str] = None,
    inv_id: Optional[str] = None,
) -> List[models.InventoryItem]:
    query = (
        db.query(models.InventoryItem)
        .join(models.Category, models.InventoryItem.category_id == models.Category.id)
        .join(models.Inventory, models.Category.inventory_id == models.Inventory.id)
        .filter(models.Inventory.owner_id == owner_id)
    )
    if cat_id:
        query = query.filter(models.InventoryItem.category_id == cat_id)
    if inv_id:
        query = query.filter(models.Category.inventory_id == inv_id)
    return query.all()


def get_item(db: Session, item_id: str, owner_id: str) -> Optional[models.InventoryItem]:
    return (
        db.query(models.InventoryItem)
        .join(models.Category, models.InventoryItem.category_id == models.Category.id)
        .join(models.Inventory, models.Category.inventory_id == models.Inventory.id)
        .filter(
            models.InventoryItem.id == item_id,
            models.Inventory.owner_id == owner_id,
        )
        .first()
    )


def create_item(db: Session, data: schemas.ItemCreate) -> models.InventoryItem:
    item = models.InventoryItem(
        id=str(uuid.uuid4()),
        name=data.name,
        sku=data.sku.strip().upper(),
        category_id=data.category_id,
        quantity=data.quantity,
        min_stock=data.min_stock,
        price=data.price,
        cost=data.cost,
        supplier=data.supplier,
        unit=data.unit,
        status=data.status,
        image=data.image,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_item(db: Session, item: models.InventoryItem, data: schemas.ItemUpdate) -> models.InventoryItem:
    item.name = data.name
    item.sku = data.sku.strip().upper()
    item.category_id = data.category_id
    item.quantity = data.quantity
    item.min_stock = data.min_stock
    item.price = data.price
    item.cost = data.cost
    item.supplier = data.supplier
    item.unit = data.unit
    item.status = data.status
    item.image = data.image
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item: models.InventoryItem) -> None:
    db.delete(item)
    db.commit()


# ── Dashboard ─────────────────────────────────────────────────────────────────

def get_dashboard_stats(db: Session, owner_id: str) -> schemas.DashboardStats:
    items = get_items(db, owner_id)

    total_items = len(items)
    in_stock = sum(1 for i in items if i.quantity > i.min_stock)
    low_stock = sum(1 for i in items if 0 < i.quantity <= i.min_stock)
    out_of_stock = sum(1 for i in items if i.quantity == 0)
    total_value = sum(i.price * i.quantity for i in items)
    total_cost = sum(i.cost * i.quantity for i in items)

    inventory_count = (
        db.query(models.Inventory)
        .filter(models.Inventory.owner_id == owner_id)
        .count()
    )
    category_count = (
        db.query(models.Category)
        .join(models.Inventory, models.Category.inventory_id == models.Inventory.id)
        .filter(models.Inventory.owner_id == owner_id)
        .count()
    )

    return schemas.DashboardStats(
        total_items=total_items,
        in_stock=in_stock,
        low_stock=low_stock,
        out_of_stock=out_of_stock,
        total_value=total_value,
        total_cost=total_cost,
        inventory_count=inventory_count,
        category_count=category_count,
    )
