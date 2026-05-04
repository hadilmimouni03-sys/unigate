# UniGate — Smart University Registration Portal

Phase 1: Registration + Document Validation + State Machine + Security

## Quick Start

```bash
# 1. Clone and enter directory
cd unigate

# 2. Copy env (edit mail credentials if needed)
cp .env .env.local

# 3. Build and run
docker-compose up --build
```

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000         |
| Backend   | http://localhost:8080         |
| Swagger   | http://localhost:8080/swagger-ui.html |

## Default Credentials

| Role        | Email                     | Password    |
|-------------|---------------------------|-------------|
| Super Admin | superadmin@unigate.com    | Admin@1234  |
| Admin       | admin@unigate.com         | Admin@1234  |
| Reviewer    | reviewer@unigate.com      | Admin@1234  |
| Student     | (register via UI)         | —           |

## Architecture

```
unigate/
├── backend/          Spring Boot 3.2 + Java 17
├── frontend/         React 18 + Tailwind CSS
└── docker-compose.yml
```

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Spring Boot 3.2, Java 17, Maven         |
| Security   | Spring Security 6, JWT (jjwt 0.11.5)   |
| Database   | PostgreSQL 15                           |
| Real-time  | Spring WebSocket (STOMP)               |
| Email      | Spring Mail + Thymeleaf                |
| Frontend   | React 18, React Router 6, Axios        |
| Styling    | Tailwind CSS                           |
| Container  | Docker + Docker Compose                |

## API Documentation

Swagger UI: http://localhost:8080/swagger-ui.html

## Development (without Docker)

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm start
```

Requires local PostgreSQL running on port 5432 with credentials from `.env`.
