# InvenTrack 📦

InvenTrack is a modern, premium, full-stack Inventory Management System designed to help users organize inventories, categorize items, and track stock levels. It features a responsive React dashboard, secure token-based user authentication, and a robust FastAPI backend.

---

## 🚀 Live Deployments

* **Frontend**: Deployed on [Vercel](https://vercel.com)
* **Backend**: Containerized and deployed on [Render](https://render.com) (using PostgreSQL database hosted on Supabase / Render Postgres)

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 18, TypeScript, HTML5, Tailwind CSS
* **Routing**: React Router DOM (v6)
* **Icons**: Lucide React
* **Build Tool**: Vite

### Backend
* **Framework**: FastAPI (Python 3.12)
* **Server**: Uvicorn (ASGI)
* **Database & ORM**: SQLAlchemy with PostgreSQL (`psycopg2-binary`) & SQLite fallback
* **Authentication**: JWT (JSON Web Tokens) with `python-jose` and `bcrypt` password hashing
* **Deployment**: Docker containerization

---

## 📁 Project Structure

```text
full-stack/
├── frontend/             # React + Vite + TypeScript application
│   ├── src/              # React components, pages, context, and helpers
│   ├── public/           # Static assets
│   ├── vercel.json       # Routing configurations for Vercel SPA routing
│   └── vite.config.ts    # Vite bundler configuration
├── backend/              # FastAPI application
│   ├── app/              # Application logic (routers, models, schemas, crud, db)
│   ├── Dockerfile        # Container build definition for production deployment
│   └── requirements.txt  # Python package dependencies
└── README.md             # Project documentation and guide
```

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
| Variable | Description | Local Default | Production |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | The endpoint URL of the FastAPI backend. | `http://localhost:8000/api` | `https://your-backend.onrender.com/api` |

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for PostgreSQL database. | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Secret key used to sign and verify JWT authentication tokens. | `your-long-secure-random-secret-key` |
| `PORT` | *(Injected by Render)* Port on which uvicorn listens. | `10000` |

---

## 💻 Local Development Setup

### 1. Run the Backend Locally

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` folder:
   ```ini
   DATABASE_URL=sqlite:///./sql_app.db
   JWT_SECRET=your_super_secret_jwt_key_here
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The API will be available at `http://127.0.0.1:8000` and interactive docs at `/docs`.*

---

### 2. Run the Frontend Locally

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173`.*

---

### 3. Run with Docker Locally

To build and run the backend locally in a container:
```bash
cd backend
docker build -t inventrack-backend .
docker run -p 8000:8000 -e DATABASE_URL="sqlite:///./sql_app.db" -e JWT_SECRET="your-jwt-secret" inventrack-backend
```

---

## ☁️ Deployment Instructions

### 1. Backend Deployment on Render
1. Create a new **Web Service** on Render.
2. Link your GitHub repository.
3. In the **Environment** settings:
   * Select **Docker** as the runtime.
   * Add environment variables:
     * `DATABASE_URL`: Your PostgreSQL connection string.
     * `JWT_SECRET`: A secure string for auth.
4. Render automatically reads the `Dockerfile` and dynamically exposes uvicorn via the `$PORT` environment variable.

### 2. Frontend Deployment on Vercel
1. Import your project in **Vercel**.
2. Set the **Root Directory** settings option to `frontend`.
3. In the **Environment Variables** section, add:
   * `VITE_API_URL` set to your Render backend API URL (e.g., `https://your-backend.onrender.com/api`).
4. Click **Deploy**. Vercel will build the static site into `dist/` and apply the `vercel.json` rewrites for seamless routing.
