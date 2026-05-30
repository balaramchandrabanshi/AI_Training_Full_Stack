# 🔒 Security Audit Report: FastAPI Backend

**Date:** 2026-05-30  
**Target App:** InvenTrack Backend  
**Auditor:** Security Engineering  
**Workspace Path:** `c:\Users\lenevo\OneDrive\Desktop\full-stack\backend`

---

## 📋 Executive Summary
A comprehensive security review was performed on the InvenTrack FastAPI backend codebase. The analysis focused on authentication, session management, database safety, environment variables, authorization boundaries, CORS configuration, and error handling.

Overall, the application implements solid architectural choices:
* **No SQL Injection risks** were found (SQLAlchemy ORM with fully parameterized queries is used).
* **JWT algorithm pinning** is properly implemented to prevent algorithm confusion attacks.
* **Resource ownership checks** are consistently applied across all endpoints to prevent IDOR (Insecure Direct Object Reference).

However, several critical and high-severity vulnerabilities were identified, including hard-coded credentials in the configuration and weak JWT secrets, which must be resolved before deployment.

---

## 🔍 Detailed Vulnerability Analysis

### 1. Password Hashing and Bcrypt Work Factor
* **Current Implementation:** Found in `backend/app/auth.py`:
  ```python
  def hash_password(plain: str) -> str:
      return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
  ```
* **Analysis:**
  * Passwords are hashed using the standard `bcrypt` library, which is a cryptographically strong hashing function.
  * However, `bcrypt.gensalt()` is called without specifying the `rounds` parameter. This defaults to `12` rounds.
  * While `12` rounds is generally considered safe for current CPUs, it is not explicitly configured or parameterized.
  * **Work Factor Recommendation:** It is recommended to explicitly set the work factor to a minimum of `12` (or `13` for higher security) to future-proof the password hashes and make the work factor easily configurable.
  * **Input Length Limit:** Bcrypt has a hard limit of 72 bytes. Passwords longer than 72 bytes will be truncated. To mitigate this, a pre-hashing step (like SHA-256) could be applied, though it is not strictly necessary if standard password length limits are checked at the schema level.

---

### 2. JWT Validation and Algorithm Pinning
* **Current Implementation:** Found in `backend/app/auth.py`:
  ```python
  payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
  ```
* **Analysis:**
  * **Algorithm Pinning:** The decoding function explicitly pins the allowed algorithms to `[ALGORITHM]` (where `ALGORITHM = "HS256"`). This is **correct** and secure. It prevents "algorithm confusion" attacks where an attacker could sign a token using a public key and change the algorithm header to `HS256` or use `none`.
  * **Expiration Check:** Expiration is checked automatically during `jwt.decode` (since `"exp"` is part of the payload created in `create_access_token`).
  * **Session Length:** The token expiration is set to 7 days (`ACCESS_TOKEN_EXPIRE_DAYS = 7`). This is exceptionally long for an access token without a refresh token flow. If a token is compromised, it remains valid for 7 days with no mechanism for revocation.

---

### 3. SQL Injection Risks (Raw String Queries)
* **Current Implementation:** Reviewed database queries in `backend/app/crud.py` and routers.
* **Analysis:**
  * The application uses the **SQLAlchemy ORM** for all operations.
  * No instances of raw SQL queries (e.g. using `db.execute("SELECT...")` with string concatenation) were found.
  * The only raw SQL string is `text("SELECT 1")` in `backend/app/database.py`, which is static and completely safe.
  * Parameter binding is handled automatically by SQLAlchemy, effectively eliminating SQL injection vulnerabilities.

---

