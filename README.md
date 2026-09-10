# QuickFixHub

A production-oriented cross-platform service marketplace connecting customers with trusted local service providers.

## Stack
- **Mobile:** React Native + Expo + TypeScript
- **Backend:** Spring Boot + PostgreSQL + Redis
- **Real-time:** WebSockets (STOMP)
- **Notifications:** Firebase Cloud Messaging
- **Maps:** Google Maps Platform
- **Infra:** Docker, GitHub Actions, AWS

## Repository structure
```
quickfixhub/
  backend/     Spring Boot API
  mobile/      Expo React Native app
  docs/        Architecture diagrams, ER diagrams, API docs
  .github/     CI/CD workflows, issue/PR templates
```

## Architecture

_Diagram to be added in `docs/architecture.png` — see Milestone 1._

## Getting started

### Prerequisites
- Java 21+, Node.js 20+, Docker Desktop, Expo CLI

### Backend
```bash
cd backend
cp .env.example .env   # fill in local values
docker compose up -d   # Postgres + Redis + Mailpit
./gradlew bootRun
```
API docs available at `http://localhost:8080/swagger-ui.html` once running.

Outgoing email (welcome, password-reset code, security alerts) goes to the local **Mailpit**
container by default — view every message at `http://localhost:8025`, nothing leaves your machine.
To send real email instead, swap the `SMTP_*` block in `.env` (a ready-to-fill **Gmail** block —
App Password, port 587, STARTTLS — is in [`backend/.env.example`](backend/.env.example)) and restart.

### Mobile
```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

## Development workflow

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for the branching model, commit conventions, and PR checklist.

## Status

🚧 Milestone 0 — repository and environment setup in progress.

## License

TBD
