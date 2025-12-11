# Efficio Monorepo

Unified workspace for the Efficio frontend micro-apps (dashboard shell, task manager, time tracker, analytics) and the Express/MongoDB backend.

## Features
- Dashboard app shell hosting micro frontends via Webpack module federation.
- Task Manager with kanban board, group collaboration, and activity feed.
- Time Tracker with summaries, daily jobs, and activity aggregation.
- Analytics app for reporting and visualizations.
- Shared UI/theme packages and API utilities.

## Project Structure
- `Efficio/` – Frontend mono-repo (pnpm, Webpack, Jest, Tailwind).
- `efficio-backend/` – Express/MongoDB API, Auth0 JWT auth, cron jobs.
- `reference/` – Reference UI and architecture notes.

## Prerequisites
- Node.js (LTS recommended)
- pnpm (workspace uses `pnpm@10.19.0`)
- MongoDB connection string in backend environment

## Setup
```bash
# install root-level deps
cd Efficio
pnpm install

# install backend deps
cd ../efficio-backend
npm install
```

## Running (Frontend)
From `Efficio/`:
```bash
# dashboard shell on :3000
pnpm dev:app-shell

# task manager on :3001
pnpm dev:task-manager

# time tracker on :3002
pnpm dev:time-tracker

# analytics on :3003
pnpm dev:analytics
```

## Building (Frontend)
```bash
pnpm build:app-shell
pnpm build:task-manager
pnpm build:time-tracker
pnpm build:analytics
```

## Running (Backend)
From `efficio-backend/`:
```bash
# development (nodemon)
npm run dev

# production
npm start
```
Environment variables (examples):
```
API_BASE_URL=https://efficio-backend.onrender.com/api
SONAR_TOKEN=c40a068fe1c83ac3f9024cdc5428ea341265ad91
SENTRY_DSN=https://eb935276269214fc3156add2ba749a6f@o4510395072315392.ingest.us.sentry.io/4510395156529152
SENTRY_ENVIRONMENT=local
```

## Testing
From `Efficio/`:
```bash
pnpm test          # all projects
pnpm test:task-manager
pnpm test:time-tracker
pnpm test:app-shell
pnpm test:analytics
pnpm test:coverage
```

## Screenshots

<img width="1893" height="881" alt="Screenshot 2025-12-11 at 3 01 08 PM" src="https://github.com/user-attachments/assets/dd8380c8-1064-4046-8f60-104ff7fa8261" />

```
Task Manager
<img width="1893" height="881" alt="Screenshot 2025-12-11 at 3 01 08 PM" src="https://github.com/user-attachments/assets/dd8380c8-1064-4046-8f60-104ff7fa8261" />

Time Tracker
<img width="1885" height="879" alt="Screenshot 2025-12-11 at 3 01 24 PM" src="https://github.com/user-attachments/assets/0ca9040a-9b5c-4b89-9c53-a027fa6d727d" />

Analytics
<img width="1894" height="879" alt="Screenshot 2025-12-11 at 3 01 40 PM" src="https://github.com/user-attachments/assets/d0bdd489-4377-4985-a980-8a017136d67e" />

```

## AI Tooling Disclosure
Portions of this repository were authored and refactored with assistance from AI coding tools (GitHub Copilot / GPT-5.1-Codex-Max Preview). All changes were reviewed by the team before commiting.

## Collaboration
Commit history shows contributions from all teammates. Useful commands to view per-collaborator work locally:
   131  Kartik Chindarkar
    33  Srishti Bankar
    9  Ankit Anand