### 4. Hard-coded Environment Variables and Logging to Stdout
* **Current Implementation:** Found in `backend/.env`, `backend/app/auth.py`, and `backend/app/database.py`.
* **Analysis:**
  * **Hard-coded Secrets (Critical):** The file `backend/.env` contains a live PostgreSQL database connection string and a weak JWT secret:
    * `DATABASE_URL=postgresql://mydb_izvj_user:jlDcWEHR7Qjt1okSwbLe8TkRRt1jU2ZU@dpg-d8d5jecm0tmc73dis12g-a.singapore-postgres.render.com/mydb_izvj`
    * `JWT_SECRET=aaaaaaaaaabbbbbbbbbccccccccccdddddddddd`
  * If `.env` is committed to git or exposed, these credentials will be leaked.
  * **Weak Fallback:** In `backend/app/auth.py`:
    ```python
    SECRET_KEY: str = os.getenv("JWT_SECRET", "change-me-in-production")
    ```
    Falling back to a default string `"change-me-in-production"` allows the application to run insecurely if the environment variable is not defined.
  * **Stdout Logging (High):** In `backend/app/database.py`:
    ```python
    except Exception as e:
        print(f"Warning: Could not connect to PostgreSQL ({e}). Falling back to SQLite.")
    ```
    Using `print()` to output raw database connection exceptions to stdout can leak sensitive credentials (such as hostnames, database names, or user credentials contained in the connection string) directly into the application logs.

---

### 5. Resource Ownership Verification (IDOR)
* **Current Implementation:** Found in routers `inventories.py`, `items.py`, and `dashboard.py`.
* **Analysis:**
  * Every endpoint that reads, updates, or deletes data validates resource ownership by passing the `current_user.id` into the database query filter.
  * For example, in `backend/app/routers/inventories.py`:
    * `crud.get_inventory(db, inv_id, current_user.id)`
  * In `backend/app/routers/items.py`, the code verifies ownership of the category before creating or updating an item:
    ```python
    cat = crud.get_category(db, data.category_id, current_user.id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    ```
  * Ownership verification is applied consistently. There are no direct object reference vulnerabilities.

---

### 6. CORS Configuration
* **Current Implementation:** Found in `backend/app/main.py`:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
* **Analysis:**
  * **Wildcard Allowed:** `allow_origins=["*"]` allows any website to make requests to the API. This is inappropriate for production.
  * **Specification Violation:** Browsers will reject credentialed CORS requests (e.g. cookies or authorization headers) when the origin is a wildcard `*` and `allow_credentials=True` is enabled. This will break authentication across different domains.
  * **Correction Needed:** In production, `allow_origins` must be set to a specific list of trusted origins (e.g. the frontend URL).

---

### 7. Unhandled Exception and Internal detail exposure
* **Current Implementation:** Evaluated overall routers and `database.py`.
* **Analysis:**
  * The fallback mechanism in `backend/app/database.py` catches database connection failures during startup and prints them to stdout, then silently falls back to SQLite:
    ```python
    except Exception as e:
        print(f"Warning: Could not connect to PostgreSQL ({e}). Falling back to SQLite.")
    ```
  * In a production environment, this silent fallback is dangerous because the application might start using a local SQLite database instead of PostgreSQL, leading to data divergence or failure to persist data.
  * Global exception handling is not configured in `main.py`. Standard database exceptions (e.g., integrity constraints, database disconnects mid-request) could bubble up to the default FastAPI handler.
  * In production, default traceback exposure is turned off by FastAPI when `debug=False` (which is the default since it's not set to `True` in `FastAPI()`), but custom structured exception handlers are recommended to return safe error messages to clients while logging detailed tracebacks internally.

---

## 🛠️ Prioritized Remediation Plan

| Priority | Finding | Severity | Recommendation |
| :--- | :--- | :--- | :--- |
| 1 | **Database Credentials in Git / `.env`** | 🔴 Critical | Immediately rotate the database credentials on the host (Render). Ensure `.env` is added to `.gitignore`. |
| 2 | **Weak JWT Secret & Fallback** | 🔴 Critical | Change the `JWT_SECRET` in `.env` to a cryptographically secure random value. Remove the `"change-me-in-production"` fallback, and raise an explicit `KeyError` or configuration exception on startup if the variable is missing. |
| 3 | **CORS Wildcard Configuration** | 🟠 High | Set the allowed origins in `main.py` using an environment variable (e.g. `ALLOWED_ORIGINS`). Restrict it to the specific frontend origin. |
| 4 | **Bcrypt Cost Factor** | 🟡 Medium | Update `hash_password` to use an explicit cost factor (e.g., `rounds=12` or `rounds=13`). |
| 5 | **Logging database URL/Credentials** | 🟡 Medium | Replace `print()` statements with standard `logging`. Do not print raw exception objects containing the connection URL or details. |
| 6 | **Silent Database Fallback** | 🟡 Medium | Remove the SQLite fallback in production; if the primary database is unavailable, the application should fail to start or report an unhealthy status. |
