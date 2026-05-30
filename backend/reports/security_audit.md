# 🔒 InvenTrack Backend — Security Audit Report

**Date:** 2026-05-30  
**Auditor:** Security Engineering Review (AI-assisted)  
**Scope:** `app/auth.py`, `app/database.py`, `app/crud.py`, `app/models.py`, `app/schemas.py`, `app/main.py`, `app/routers/auth.py`, `app/routers/dashboard.py`, `app/routers/inventories.py`, `app/routers/items.py`, `backend/.env`

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 2 |
| 🟡 Medium | 2 |
| 🟢 Low / Informational | 3 |

Overall the codebase demonstrates good security fundamentals — ownership checks are consistent, the ORM is used throughout (no raw SQL), and JWT decoding pins the algorithm. However **two critical issues** require immediate attention before production deployment.

---

## Finding 1 — 🔴 CRITICAL: Weak JWT Secret in `.env`

### Description
The `JWT_SECRET` value stored in `backend/.env` is:

```
JWT_SECRET=aaaaaaaaaabbbbbbbbbccccccccccdddddddddd
```

This is a **low-entropy, alphabetically-patterned string**. HMAC-SHA256 (HS256) tokens signed with this secret can be brute-forced or guessed trivially using offline dictionary and pattern attacks.

Additionally, `auth.py` falls back to a **hard-coded weak default** if the variable is unset:

```python
# app/auth.py — line 17
SECRET_KEY: str = os.getenv("JWT_SECRET", "change-me-in-production")
```

If someone deploys without setting the environment variable, all tokens are signed with the public literal `"change-me-in-production"`, making the entire authentication system trivially bypassable.

### Files Affected
- `backend/.env` (line 2)
- `app/auth.py` (line 17)

### Recommended Fix

1. **Replace** `JWT_SECRET` in `.env` with a cryptographically random 256-bit (32-byte) value:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
2. **Remove the insecure fallback default** — raise an explicit startup error if `JWT_SECRET` is unset:
   ```python
   SECRET_KEY: str = os.environ["JWT_SECRET"]  # raises KeyError at boot if missing
   ```
3. **Never commit `.env` to version control.** Add it to `.gitignore` immediately.

---

## Finding 2 — 🔴 CRITICAL: Live Database Credentials Committed in `.env`

### Description
The file `backend/.env` contains full PostgreSQL credentials including host, username and password for a live Render-hosted database:

```
DATABASE_URL=postgresql://mydb_izvj_user:jlDcWEHR7Qjt1okSwbLe8TkRRt1jU2ZU@dpg-...
```

If this file is tracked in `git` or visible to anyone with repository access, the production database is fully compromised.

### Files Affected
- `backend/.env` (line 1)

### Recommended Fix
1. **Immediately rotate** the database password on the Render dashboard.
2. Add `backend/.env` to `.gitignore` and remove it from git history using `git filter-repo` or `BFG Repo Cleaner`.
3. Use environment variables injected by your hosting platform (Render, Railway, etc.) instead of `.env` files on the server.
4. In development, use a separate local-only database with throwaway credentials.

---

## Finding 3 — 🟠 HIGH: bcrypt Work Factor Not Explicitly Configured

### Description
Password hashing in `app/auth.py` uses `bcrypt.gensalt()` without specifying a `rounds` parameter:

```python
# app/auth.py — line 27
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
```

`bcrypt.gensalt()` defaults to **12 rounds**. While 12 is acceptable today, the OWASP recommendation is **at least 10** and many modern guidelines suggest **13–14** for sensitive data given current GPU capabilities.

### Risk
- A lower-than-intended cost factor reduces resistance to offline brute-force attacks if the database is exfiltrated.

### Recommended Fix
Explicitly set and document the rounds value. Raise it to at least 13:

```python
BCRYPT_ROUNDS = 13

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(
        plain.encode("utf-8"),
        bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    ).decode("utf-8")
```

---

## Finding 4 — 🟠 HIGH: Long-Lived JWT Tokens (7-Day Expiry, No Refresh Mechanism)

### Description
Tokens are valid for **7 days** with no refresh token mechanism:

```python
# app/auth.py — line 19
ACCESS_TOKEN_EXPIRE_DAYS: int = 7
```

If a token is stolen (XSS, network interception, compromised device), the attacker has full access for up to 7 days with no way to revoke it server-side, since the application is stateless and there is no token blocklist or rotation mechanism.

### Recommended Fix
1. Reduce `ACCESS_TOKEN_EXPIRE_DAYS` to a short-lived value (e.g. 15–60 minutes for access tokens).
2. Implement a **refresh token** flow using httpOnly cookies for long-lived sessions.
3. Consider a **token revocation list** (stored in Redis or the database) for immediate invalidation on logout.

---

## Finding 5 — 🟡 MEDIUM: CORS `allow_origins=["*"]` in Production

### Description
`app/main.py` configures the CORS middleware with a fully open wildcard:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  # ⚠️ This combination is invalid per the spec
    allow_methods=["*"],
    allow_headers=["*"],
)
```

There are **two problems**:

1. **Security:** `allow_origins=["*"]` allows any website to make requests to the API. In production, this should be locked to your specific frontend origin(s).
2. **Specification Violation:** Browsers **reject** `allow_credentials=True` when combined with `allow_origins=["*"]`. The browser will block credentialed cross-origin requests. This means authentication tokens sent as headers from a third-party origin may fail silently.

### Files Affected
- `app/main.py` (lines 20–26)

### Recommended Fix
```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # e.g. ["https://yourapp.vercel.app"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## Finding 6 — 🟡 MEDIUM: Diagnostic `print()` Statements Leak Internal Information

