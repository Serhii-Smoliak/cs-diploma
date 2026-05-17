# CyberTactics MVP — документація

## Зміст

1. [Огляд проєкту](#огляд-проєкту)
2. [Статус реалізації](#статус-реалізації)
3. [Технологічний стек](#технологічний-стек)
4. [Зовнішні джерела даних](#зовнішні-джерела-даних)
5. [Архітектура системи](#архітектура-системи)
6. [Структура проєкту](#структура-проєкту)
7. [База даних](#база-даних)
8. [API Endpoints](#api-endpoints)
9. [Бізнес-логіка](#бізнес-логіка)
10. [Валідація відповідей](#валідація-відповідей)
11. [Frontend](#frontend)
12. [Локалізація (i18n)](#локалізація-i18n)
13. [Гейміфікація](#гейміфікація)
14. [Дизайн-система](#дизайн-система)
15. [Розгортання](#розгортання)
16. [Додаткова інформація](#додаткова-інформація)
17. [Структура JSON полів рівня](#структура-json-полів-рівня)

---

## Огляд проєкту

**CyberTactics** — освітня гейміфікована вебплатформа для вивчення кібербезпеки через симуляцію сценаріїв атак. Поєднує механіки на кшталт «завдань з кодом» і текстових RPG-рішень; опорою для контенту слугує матриця **MITRE ATT&CK**.

### Ключові можливості

- Браузерна симуляція без окремого клієнтського застосунку
- XP, ранги, метрика Stealth
- Три типи завдань: редактор коду, тактичний вибір, конструктор фішингу
- Дані MITRE ATT&CK з офіційної колекції STIX (MITRE CTI) і збереження в БД
- Інтерфейс у кіберпанк-стилі, Monaco Editor
- Прогрес користувача, матриця навичок (Skill Matrix)
- Місії та рівні в **PostgreSQL** (JSONB для гнучких полів)
- Багатомовність: переклади з БД + **i18next**
- Випадкові «координатори» (handlers) за групою місії

---

## Статус реалізації

| Область | Статус | Примітка |
|--------|--------|----------|
| Реєстрація / вхід, JWT | Реалізовано | `bcryptjs`, `jsonwebtoken` |
| CRUD даних місій і рівнів із БД | Реалізовано | Seed з JSON у `server/src/data/missions/` |
| Відправка відповіді, прогрес, XP, Stealth | Реалізовано | `levelService`, `UserProgress`, `UserStats` |
| Типи завдань (code / choice / phishing) | Реалізовано | `AnswerValidator` |
| MITRE: синхронізація з GitHub CTI | Реалізовано | `POST /api/mitre/sync`, `mitreSyncService.ts` |
| MITRE: матриця, модальне вікно, зв’язок з місіями | Реалізовано | `SkillMatrixPage`, `MitreTechniqueModal` |
| Переклади: мови, namespaces, API | Реалізовано | `Language`, `Translation`, `translations` routes |
| i18next на клієнті | Реалізовано | Завантаження з API до рендеру |
| Координатори за `handlerGroup` місії | Реалізовано | `GET /api/handlers/random/:group` |
| Таблиця лідерів (Leaderboard) | **Не реалізовано** | Сторінка-заглушка «coming soon» |
| Захист адмін-операцій | **Не реалізовано** | `POST /api/mitre/sync`, `POST /api/translations*` без перевірки ролей |
| `UserStats.completedLevels` | **Частково** | Поле є в схемі; при проходженні рівнів у `levelService` не інкрементується (орієнтир — `UserProgress`) |
| Окремий компонент `StealthBar` | **Не використовується** | Логіка Stealth у `TopBar`; у файлі є коментар про інтеграцію |
| Повна локалізація всього UI | **Частково** | Частина рядків англійською (наприклад, Leaderboard, Settings, частина ігрового UI) |
| Кореневий `npm run dev` для монорепо | **Не налаштовано** | Запуск окремо: `server` / `client` |
| AST-валідація коду | **Спрощено** | Перевірка підрядка / спец. випадок PowerShell; не повноцінний AST-парсер |

---

## Технологічний стек

Версії нижче — з **`package.json`** (діапазон `^`) та фактичні версії, зафіксовані в **`package-lock.json`**, там, де вказано окремо (після `npm install` у репозиторії).

### Frontend (`client`)

| Технологія | Версія (package.json) | Встановлена (lock), за наявності | Призначення |
|------------|----------------------|-----------------------------------|-------------|
| React | ^18.3.1 | 18.3.1 | UI |
| React DOM | ^18.3.1 | 18.3.1 | Рендеринг |
| TypeScript | ^5.7.2 | 5.9.3 | Типізація |
| Vite | ^6.0.5 | 6.4.1 | Збірка, dev-сервер |
| Tailwind CSS | ^3.4.17 | 3.4.19 | Стилі |
| PostCSS / Autoprefixer | ^8.4.49 / ^10.4.20 | 8.5.6 / 10.4.23 | CSS pipeline |
| Zustand | ^5.0.9 | 5.0.9 | Стан |
| react-router-dom | ^7.1.3 | 7.11.0 | Маршрути |
| Framer Motion | ^11.11.17 | 11.18.2 | Анімації |
| Monaco Editor / @monaco-editor/react | ^0.52.0 / ^4.6.0 | 0.52.2 / 4.7.0 | Редактор коду |
| i18next / react-i18next / i18next-browser-languagedetector | ^25.7.3 / ^16.5.0 / ^8.2.0 | як у lock | Локалізація |
| clsx / tailwind-merge | ^2.1.1 / ^2.6.0 | — | Утиліти класів |
| ESLint + typescript-eslint | ^9.17.0 / ^8.18.1 | 9.39.2 / 8.50.0 | Лінтинг |
| @vitejs/plugin-react | ^4.3.3 | 4.7.0 | React у Vite |

**Проксі розробки:** `vite.config.ts` — `/api` → `http://localhost:3001`.

### Backend (`server`)

| Технологія | Версія (package.json) | Встановлена (lock), за наявності | Призначення |
|------------|----------------------|-----------------------------------|-------------|
| Node.js | — | 20 (див. Dockerfile: `node:20-alpine`) | Runtime |
| Express | ^5.0.1 | 5.2.1 | HTTP API |
| TypeScript | ^5.7.2 | 5.9.3 | Типізація |
| tsx | ^4.19.2 | 4.21.0 | Запуск TS у dev (`tsx watch`) |
| Prisma / @prisma/client | ^6.1.0 | 6.19.1 | ORM |
| PostgreSQL | — | 16 (`postgres:16-alpine` у `docker-compose.yml`) | СУБД |
| bcryptjs | ^2.4.3 | 2.4.3 | Хеш паролів |
| jsonwebtoken | ^9.0.2 | 9.0.3 | JWT |
| Zod | ^3.24.1 | 3.25.76 | Валідація тіла запитів |
| cors | ^2.8.5 | 2.8.5 | CORS |
| dotenv | ^17.2.3 | 17.2.3 | Змінні середовища |

### Shared (`shared`)

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| TypeScript | ^5.7.2 | Спільні типи та інтерфейси, збірка `tsc` |

### Інфраструктура

| Технологія | Призначення |
|------------|-------------|
| Docker Compose (`server/docker-compose.yml`) | PostgreSQL 16 |
| Dockerfile (`server/Dockerfile`) | Збірка та запуск **backend**-образу (Node 20 Alpine) |
| ES Modules | `"type": "module"` у `client` та `server` |

### Залежність пакетів

- **`@cybertactics/shared`** — зараз це **локальний** пакет (`file:../shared`): спільні типи та контракти для клієнта й сервера без окремого репозиторія чи реєстру.

**Плани на майбутнє:** винести цей пакет у **окремий артефакт**, опублікувати в **npm** (або приватний registry, наприклад GitHub Packages / Verdaccio), дотримуватись **семантичного версіонування** й підключати в `client` та `server` через діапазон версій замість `file:../shared`. Це спростить повторне використання типів у інших репозиторіях, CI/CD і керування залежностями між командами.

---

## Зовнішні джерела даних

### MITRE ATT&CK (STIX) через MITRE CTI

Сервер завантажує **Enterprise ATT&CK** у форматі STIX JSON:

**URL:** `https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json`

Реалізація: `server/src/services/mitreSyncService.ts` (фільтр `attack-pattern`, upsert у `mitre_techniques`). Версія комплекту даних визначається репозиторієм [mitre/cti](https://github.com/mitre/cti) (гілка `master` на момент синхронізації).

---

## Архітектура системи

### Схема

```
┌─────────────────────────────────────────────────────────┐
│                 Frontend (React + Vite)                  │
│  Сторінки → Компоненти → Zustand → api.ts (fetch)      │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP /api (проксі в dev)
┌────────────────────────────┼────────────────────────────┐
│                 Backend (Express)                        │
│  Routes → middleware (JWT) → services → Prisma         │
└────────────────────────────┬────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

### Потік даних

1. Дія користувача → store / компонент викликає `api`.
2. Запит на `/api/...` з опціональним `Authorization: Bearer`.
3. Роут → `authenticate` (де потрібно) → сервіс → Prisma → відповідь JSON.

---

## Структура проєкту

```
ct_mvp/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Layout, Sidebar, TopBar, LanguageSwitcher
│   │   │   ├── game/         # GameLayout, ContextPanel, WorkArea, DialogueLog,
│   │   │   │                 # HandlerAvatar, LevelTransition, StealthBar (застарілий окремий UI)
│   │   │   ├── tasks/        # CodeEditor, TacticalChoice, PhishingConstructor
│   │   │   └── mitre/        # MitreTechniqueBadge, MitreTechniqueModal
│   │   ├── pages/            # Login, Missions, MissionAssignments, Game (route),
│   │   │                     # SkillMatrix, Leaderboard (заглушка), Settings
│   │   ├── store/            # authStore, gameStore, sidebarStore
│   │   ├── services/         # api.ts
│   │   ├── i18n/             # config.ts, index
│   │   ├── styles/
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/           # auth, missions, levels, users, mitre, translations, handlers
│   │   ├── services/         # levelService, mitreSyncService
│   │   ├── validators/       # AnswerValidator
│   │   ├── middleware/       # auth (JWT)
│   │   ├── db/
│   │   ├── data/missions/    # JSON для seed
│   │   └── index.ts
│   ├── prisma/               # schema, migrations, seed.ts
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── package.json
└── shared/                   # @cybertactics/shared (локально); у перспективі — окремий npm-пакет
    └── src/index.ts          # Спільні типи та експорти
```

---

## База даних

ORM: **Prisma**. У БД імена таблиць у `snake_case`, у моделях — `camelCase`.

### Місії: джерела списку MITRE ID

У `routes/missions.ts` об’єднуються: many-to-many `mission_mitre_techniques`, `mitreId` рівнів, JSON `mitreTechniques` (legacy).

### Модель **User** (`users`)

| Поле | Тип | Опис |
|------|-----|------|
| `id` | UUID | Первинний ключ |
| `username` | String, unique | 3–30 символів |
| `email` | String, unique | Email |
| `passwordHash` | String | bcrypt (10 раундів) |
| `xp` | Int | Застаріле поле на таблиці користувача (актуальні дані в `UserStats`) |
| `rank` | String | Застаріле на таблиці користувача |
| `stealth` | Int | Застаріле на таблиці користувача |
| `createdAt` | DateTime | Дата реєстрації |

**Зв’язки:** `progress`, `stats`, `mitreTechniques`. При реєстрації створюється `UserStats` у транзакції.

### Модель **Mission** (`missions`)

| Поле | Тип | Опис |
|------|-----|------|
| `id` | String | Наприклад `operation_ghost` |
| `name` | String | Назва |
| `description` | String? | Опис |
| `difficulty` | String | `beginner` / `intermediate` / `advanced` |
| `orderIndex` | Int | Порядок у списку |
| `mitreTechniques` | Json | Legacy-масив ID технік |
| `handlerGroup` | String? | Група координаторів для `GET /handlers/random/:group` |
| `createdAt` | DateTime | — |

**Зв’язки:** `levels`, `mitreTechniquesRelation`.

### Модель **Level** (`levels`)

| Поле | Тип | Опис |
|------|-----|------|
| `id` | String | PK рядка в БД |
| `missionId` | String | FK на місію |
| `levelId` | String | Логічний ID рівня (`ghost_recon_01` тощо), використовується в API submit |
| `mitreId` | String? | Зв’язок з `MitreTechnique` |
| `title` | String | Заголовок |
| `orderIndex` | Int | Порядок у місії |
| `taskType` | String | `code_editor`, `tactical_choice`, `phishing_constructor` |
| `dialogue` | Json | Масив повідомлень |
| `workArea` | Json | Дані робочої області залежно від `taskType` |
| `validation` | Json | Правила перевірки відповіді |
| `rewards` | Json | `{ xp, stealth_impact }` |
| `hints` | Json | Масив рядків-підказок |

### Модель **UserProgress** (`user_progress`)

| Поле | Тип | Опис |
|------|-----|------|
| `userId`, `levelId` | — | Унікальна пара (`@@unique`) |
| `completed` | Boolean | Завершено з успіхом |
| `attempts` | Int | Лічильник спроб |
| `lastAttempt` | DateTime? | Остання спроба |
| `lastAnswer` | String? | Остання **правильна** відповідь (не перезаписується помилковою спробою) |
| `bestScore` | Int? | Резерв під майбутнє |

**Поведінка:** при успіху `completed` лишається `true`; `lastAnswer` оновлюється лише при валідній відповіді.

### Модель **UserStats** (`user_stats`)

| Поле | Опис |
|------|------|
| `totalXp`, `rank`, `stealth`, `completedLevels` | Агрегована статистика (див. [статус](#статус-реалізації) щодо `completedLevels`) |

### Модель **UserMitreTechnique** (`user_mitre_techniques`)

Запис «користувач освоїв техніку»: `userId`, `mitreId`, `completedAt`.

### Модель **MitreTechnique** (`mitre_techniques`)

Довідник із синхронізації CTI: `id` (Txxxx), `name`, `description`, `tactic`, `url`, `platforms`, `dataSources`, `defenseBypassed`, `permissionsRequired`, `examples`, `mitigation`, `updatedAt`.

### Модель **MissionMitreTechnique** (`mission_mitre_techniques`)

Зв’язок місія ↔ техніка, унікальний `(missionId, mitreId)`.

### Модель **Language** (`languages`)

`code` (PK, ISO), `name`, `flag`, `isActive`.

### Модель **Translation** (`translations`)

`key`, `locale`, `namespace`, `value` (Text); унікальний складений ключ `(key, locale, namespace)`.

### Модель **Handler** (`handlers`)

`codeName` (унікальний), `group`, `specialization`, `isActive`.

### Міграції та seed

```bash
cd server
npm run db:migrate
npm run seed
```

Seed створює тестового користувача й завантажує місії/рівні з `server/src/data/missions/`. Якщо JSON-місій немає, seed може створити лише користувача — залежить від вмісту `seed.ts` і папки `data/missions`.

---

## API Endpoints

**База:** `http://localhost:3001/api`  
**Автентифікація:** `Authorization: Bearer <token>` для захищених маршрутів.

### Загальне

| Метод | Шлях | Опис |
|--------|------|------|
| GET | `/health` | Перевірка живості API |

### Auth

| Метод | Шлях | Auth | Опис |
|--------|------|------|------|
| POST | `/auth/register` | Ні | Реєстрація (Zod), bcrypt, JWT |
| POST | `/auth/login` | Ні | Вхід, JWT |

### Місії та рівні

| Метод | Шлях | Auth | Опис |
|--------|------|------|------|
| GET | `/missions` | Ні | Список місій (+ агреговані MITRE ID, `handlerGroup`) |
| GET | `/missions/:id/levels` | Ні | Рівні місії з `mitre_technique` |
| POST | `/levels/:id/submit` | Так | Відповідь на рівень (`id` — `levelId`, URL-encoded) |

### Користувачі

| Метод | Шлях | Auth | Опис |
|--------|------|------|------|
| GET | `/users/:id/progress` | Так | Лише власний `id` |
| GET | `/users/:id/stats` | Так | Статистика + список `mitreTechniques` |

### MITRE

| Метод | Шлях | Auth | Опис |
|--------|------|------|------|
| GET | `/mitre/techniques` | Ні | Усі техніки з БД |
| GET | `/mitre/techniques/:id` | Ні | Деталі + **`relatedMissions`** (зв’язки місій/рівнів) |
| POST | `/mitre/sync` | **Ні (треба обмежити)** | Синхронізація з MITRE CTI JSON |

### Переклади

| Метод | Шлях | Auth | Опис |
|--------|------|------|------|
| GET | `/translations/languages` | Ні | Активні мови |
| GET | `/translations` | Ні | Query: `locale`, `namespace` → об’єкт ключ→значення |
| GET | `/translations/namespaces` | Ні | Query: `locale`, `namespaces` (через кому) |
| POST | `/translations` | **Ні (треба обмежити)** | Upsert одного перекладу |
| POST | `/translations/bulk` | **Ні (треба обмежити)** | Масовий upsert |

### Координатори

| Метод | Шлях | Auth | Опис |
|--------|------|------|------|
| GET | `/handlers/random/:group` | Ні | Випадковий активний handler з групи |

### Деталізація окремих маршрутів (приклади)

#### `GET /api/health`

**Відповідь (200):**

```json
{
  "status": "ok",
  "message": "CyberTactics API is running"
}
```

#### `POST /api/auth/register`

**Тіло:**

```json
{
  "username": "рядок 3–30 символів",
  "email": "валідний email",
  "password": "мінімум 6 символів"
}
```

**Відповідь (201):** `token` (JWT, термін **7 днів**), об’єкт `user` з полями `id`, `username`, `email`, `xp`, `rank`, `stealth` (останні три — з запису `User` на момент відповіді).

**Помилки:** `400` — Zod або «User already exists»; `500` — сервер.

**Логіка:** унікальність email/username, `bcrypt.hash(..., 10)`, створення `User` + `UserStats` у зв’язці.

#### `POST /api/auth/login`

**Тіло:** `{ "email", "password" }`.

**Відповідь (200):** `token`, `user` (як при реєстрації).

**Помилки:** `401` — невірні облікові дані; `400` — валідація.

#### `GET /api/missions`

**Відповідь (200):** масив об’єктів місії у форматі shared types, зокрема:

```json
{
  "id": "operation_ghost",
  "name": "Operation Ghost",
  "description": "…",
  "difficulty": "beginner",
  "mitreTechniques": ["T1593", "T1583.001"],
  "order": 1,
  "handlerGroup": "osint"
}
```

Поле `handlerGroup` може бути `null`. Список `mitreTechniques` агрегується з M2M, рівнів і legacy JSON.

#### `GET /api/missions/:id/levels`

**Відповідь (200):** масив рівнів; поля в snake/lowercase як у типі `Level` (`level_id`, `task_type`, `work_area`, `mitre_technique`, …).

**Помилка:** `404`, якщо для цієї місії **немає жодного** рівня в БД.

**Приклад фрагмента:**

```json
{
  "level_id": "ghost_recon_01",
  "mission_id": "operation_ghost",
  "mitre_id": "T1593",
  "mitre_technique": {
    "id": "T1593",
    "name": "Search Open Websites/Domains",
    "description": "…",
    "tactic": "Reconnaissance",
    "url": "https://attack.mitre.org/techniques/T1593"
  },
  "title": "…",
  "order": 1,
  "dialogue": [{ "speaker": "handler", "text": "…" }],
  "task_type": "code_editor",
  "work_area": {},
  "validation": {},
  "rewards": { "xp": 100, "stealth_impact": 0 },
  "hints": []
}
```

#### `GET /api/mitre/techniques`

Повертає масив усіх записів `MitreTechnique` (усі колонки, включно з `platforms`, `mitigation` тощо після синхронізації), відсортованих за `tactic`, потім `id`.

#### `GET /api/mitre/techniques/:id`

Повертає одну техніку з вкладеними `missions` та `levels` (Prisma `include`); у JSON додатково поле **`relatedMissions`** — об’єднаний список унікальних місій із цих зв’язків (для UI та модального вікна).

**Помилка:** `404` — техніка не знайдена.

#### `POST /api/mitre/sync`

**Відповідь (успіх):**

```json
{
  "success": true,
  "message": "Synchronized N techniques",
  "synced": 0,
  "errors": 0
}
```

**Примітка:** ендпоінт поки **без** перевірки ролі адміністратора.

#### `POST /api/levels/:id/submit`

- **Автентифікація:** обов’язкова.
- **`id`** у шляху — це `levelId` завдання; передається **URL-encoded** (у клієнті — `encodeURIComponent`).
- **Тіло (Zod):** `{ "answer": string | number | { "to", "subject", "body", "attachments": string[] } }`.

**Приклад успіху (200):**

```json
{
  "success": true,
  "message": "Вірно! +100 XP",
  "xpGained": 100,
  "stealthChange": 0,
  "nextLevelId": "ghost_resource_02",
  "correctAnswer": "…",
  "userAnswer": "…"
}
```

**Приклад помилки (200 з success: false):**

```json
{
  "success": false,
  "message": "Невірна відповідь. Stealth -5%",
  "stealthChange": -5,
  "correctAnswer": "…",
  "userAnswer": "…"
}
```

**Інші коди:** `400` (Zod), `401`, `500`.

Дані рівня під час перевірки завжди читаються **з PostgreSQL** (не з JSON-файлів).

#### `GET /api/users/:id/progress` та `GET /api/users/:id/stats`

Доступ лише якщо `req.userId === id`. **Помилки:** `403`, `401`, `404` (для stats, якщо запису немає).

**Приклад stats (200):**

```json
{
  "userId": "uuid",
  "totalXp": 500,
  "rank": "Novice Hacker",
  "stealth": 95,
  "completedLevels": 0,
  "mitreTechniques": ["T1593"]
}
```

#### Переклади

- `GET /translations/languages` — список активних мов.
- `GET /translations?locale=uk&namespace=common` — плоский об’єкт `ключ → значення`.
- `GET /translations/namespaces?locale=uk&namespaces=common,ui` — об’єкт `namespace → { key → value }`; без `namespaces` повертається `400`.
- `POST /translations` — тіло: `key`, `value`, опційно `locale`, `namespace`.
- `POST /translations/bulk` — тіло: `{ "translations": [{ "key", "value" }], "locale", "namespace" }`.

Останні два POST призначені для адміністрування контенту; **захист ролями не реалізований**.

#### `GET /api/handlers/random/:group`

Випадковий активний handler з указаної `group`. **404**, якщо група порожня.

---

## Бізнес-логіка

### `submitAnswer` (`levelService.ts`)

1. Перевірка існування `User`.
2. Пошук рівня за **`levelId`** (`prisma.level.findFirst({ where: { levelId } })`) — не плутати з первинним ключем `id` рядка.
3. Мапінг на тип `Level` (shared).
4. `validateAnswer(level, answer)`.
5. Створення або оновлення `UserProgress`: збільшення `attempts`; при успіху — `completed: true`, оновлення `lastAnswer`; при помилці — попередній `lastAnswer` зберігається.
6. При валідній відповіді: нарахування XP і зміна Stealth з **`rewards`**, перерахунок рангу, `UserMitreTechnique.upsert` якщо є `mitre_id`, обчислення **`nextLevelId`** (наступний `orderIndex` у тій самій місії). Якщо завдання вже було успішно виконано раніше, повідомлення інформує про повтор без повторного нарахування XP (див. гілку `wasAlreadyCompleted` у коді).
7. При невалідній відповіді: Stealth **−5** (мінімум 0), оновлення `UserStats`.

У відповіді submit з сервера можуть бути поля **`correctAnswer`**, **`userAnswer`** — зручно для підказок у UI.

### Ранг від XP (`calculateRank`)

- 0–499: Script Kiddie  
- 500–1499: Novice Hacker  
- 1500–2999: Intermediate Hacker  
- 3000–4999: Advanced Hacker  
- ≥5000: Elite Hacker  

### Нагороди рівня

```json
{ "xp": 100, "stealth_impact": 0 }
```

---

## Валідація відповідей

Файл: `server/src/validators/AnswerValidator.ts`.

Підтримуються типи перевірки (узгоджені з полем `validation.type` у рівні):

### 1. `regex_match`

Перевіряє збіг відповіді з регулярним виразом щодо тестового рядка.

Логіка (спрощено):

```typescript
function validateRegex(answer: string, pattern: string, testString: string): boolean {
  const normalizedAnswer = answer.replace(/\\\\/g, '\\');
  const regex = new RegExp(normalizedAnswer);
  return regex.test(testString);
}
```

Приклад: пошук email у HTML — патерн на кшталт `[a-zA-Z0-9._-]+@...`, тестовий рядок `admin_backup@apexdynamics.tech`.

### 2. `choice`

Перевірка: `String(answer) === correct_choice_id`.

**Важливо:** у `AnswerValidator.ts` для **`answer` типу `number`** поточна реалізація повертає `false`. Надійно передавати **рядок** ID варіанта (як робить `TacticalChoice`).

### 3. `email_check`

Фішингове лист: обов’язкові ключові слова в `subject` / `body`; заборонені розширення вкладень. ID вкладень зіставляються з іменами через `work_area.attachments`.

```typescript
const text = `${answer.subject || ''} ${answer.body || ''}`.toLowerCase();
const hasKeywords = requiredKeywords.every((keyword) =>
  text.includes(keyword.toLowerCase())
);
// Імена файлів: або вже з розширенням, або lookup у level.work_area.attachments
const hasBlocked = attachmentNames.some((name) =>
  blockedExtensions.some((ext) => name.toLowerCase().endsWith(ext.toLowerCase()))
);
return hasKeywords && !hasBlocked;
```

### 4. `ast_parse`

Спрощена перевірка підрядка у коді; для PowerShell — наявність `invoke-webrequest` або `iwr`.

```typescript
if (lowerPattern.includes('invoke-webrequest') || lowerPattern.includes('iwr')) {
  return lowerAnswer.includes('invoke-webrequest') || lowerAnswer.includes('iwr');
}
return lowerAnswer.includes(lowerPattern);
```

У production варто підключити AST-парсер (наприклад, acorn, Babel).

---

## Frontend

### Маршрути (`App.tsx`)

| Шлях | Опис |
|------|------|
| `/login` | Вхід / реєстрація |
| `/missions` | Список місій |
| `/missions/:missionId/assignments` | Список завдань місії |
| `/missions/:missionId/assignments/:assignmentId` | Ігровий екран (`GameLayout`), відновлення стану з API |
| `/skill-matrix` | Матриця MITRE |
| `/leaderboard` | Заглушка |
| `/settings` | Обліковий запис, вихід |

**Термінологія:** у UI використовується «завдання»; у моделі даних — `level`.

### `gameStore`

- `setMission` — завантажує рівні; **`currentLevel` не виставляється автоматично** — потрібен `loadLevel(levelId)` (наприклад з URL у `GameRoute`).
- `loadLevel` — встановлює активне завдання з кешу або через API.
- `submitAnswer` — виклик API та оновлення `authStore` (XP / stealth) за відповіддю.

### `authStore`

Користувач, `isAuthenticated`, `login` / `register` / `logout` / `refreshUser`; токен і стан зберігаються в `localStorage` (ключ на кшталт `cybertactics-auth`).

### `sidebarStore`

Згортання бічної панелі; персист у `localStorage` (`cybertactics-sidebar`).

### Сторінки (логіка)

**MissionsPage** — `GET /api/missions`, `GET /api/mitre/techniques`, картки місій з бейджами технік (наприклад перші 3 + лічильник).

**MissionAssignmentsPage** — `GET /api/missions/:id/levels`, прогрес користувача, список завдань з типом, нагородами, статусом виконання; перехід на ігровий маршрут.

**SkillMatrixPage** — групування технік за тактиками зі згортанням секцій; кнопки «розгорнути все» / «згорнути все»; пошук за ID, назвою, описом, тактикою; фільтри (усі / освоєні / неосвоєні); статистика та прогрес-бари по тактиках; сітка карток (адаптивна кількість колонок); клік відкриває **MitreTechniqueModal**; при завантаженні часто розгорнуті перші кілька тактик для зручності.

**LoginPage** — вхід і реєстрація через `authStore`.

**GameRoute** (`App.tsx`) — при прямому заході за URL відновлює місію, список рівнів і активне завдання через API (захист від «порожнього» стану store).

### Ігровий UI

- **GameLayout** — кнопка повернення до списку завдань (`/missions/:missionId/assignments`), двоколонковий layout: **ContextPanel** | **WorkArea**; заголовок місії.
- **ContextPanel** — діалоги з `level.dialogue`, **MitreTechniqueBadge** з описом, **HandlerAvatar** (якщо у місії `handlerGroup`), статус виконання, блок «ваша попередня **правильна** відповідь» / «правильна відповідь для навчання» (для `tactical_choice` показується текст варіанта, не сирий ID).
- **WorkArea** — заголовок завдання, компактний бейдж MITRE; перемикання за `task_type`.
- **CodeEditor** — Monaco, підтримка зазначених у рівні мов/шаблонів, відправка відповіді через `gameStore.submitAnswer`, після успіху — перехід / показ `nextLevelId`.
- **TacticalChoice** — радіо-варіанти з `work_area.choices`, на сервер відправляється **`choice.id`** (рядок).
- **PhishingConstructor** — поля To / Subject / Body, вибір вкладень; тіло відповіді `{ to, subject, body, attachments: string[] }`.
- **LevelTransition** — повноекранна анімація (Framer Motion) при переході між завданнями / після успіху (за підключенням у батьківському компоненті).

Для **Skill Matrix** див. підрозділ «Сторінки»; у модальному вікні додатково використовується **`api.getMitreTechnique(id)`** і поле `relatedMissions`.

> **Навігація:** `/missions` → список завдань місії → ігровий екран. Пряме відкриття URL ігрового завдання обробляє **`GameRoute`**: відновлює місію, рівні та `loadLevel(assignmentId)`.

- **MitreTechniqueBadge** — компактне відображення ID (посилання на attack.mitre.org), назви, тактики; розміри `sm` / `md` / `lg`.
- **MitreTechniqueModal** — розгорнута картка техніки:
  - коротке пояснення та офіційний опис MITRE;
  - платформи, приклади, рекомендації зі зменшення ризику, джерела даних для виявлення;
  - пов’язані місії проєкту (`relatedMissions`);
  - горизонтальна схема етапів kill chain з підсвіткою тактики техніки, підказки по кліку;
  - блок «як це працює» (спрощена 3-крокова схема);
  - зовнішнє посилання на attack.mitre.org;
  - закриття: Escape, backdrop, кнопка;
  - частина тексту в UI може бути неперекладеною (див. [статус локалізації](#статус-реалізації)).

---

## Локалізація (i18n)

- **Бібліотеки:** `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- **Джерело рядків:** БД (`Translation`), завантаження в **`main.tsx`** до рендеру через `loadMultipleNamespaces`.
- **Namespaces:** `common`, `mitre`, `tasks`, `missions`, `ui`, `skillMatrix`, `levels`, `dialogues`.
- **Мови:** за замовчуванням `uk`; у `main.tsx` підтримка `uk` / `en` при старті.
- **Компоненти:** `LanguageSwitcher`, `LanguageSelector`.
- **Обмеження:** частина сторінок і повідомлень може бути не винесена в переклади (див. статус вище).

---

## Гейміфікація

### Система досвіду (XP)

- Нараховується при **першому** успішному проходженні завдання (повторні проходження — згідно з повідомленням у відповіді API).
- Зберігається в **`UserStats.totalXp`**.
- У TopBar відображаються XP і прогрес до наступного рангу.

### Ранги

| Ранг | Діапазон XP |
|------|-------------|
| Script Kiddie | 0–499 |
| Novice Hacker | 500–1499 |
| Intermediate Hacker | 1500–2999 |
| Advanced Hacker | 3000–4999 |
| Elite Hacker | 5000 і більше |

Перерахунок рангу виконується в `levelService` при зміні `totalXp`.

### Метрика Stealth

- Старт: **100** (у межах 0–100).
- Невдала спроба: **−5** до Stealth у `UserStats`.
- Успіх: зміна згідно з `rewards.stealth_impact` у рівні.
- Відображення: індикатор у **TopBar** (окремий компонент **`StealthBar`** не використовується в поточному layout).

### Прогрес і MITRE

- По кожному завданню: **`UserProgress`** (`completed`, `attempts`, `lastAnswer`).
- По кожній освоєній техніці: **`UserMitreTechnique`** (після успіху, якщо в рівня задано `mitre_id`).
- **Skill Matrix** візуалізує всі техніки з БД і перетин із пройденими ID з `GET /users/:id/stats`.

---

## Дизайн-система

### Кольорова палітра (`tailwind.config.js`)

| Токен | Hex | Використання |
|-------|-----|--------------|
| `cyber-background` | `#0A0E1A` | Фон застосунку |
| `cyber-panel` | `#111827` | Панелі, картки |
| `cyber-border` | `#1E3A5F` | Межі |
| `cyber-primary` | `#00D9FF` | Акценти, кнопки |
| `cyber-success` | `#00FF85` | Успіх, прогрес |
| `cyber-danger` | `#FF006E` | Помилки, небезпека |

### Типографіка

| Клас / шрифт | Призначення |
|--------------|-------------|
| `font-heading` | Заголовки (Orbitron) |
| `font-body` | Основний текст (Inter) |
| `font-mono` / `font-code` | Код (Fira Code) |

### Стилі в `client/src/styles/index.css`

- **`.cyber-glow`** — неонове світіння (cyan), на кшталт `box-shadow: 0 0 10px rgba(0, 217, 255, 0.5)`.
- **`.cyber-glow-green`** — зелене світіння.
- **`.cyber-button`** — основна кнопка: фон primary, hover з glow, active зі зменшенням scale.
- **`.cyber-scrollbar`** — кастомний скролбар (ширина ~8px, кольори primary/success).

У конфігу Tailwind також є `boxShadow`: `glow`, `glow-green`, `glow-pink`.

### Фавікон

`client/public/favicon.svg` — стилізована «C», кіберпанк-палітра.

---

## Розгортання

### Вимоги

- Node.js 20+  
- npm  
- Docker / Docker Compose для PostgreSQL із `server/docker-compose.yml`

### Кроки

1. Зібрати **shared**: `cd shared && npm install && npm run build`
2. **server**: `npm install`, `.env` з `DATABASE_URL`, `JWT_SECRET`, `PORT`
3. Підняти БД: `cd server && docker-compose up -d`
4. `npm run db:migrate` && `npm run seed`
5. Опційно після старту API — синхронізація MITRE (наповнення довідника):

   ```bash
   curl -X POST http://localhost:3001/api/mitre/sync
   ```

   Після синхронізації записи технік містять платформи, джерела даних, обхід захисту, права, згенеровані підказки тощо.

6. **client:** `cd client && npm install`, `npm run dev` (порт **5173**, проксі `/api` на backend).

### Приклад `.env` у каталозі `server/`

```env
DATABASE_URL="postgresql://cybertactics:cybertactics_password@localhost:5432/cybertactics?schema=public"
JWT_SECRET="cybertactics-secret-key-change-in-production"
PORT=3001
```

У production-середовищі замініть паролі та секрет на власні.

### Режим розробки (два термінали)

Кореневого `npm run dev` для всього репозиторію немає — запускайте сервер і клієнт окремо:

```bash
cd server && npm run dev
```

```bash
cd client && npm run dev
```

### Production

1. Збірка: `shared` → `npm run build`; `server` → `npm run build`; `client` → `npm run build`.
2. Налаштування змінних середовища на сервері.
3. PostgreSQL + міграції + (за потреби) seed і `POST /api/mitre/sync`.
4. Запуск API: `cd server && npm start`.
5. Роздача зібраної статики клієнта (nginx, CDN тощо).

**Примітка:** `Dockerfile` у `server/` збирає **лише backend**; PostgreSQL піднімається через **`docker-compose.yml`**.

---

## Додаткова інформація

### Тестовий обліковий запис (після seed)

Значення з `seed.ts` (за замовчуванням): **admin@cybertactics.test** / **admin123**, username **admin**.

### MITRE sync (зміст даних)

З STIX bundle зберігаються: ідентифікатор, назва, опис, тактика, URL; поля `x_mitre_*`; згенеровані або витягнуті **examples** та **mitigation** (див. `mitreSyncService.ts`).

### Приклади технік у контенті

Зокрема T1593, T1583.001, T1566.001, T1059.001, T1547.001 — залежать від місій у БД / JSON seed.

### Відомі неточності старої документації (виправлено тут)

- Завантаження місій/рівнів: для **submit** використовується БД, не JSON-файл.
- Не існує `npm run migrate:json` — використовуйте **`npm run seed`**.
- Дублікати розділів про MITRE/фавікон у попередній версії документа прибрано.

---

## Структура JSON полів рівня

Дані зберігаються в таблиці `levels` (PostgreSQL JSONB). Орієнтовна структура:

- **`dialogue`** — `[{ "speaker": "system" | "handler" | "hint", "text": string }]`
- **`work_area`** — залежить від `task_type`:
  - `code_editor`: наприклад `code_snippet`, `input_type`, `placeholder`
  - `tactical_choice`: `choices: [{ id, text, correct?, feedback? }]`
  - `phishing_constructor`: `email_fields`, `attachments` тощо
- **`validation`** — наприклад `{ "type": "regex_match", "correct_pattern", "test_string" }` або `choice` / `email_check` / `ast_parse` з відповідними полями
- **`rewards`** — `{ "xp": number, "stealth_impact": number }` (у JSON часто ключі узгоджені з клієнтом як `stealth_impact`)
- **`hints`** — масив рядків

Повний приклад місії можна подивитись у `server/src/data/missions/*.json` як еталон для seed.

---

## Висновок

Документ описує поточний стан **CyberTactics MVP**: стек, інтеграцію MITRE CTI, локалізацію, API та межі реалізації.

**Версія документації:** 2.1 (українська, розширена)  
**Оновлено:** 2026-05-15
