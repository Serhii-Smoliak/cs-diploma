# CyberTactics Server

Backend API платформи CyberTactics.

## Технології

- Node.js 20+
- Express 5
- PostgreSQL 16
- Prisma ORM 6
- TypeScript

## Перший запуск

Перед запуском переконайтеся, що зібрано пакет **shared** (`cd ../shared && npm install && npm run build`).

1. **`.env`** — скопіюйте `.env.example` → `.env`
2. **PostgreSQL** — `docker compose up -d`
3. **Залежності** — `npm install`
4. **Міграції** — `npm run db:migrate`
5. **Backend** — `npm run dev` (порт 3001)
6. **MITRE sync** — `POST http://localhost:3001/api/mitre/sync` (обов'язково **до** seed)
7. **Seed** — `npm run seed` (у другому терміналі)

Після seed: **admin@cybertactics.test** / **admin123**.

## Запуск (розробка)

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Змінні середовища

Скопіюйте `.env.example` → `.env`:

```env
# PostgreSQL (Docker Compose)
POSTGRES_USER=cybertactics
POSTGRES_PASSWORD=cybertactics_password
POSTGRES_DB=cybertactics
POSTGRES_PORT=5432

# Prisma (має відповідати POSTGRES_* вище)
DATABASE_URL="postgresql://cybertactics:cybertactics_password@localhost:5432/cybertactics?schema=public"

# API
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
```

| Змінна | Призначення |
|--------|-------------|
| `POSTGRES_*` | `docker-compose.yml` |
| `DATABASE_URL` | Prisma |
| `JWT_SECRET`, `PORT` | API |

## Команди Prisma

- `npm run db:migrate` — застосувати міграції
- `npm run db:generate` — згенерувати Prisma Client
- `npm run db:studio` — відкрити Prisma Studio
- `npm run seed` — наповнити БД (після MITRE sync; див. `prisma/seed.ts`)

## MITRE sync

```bash
curl -X POST http://localhost:3001/api/mitre/sync
```

Рівні місій мають зовнішній ключ на `mitre_techniques`. Без sync seed створить місії, але **не** рівні — API поверне 404 на `/api/missions/:id/levels`.