### Description
`app/database.py` logs internal connection details to stdout unconditionally:

```python
# database.py — lines 18, 21, 24
print("Connected to PostgreSQL database.")
print(f"Warning: Could not connect to PostgreSQL ({e}). Falling back to SQLite.")
print("DATABASE_URL not set. Using SQLite.")
```

The second line includes the **raw exception object** `e`, which in the case of a connection failure can expose fragments of the `DATABASE_URL` (hostname, port, database name, or even credentials depending on the driver's error formatting).

### Recommended Fix
Replace `print()` with Python's `logging` module and ensure exceptions are sanitised before logging:

```python
import logging
logger = logging.getLogger(__name__)

logger.info("Connected to PostgreSQL database.")
logger.warning("Could not connect to PostgreSQL. Falling back to SQLite.")
# Do NOT log the exception object `e` directly if it may contain the URL
```

---

## Finding 7 — 🟢 LOW: No Input Length Validation on Free-Text Fields

### Description
Pydantic schemas in `app/schemas.py` accept `name`, `description`, `supplier`, and `sku` as unbounded `str` fields:

```python
class InventoryCreate(BaseModel):
    name: str           # no max_length
    description: Optional[str] = None  # no max_length
```

While the ORM prevents SQL injection, very long inputs can cause database column truncation errors, excessive memory usage, or denial-of-service via large payloads.

### Recommended Fix
Add length constraints using Pydantic `Field`:

```python
from pydantic import Field

class InventoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
```

---

## Finding 8 — 🟢 INFORMATIONAL: JWT Algorithm Pinned Correctly ✅

### Description
The JWT decode call explicitly pins the expected algorithm:

```python
# app/auth.py — line 57
payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
```

Passing `algorithms=[ALGORITHM]` (a list) prevents the **"algorithm confusion" (alg:none)** attack where a malicious token could declare `"alg": "none"` to bypass signature verification. This is correctly implemented.

**No action required.**

---

## Finding 9 — 🟢 INFORMATIONAL: Resource Ownership Checks Are Consistent ✅

### Description
Every authenticated endpoint that reads or mutates data passes `current_user.id` into the CRUD layer, which joins against the `owner_id` column:

| Endpoint | Ownership Check |
|---|---|
| `GET /api/inventories` | `crud.get_inventories(db, current_user.id)` ✅ |
| `GET /api/inventories/{inv_id}` | `crud.get_inventory(db, inv_id, current_user.id)` ✅ |
| `PUT /api/inventories/{inv_id}` | `crud.get_inventory(db, inv_id, current_user.id)` ✅ |
| `DELETE /api/inventories/{inv_id}` | `crud.get_inventory(db, inv_id, current_user.id)` ✅ |
| `GET /api/inventories/{inv_id}/categories` | `crud.get_categories(db, inv_id, current_user.id)` ✅ |
| `POST /api/inventories/{inv_id}/categories` | `crud.get_inventory(db, inv_id, current_user.id)` ✅ |
| `PUT /api/inventories/{inv_id}/categories/{cat_id}` | `crud.get_category(db, cat_id, current_user.id)` ✅ |
| `DELETE /api/inventories/{inv_id}/categories/{cat_id}` | `crud.get_category(db, cat_id, current_user.id)` ✅ |
| `GET /api/items` | `crud.get_items(db, current_user.id, ...)` ✅ |
| `POST /api/items` | `crud.get_category(db, data.category_id, current_user.id)` ✅ |
| `GET /api/items/{item_id}` | `crud.get_item(db, item_id, current_user.id)` ✅ |
| `PUT /api/items/{item_id}` | `crud.get_item(db, item_id, current_user.id)` + category check ✅ |
| `DELETE /api/items/{item_id}` | `crud.get_item(db, item_id, current_user.id)` ✅ |
| `GET /api/dashboard/stats` | `crud.get_dashboard_stats(db, current_user.id)` ✅ |

No IDOR (Insecure Direct Object Reference) vulnerabilities were found. **No action required.**

---

## Finding 10 — 🟢 INFORMATIONAL: No Raw SQL / SQL Injection Risk ✅

### Description
All database interactions use SQLAlchemy ORM queries with bound parameters. No raw string interpolation into SQL statements was found anywhere in `crud.py` or the router files. The single `text("SELECT 1")` call in `database.py` is a hard-coded health-check literal with no user input.

**No action required.**

---

## Prioritised Remediation Checklist

| Priority | Finding | Action |
|---|---|---|
| 🔴 **Immediate** | Weak JWT secret & fallback default | Rotate secret, remove fallback, update `.env` |
| 🔴 **Immediate** | DB credentials in `.env` committed | Rotate DB password, remove from git history, add to `.gitignore` |
| 🟠 **Before Go-Live** | bcrypt rounds not explicit | Set `rounds=13` explicitly |
| 🟠 **Before Go-Live** | 7-day JWT, no revocation | Shorten expiry, add refresh token flow |
| 🟡 **Soon** | CORS wildcard + `allow_credentials` conflict | Pin origins from environment variable |
| 🟡 **Soon** | `print()` leaking exception details | Replace with `logging`, sanitize errors |
| 🟢 **Nice-to-have** | No input length validation | Add `Field(max_length=...)` to schemas |

---

*Report generated by automated static code review. All findings should be validated by a human security engineer before remediation decisions are made.*
