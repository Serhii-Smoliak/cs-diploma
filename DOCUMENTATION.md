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
18. [Threat model](#threat-model)
19. [Перевірка безпеки](#перевірка-безпеки)

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

---

## Статус реалізації

| Область | Статус | Примітка |
|--------|--------|----------|
| Реєстрація / вхід, JWT | Реалізовано | `bcryptjs`, `jsonwebtoken` |
| CRUD даних місій і рівнів із БД | Реалізовано | Seed з JSON у `server/src/data/missions/` |
| Відправка відповіді, прогрес, XP, Stealth | Реалізовано | `levelService`, `UserProgress`, `UserStats` |
| Stealth economy (regen, блок при 0, mock-відновлення) | Реалізовано | `stealthService`, `stealthConfig`, `StealthDepletedModal` |
| Типи завдань (code / choice / phishing) | Реалізовано | `AnswerValidator` |
| MITRE: синхронізація з GitHub CTI | Реалізовано | `POST /api/mitre/sync`, `mitreSyncService.ts` |
| MITRE: матриця, модальне вікно, зв’язок з місіями | Реалізовано | `SkillMatrixPage`, `MitreTechniqueModal` |
| Переклади: мови, namespaces, API | Реалізовано | `Language`, `Translation`, `translations` routes |
| i18next на клієнті | Реалізовано | Завантаження з API до рендеру |
| Таблиця лідерів (Leaderboard) | **Не реалізовано** | Сторінка-заглушка «coming soon» |
| RBAC (`USER` / `ADMIN`), admin middleware | Реалізовано | `User.role`, `requireAdmin.ts`; роль перевіряється в БД, не в JWT |
| Захист адмін-операцій | Реалізовано | `POST /api/mitre/sync`, `POST /api/translations`, `POST /api/translations/bulk` — JWT + `ADMIN` |
| IDOR progress / stats | Реалізовано | `GET /users/me/progress`, `/me/stats`; legacy `/:id/*` — лише якщо `id` = JWT `userId` |
| Валідація translations API | Реалізовано | Whitelist `locale` / `namespace`; формат `key` на POST; Helmet, rate limit на auth |
| `UserStats.completedLevels` | **Частково** | Поле є в схемі; при проходженні рівнів у `levelService` не інкрементується (орієнтир — `UserProgress`) |
| Окремий компонент `StealthBar` | **Не використовується** | Stealth у `TopBar`; модалка `StealthDepletedModal` у `Layout` |
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
│   │   │   │                 # LevelTransition, StealthBar (застарілий окремий UI)
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
│   │   ├── routes/           # auth, missions, levels, users, mitre, translations
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
| `role` | Enum `UserRole` | `USER` (за замовч.) або `ADMIN`; адмін-ендпоінти перевіряють у БД |
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
| `taskType` | String | `code_editor`, `tactical_choice`, `phishing_constructor`, `sentence_constructor` |
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
| `lastStealthUpdateAt` | Час останнього оновлення Stealth; використовується для пасивного regen (`stealthService`) |

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

### Міграції, MITRE sync і seed

```bash
cd server
npm run db:migrate
npm run dev
```

Після старту API:

```bash
curl -X POST http://localhost:3001/api/mitre/sync
cd server && npm run seed
```

**Порядок важливий:** спочатку `POST /api/mitre/sync`, потім `npm run seed`. Рівні в `levels` посилаються на `mitre_techniques` (FK). Якщо seed запустити до sync, місії створяться, але рівні — ні; `GET /api/missions/:id/levels` поверне 404.

Seed створює тестового користувача й завантажує місії/рівні з `server/src/data/missions/`.

---

## API Endpoints

**База:** `http://localhost:3001/api`  
**Auth:** заголовок `Authorization: Bearer <token>` для маршрутів з позначкою JWT.

### Загальне

- **GET** `/health` — перевірка, що backend запущений і відповідає

### Auth

- **POST** `/auth/register` — реєстрація користувача, отримання JWT
- **POST** `/auth/login` — вхід, отримання JWT (Stealth у відповіді з passive regen)

### Місії та рівні

- **GET** `/missions` — список місій для сторінки Missions (назва, складність, MITRE-техніки)
- **GET** `/missions/:id/levels` — рівні (завдання) місії для assignments і ігрового екрана
- **POST** `/levels/:id/submit` **JWT** — відправка відповіді на рівень (перевірка, XP, Stealth, прогрес); `:id` = `levelId`, URL-encoded

### Користувачі

- **GET** `/users/me` **JWT** — профіль поточного користувача (xp, rank, stealth, avatarUrl; passive regen)
- **PUT** `/users/me/avatar` **JWT** — завантаження аватара (data URL після crop на клієнті)
- **GET** `/users/me/progress` **JWT** — прогрес поточного користувача (рекомендовано)
- **GET** `/users/me/stats` **JWT** — статистика поточного користувача (рекомендовано)
- **GET** `/users/:id/progress` **JWT** — _deprecated_; `id` у URL має збігатися з `userId` з JWT, інакше 403
- **GET** `/users/:id/stats` **JWT** — _deprecated_; те саме правило власності
- **POST** `/users/me/stealth/masking` **JWT** — mock «купити маскування», відновлення Stealth
- **POST** `/users/me/stealth/wait` **JWT** — mock «зачекати», часткове відновлення Stealth

### MITRE

- **GET** `/mitre/techniques` — довідник MITRE ATT&CK з БД для Skill Matrix
- **GET** `/mitre/techniques/:id` — одна техніка з деталями та пов’язаними місіями (модальне вікно)
- **POST** `/mitre/sync` **JWT + ADMIN** — синхронізація технік з MITRE CTI у PostgreSQL

### Переклади

- **GET** `/translations/languages` — список мов для перемикача (uk, en)
- **GET** `/translations?locale=&namespace=` — переклади одного namespace; `locale` / `namespace` — whitelist + заборона path-послідовностей у query
- **GET** `/translations/namespaces?locale=&namespaces=` — кілька namespaces; `namespaces` — список через кому з whitelist
- **POST** `/translations` **JWT + ADMIN** — upsert одного рядка; `key` — `[a-zA-Z][a-zA-Z0-9._-]*`, без `..` / `/` / `\`
- **POST** `/translations/bulk` **JWT + ADMIN** — масовий upsert (до 500 рядків), та сама валідація `key` / `value`

**Примітки:** при Stealth ≤ 0 submit повертає `stealthDepleted: true`. Поле `correctAnswer` у відповіді submit **не повертається**. Аватари після upload: `/uploads/avatars/{userId}.jpg`. JWT містить `userId` і `email`; **роль не в токені** — для admin запитів сервер читає `users.role`.

---

## Бізнес-логіка

### `submitAnswer` (`levelService.ts`)

1. Перевірка існування `User`.
2. **Passive regen** Stealth (`getCurrentStealth`) і **блок submit**, якщо Stealth ≤ 0 (`stealthDepleted: true`).
3. Пошук рівня за **`levelId`** (`prisma.level.findFirst({ where: { levelId } })`) — не плутати з первинним ключем `id` рядка.
4. Мапінг на тип `Level` (shared).
5. `validateAnswer(level, answer)`.
6. Створення або оновлення `UserProgress`: збільшення `attempts`; при успіху — `completed: true`, оновлення `lastAnswer`; при помилці — попередній `lastAnswer` зберігається.
7. При валідній відповіді: нарахування XP і зміна Stealth з **`rewards.stealth_impact`**, перерахунок рангу, `UserMitreTechnique.upsert` якщо є `mitre_id`, обчислення **`nextLevelId`**. Якщо завдання вже було успішно виконано раніше — повтор без повторного нарахування XP.
8. При невалідній відповіді: Stealth **`−STEALTH_FAIL_PENALTY`** (за замовчуванням 5, мінімум 0), синхронізація `User` + `UserStats`.

У відповіді submit з сервера може бути поле **`userAnswer`**. Еталонна відповідь з `validation` **не повертається**.

### Stealth economy

Реалізація: `stealthService.ts`, `stealthConfig.ts`.

Конфігурація читається з **env** (`server/.env`); якщо змінної немає — використовується fallback у коді.

| Змінна | За замовч. | Опис |
|--------|------------|------|
| `STEALTH_REGEN_INTERVAL_SECONDS` | 3600 | Інтервал відновлення Stealth (сек): пасивно та для mock «зачекати» |
| `STEALTH_REGEN_AMOUNT` | 10 | Скільки Stealth додається за один інтервал |
| `STEALTH_MAX` | 100 | Верхня межа Stealth |
| `STEALTH_MASKING_RESTORE` | 50 | Мінімальний Stealth після mock «маскування» |
| `STEALTH_FAIL_PENALTY` | 5 | Штраф за невірну відповідь |

**Пасивне відновлення:** при `GET /users/:id/stats`, `GET /users/me`, login і перед зміною Stealth викликається `applyPassiveRegen`: за кожні повні `STEALTH_REGEN_INTERVAL_SECONDS` з `lastStealthUpdateAt` додається `STEALTH_REGEN_AMOUNT`, cap — `STEALTH_MAX`.

**Блок при 0:** submit не приймається; клієнт показує `StealthDepletedModal` з трьома mock-опціями:
- **Маскування** — `POST /users/me/stealth/masking` → `max(поточний, STEALTH_MASKING_RESTORE)`;
- **Платний тариф** — alert-заглушка (без API);
- **Зачекати** — `POST /users/me/stealth/wait` → `+STEALTH_REGEN_AMOUNT`, якщо з `lastStealthUpdateAt` минуло ≥ `STEALTH_REGEN_INTERVAL_SECONDS`; інакше **429** з `retryAfterMs`.

**Frontend:** індикатор у `TopBar` (колір: зелений / жовтий &lt;30% / червоний при 0); модалка — `StealthDepletedModal` у `Layout`.

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
- **ContextPanel** — діалоги з `level.dialogue`, **MitreTechniqueBadge** з описом, статус виконання, блок «ваша попередня **правильна** відповідь» / «правильна відповідь для навчання» (для `tactical_choice` показується текст варіанта, не сирий ID).
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

### Stealth (метрика «стелсу»)

Stealth — ресурс 0–100%, що зменшується за невірні відповіді і відновлюється пасивно або через mock-дії. Повна логіка — у розділі [Stealth economy](#stealth-economy) (бізнес-логіка).

| Подія | Зміна Stealth |
|-------|----------------|
| Старт / реєстрація | 100 (cap — `STEALTH_MAX`) |
| Невірна відповідь | `−STEALTH_FAIL_PENALTY` (env, за замовч. 5) |
| Успіх | `rewards.stealth_impact` рівня (часто 0) |
| Пасивно | `+STEALTH_REGEN_AMOUNT` кожні `STEALTH_REGEN_INTERVAL_SECONDS` |
| Mock «маскування» | до мінімум `STEALTH_MASKING_RESTORE` |
| Mock «зачекати» | `+STEALTH_REGEN_AMOUNT` після `STEALTH_REGEN_INTERVAL_SECONDS` |

**UI:** смуга в **TopBar**; при 0 — **StealthDepletedModal** (блок submit на клієнті й сервері).

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

### Кроки (перший запуск після клонування)

1. **shared:** `cd shared && npm install && npm run build`
2. **`.env`:** у каталозі `server/` скопіювати `.env.example` → `.env`
3. **PostgreSQL:** `cd server && docker compose up -d`
4. **Залежності:** `cd server && npm install`; `cd client && npm install`
5. **Міграції:** `cd server && npm run db:migrate`
6. **Backend:** `cd server && npm run dev` (порт **3001**)
7. **MITRE sync** (обов'язково **до** seed):

   ```bash
   curl -X POST http://localhost:3001/api/mitre/sync
   ```

   Наповнює довідник `mitre_techniques` (~800+ технік). Без цього кроку seed не створить рівні місій.

8. **Seed:** `cd server && npm run seed` (тестовий користувач + місії/рівні)
9. **Frontend:** `cd client && npm run dev` (порт **5173**, проксі `/api` → backend)
10. Відкрити `http://localhost:5173`, увійти: **admin@cybertactics.test** / **admin123**

### Приклад `.env` у каталозі `server/`

Скопіюйте з `.env.example`:

```env
# PostgreSQL
POSTGRES_USER=cybertactics
POSTGRES_PASSWORD=cybertactics_password
POSTGRES_DB=cybertactics
POSTGRES_PORT=5432

# Prisma
DATABASE_URL="postgresql://cybertactics:cybertactics_password@localhost:5432/cybertactics?schema=public"

# API
JWT_SECRET=your-secret-key-change-in-production
PORT=3001

# Stealth economy (опційно; без них — дефолти з stealthConfig.ts)
STEALTH_MAX=100
STEALTH_REGEN_INTERVAL_SECONDS=3600
STEALTH_REGEN_AMOUNT=10
STEALTH_MASKING_RESTORE=50
STEALTH_FAIL_PENALTY=5
```

У production-середовищі замініть паролі та секрет на власні. Параметри Stealth можна змінювати без правок коду — достатньо перезапустити backend.

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
2. Налаштування змінних середовища на сервері (`.env` за зразком `.env.example`).
3. PostgreSQL + міграції → запуск API → `POST /api/mitre/sync` → `npm run seed`.
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
  - `sentence_constructor`: `email_to`, `fields[]` (банк токенів + слоти), `attachments`
- **`validation`** — наприклад `{ "type": "regex_match", "correct_pattern", "test_string" }` або `choice` / `email_check` / `ast_parse` / `sentence_combination` з відповідними полями (`correct_sequences`, `required_attachments`, …)
- **`rewards`** — `{ "xp": number, "stealth_impact": number }` (у JSON часто ключі узгоджені з клієнтом як `stealth_impact`)
- **`hints`** — масив рядків

Повний приклад місії можна подивитись у `server/src/data/missions/*.json` як еталон для seed.

---

## Threat model

Модель загроз для MVP будується **ітеративно**: базові припущення (тиждень 1 — auth, JWT, публічні read API), потім **delta** після змін функціоналу та безпеки. Нижче — зафіксовані оновлення; детальний план тижнів — [PLAN.md](./PLAN.md).

### Базовий контекст (MVP)

| Актив | Загроза (приклад) | Поточний контроль |
|-------|-------------------|-------------------|
| Облікові записи, JWT | Brute force, витік секрету | `bcrypt`, `JWT_SECRET`, rate limit на `/auth/login` і `/auth/register` |
| `UserProgress`, `UserStats` | IDOR (читання чужого прогресу) | Див. [delta, тиждень 3](#delta-тиждень-3) |
| Переклади, MITRE sync | Несанкціонована зміна даних | Admin RBAC на write; read перекладів публічний для i18n |
| Відповіді рівнів (`validation`) | Витік еталонної відповіді | Див. [delta, тиждень 2](#delta-тиждень-2) |
| HTTP-відповіді | MIME-sniffing, fingerprinting, verbose errors | `helmet` (`X-Content-Type-Options: nosniff`), `app.disable('x-powered-by')`, узагальнені 4xx/5xx для API |

<a id="delta-тиждень-2"></a>

### Delta, тиждень 2 (навчальний контент і Stealth)

Після реалізації підказок, submit API, sentence constructor і Stealth economy (PLAN.md §2.2–2.4):

| Зміна функціоналу | Threat | Control / зміна ризику |
|-------------------|--------|-------------------------|
| Прибрано early reveal правильної відповіді в UI | Витік навчальних даних до проходження рівня | Підказки по одній (`TaskHints`); без показу еталону в Context |
| Прибрано `correctAnswer` з відповіді `POST /levels/:id/submit` | Розкриття `validation` через API | У відповіді лише `hint`, progress, XP; еталон лишається на сервері |
| `sentence_constructor` замість вільного фішинг-тексту | Offensive / неетичний user-generated контент | Фіксований банк токенів у JSON; валідатор `sentence_combination` |
| Stealth, regen з env, блок submit при 0 | Зловживання regen, обхід cooldown | `STEALTH_*` env, `getCurrentStealth`, `stealthDepleted` на submit; mock paywall (masking / wait) |

**Ризиковий профіль:** знижено витік «правильної відповіді» та неконтрольований текст від гравця; залишається залежність від якості seed JSON і відсутності повноцінного rate limit на submit (поза scope тижня 2).

<a id="delta-тиждень-3"></a>

### Delta, тиждень 3 (безпека платформи)

Після RBAC, захисту admin endpointʼів і hardening translations / users API:

| Зміна / компонент | Threat (STRIDE-орієнтир) | Control | Файли / endpoint |
|-------------------|--------------------------|---------|------------------|
| `User.role` (`USER` \| `ADMIN`) | **Elevation of privilege** — звичайний user викликає sync або змінює переклади | `requireAdmin`: роль з БД за `req.userId`; 403 для non-admin | `middleware/requireAdmin.ts`, міграція `20260601120000_add_user_role` |
| JWT без claim `role` | Підробка ролі в токені | Роль **не** довіряється з JWT; лише запит до `users` при admin-операції | `routes/auth.ts` (payload: `userId`, `email`) |
| `POST /mitre/sync` | Псування довідника MITRE, DoS через важкий sync | `authenticate` + `requireAdmin` | `routes/mitre.ts` |
| `POST /translations`, `POST /translations/bulk` | Data poisoning (path-like keys, mass upsert) | JWT + ADMIN; `parseTranslationKey` / `parseTranslationValue`; whitelist `namespace` / `locale`; ліміт bulk 500 | `validators/translationParams.ts`, `routes/translations.ts` |
| `GET /translations*` (публічний) | Path traversal у query; **відображення** шкідливих ключів із БД (info disclosure після fuzz) | `assertSafeSegment` на query; **не** фільтрує legacy-ключі в БД — потрібен ручний cleanup | Той самий validator; сміття від ZAP — операційна задача |
| `GET /users/:id/progress\|stats` | **IDOR** — підміна `:id` | `resolveOwnerUserId`: 403 якщо `paramId !== userId`; клієнт на `/users/me/*` | `middleware/ownership.ts`, `routes/users.ts` |
| Auth endpoints | Brute force, enumeration | `express-rate-limit` на login/register; узагальнені повідомлення реєстрації | `middleware/authRateLimit.ts`, `routes/auth.ts` |
| Глобальні HTTP-помилки | Application error disclosure | `apiErrorHandler` / `apiNotFoundHandler`; без `error.message` у публічних 500 | `middleware/errorHandler.ts`, `index.ts` |

**Критерій готовності (тиждень 3):** неавторизований або `USER` отримує 401/403 на `POST /mitre/sync` і `POST /translations*`; користувач A не читає progress/stats користувача B через підміну `:id`.

#### Залишкові ризики та backlog

| Ризик | Статус | Рекомендація |
|-------|--------|--------------|
| Сміттєві `key` у `translations` після DAST (ZAP) | Відкритий до cleanup | `DELETE` рядків з `..`, `/`, `\` у `key`; повторний ZAP |
| `GET /translations` без auth | Прийнятий (i18n) | Не повертати службові/debug ключі; опційно фільтр `TRANSLATION_KEY_PATTERN` на read |
| Legacy `GET /users/:id/progress` | Deprecated | Видалити після повного переходу клієнта на `/me/*` |
| Admin через seed email | Операційний | `admin@cybertactics.test` лише dev/staging; сильний `JWT_SECRET` у prod |
| CRUD місій через API | Не реалізовано | При додаванні — той самий патерн `authenticate` + `requireAdmin` |

#### Manual verification (чеклист)

1. **USER** + валідний JWT → `POST /api/mitre/sync` → **403**.
2. Без JWT → `POST /api/translations` → **401**.
3. **USER A** + JWT → `GET /api/users/{id_B}/progress` → **403**.
4. **ADMIN** → `POST /api/translations` з `key: "../../etc/passwd"` → **400**.
5. **GET** `/api/translations/namespaces?namespaces=../../../etc` → **400**.

---

## Перевірка безпеки

Розділ описує, **як підтвердити безпеку** CyberTactics для дипломної роботи. Детальний план робіт — **тиждень 6** у [PLAN.md](./PLAN.md). Модель загроз і контролі після тижнів 2–3 — у розділі [Threat model](#threat-model).

### Підхід

| Етап | Інструмент | Що перевіряє |
|------|------------|--------------|
| CI/CD | **GitHub Actions** | build, lint, security gates перед merge/deploy (див. [ci-cd-pipeline.md](./diploma-docs/ci-cd-pipeline.md)) |
| SAST | **SonarCloud** / SonarQube | вихідний код (client, server, shared): вразливості, secrets, smells |
| DAST | **OWASP ZAP** | запущений застосунок: заголовки, auth, API, OWASP Top 10 |
| SCA | **npm audit** | вразливості в залежностях |
| Manual | чеклист | JWT, RBAC, IDOR на progress, admin endpoints |

**Sonar** — до деплою (shift-left). **ZAP** — на local/staging після підняття frontend + API; **повтор** на staging URL перед захистом.

### SonarCloud (SAST)

1. Підключити GitHub-репозиторій на [sonarcloud.io](https://sonarcloud.io).
2. Додати `sonar-project.properties` (див. PLAN.md §6.1).
3. Запустити аналіз (CI або `npx sonarqube-scanner`).
4. Досягти **Quality Gate**; виправити Critical/High або задокументувати accepted risk.

**Артефакт:** скриншот dashboard (Security, Quality Gate).

### OWASP ZAP (DAST)

1. Запустити `server` + `client` (або staging).
2. **Baseline** (passive) по URL фронтенду:
   ```bash
   docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
     -t http://localhost:5173 -r docs/security/zap-baseline-report.html
   ```
3. **Authenticated API scan:** login → JWT у ZAP Context → spider/active scan по `/api/*` (обмежена інтенсивність).
4. Зберегти HTML-звіт у `docs/security/`.

**Артефакт:** `zap-baseline-report.html`, `zap-api-report.html` (або еквівалент).

### Звіт для захисту (шаблон)

| Інструмент | Тип | Дата | Результат | Звіт |
|------------|-----|------|-----------|------|
| SonarCloud | SAST | _заповнити_ | Quality Gate: passed / failed | скриншот / посилання |
| OWASP ZAP | DAST | _заповнити_ | High: 0 open | `docs/security/*.html` |
| npm audit | SCA | _заповнити_ | critical: 0 | лог CI |

Короткий висновок для тексту диплому: *«Threat model (тиждень 3) визначив контролі; Sonar перевірив код статично; OWASP ZAP — поведінку live API; manual testing — сценарії зловживання progress/auth.»*

---

## Висновок

Документ описує поточний стан **CyberTactics MVP**: стек, інтеграцію MITRE CTI, локалізацію, API та межі реалізації.

**Версія документації:** 2.3 (українська, розширена)  
**Оновлено:** 2026-06-01
