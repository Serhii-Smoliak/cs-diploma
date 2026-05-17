# CyberTactics Server

Backend API платформи CyberTactics.

## Технології

- Node.js 20+
- Express 5
- PostgreSQL 16
- Prisma ORM 6
- TypeScript

## Установка

```bash
npm install
```

Перед запуском переконайтеся, що зібрано пакет **shared** у корені монорепозиторію (`cd ../shared && npm install && npm run build`).

## Налаштування бази даних

1. Запустіть PostgreSQL через Docker:

```bash
docker-compose up -d
```

2. Застосуйте міграції:

```bash
npm run db:migrate
```

3. Заповніть БД тестовими даними:

```bash
npm run seed
```

## Запуск

### Розробка

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Змінні середовища

Створіть файл `.env`:

```
DATABASE_URL="postgresql://cybertactics:cybertactics_password@localhost:5432/cybertactics?schema=public"
JWT_SECRET="your-secret-key"
PORT=3001
```

## Команди Prisma

- `npm run db:migrate` — застосувати міграції
- `npm run db:generate` — згенерувати Prisma Client
- `npm run db:studio` — відкрити Prisma Studio
- `npm run seed` — наповнити БД тестовими даними (див. `prisma/seed.ts`)
