# Koolchaine Hub

Internal automation dashboard for Cool Cordes.

## Project Structure
- `/frontend`: React + Tailwind CSS
- `/backend`: FastAPI + PostgreSQL
- `/nginx`: Nginx reverse proxy configuration

## Quick Start (Docker)

1. **Clone the repository**
2. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```
4. **Access the Hub**
   - Frontend: `http://localhost`
   - API Docs: `http://localhost/api/v1/docs` (Note: Backend is proxied through `/api`)

## Manual Setup (Development)

### Backend
1. Navigate to `/backend`
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend
1. Navigate to `/frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Modules
1. **Prospection** — B2B outreach pipeline (Coming soon)
2. **Shopify** — Order & Label management (Coming soon)
3. **Réseaux sociaux** — Instagram scheduling (Coming soon)
4. **Analytics** — KPI tracking (Coming soon)

## Authentication
- Multi-user support with `admin` and `member` roles.
- JWT stored in httpOnly cookies for security.
