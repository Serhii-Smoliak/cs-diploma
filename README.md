# CyberTactics MVP

Гейміфікована платформа симуляції кібератак на базі MITRE ATT&CK.

## Опис

CyberTactics — освітня онлайн-платформа (SaaS), що навчає логіці кібератак і захисту через гейміфіковані сценарії. Працює в браузері; поєднує механіки на кшталт задач з кодом (Codewars) і текстових RPG-рішень, використовуючи матрицю **MITRE ATT&CK** як основу для рівнів.

## Технологічний стек

- **Frontend**: React 18.3+ + TypeScript + Vite + Tailwind CSS + Monaco Editor
- **Backend**: Node.js 20+ + Express 5 + TypeScript + PostgreSQL + Prisma ORM
- **Керування станом**: Zustand
- **Анімації UI**: Framer Motion
- **Редактор коду**: Monaco Editor

## Структура проєкту

```
cs-diploma/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # layout, game, tasks, mitre, profile
│   │   ├── pages/          # Missions, SkillMatrix, Support, News, Admin*, …
│   │   ├── store/          # Zustand (auth, game, sidebar)
│   │   ├── services/       # api.ts
│   │   └── utils/          # mitreSearch, notificationText, rank, …
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # auth, missions, users, support, news, admin, …
│   │   ├── services/       # levelService, stealthService, supportService, …
│   │   ├── validators/
│   │   └── data/missions/  # JSON місій для seed
│   └── prisma/             # schema, migrations, seed, seed-translations
└── shared/                 # Спільні типи TypeScript
```

## Установка та запуск

### Вимоги

- Node.js 20+ LTS
- npm
- Docker / Docker Compose (для PostgreSQL з `server/docker-compose.yml`)

Кореневого `package.json` немає — залежності ставляться окремо в `shared`, `server` і `client`.

### Перший запуск (після клонування репозиторію)

**1. Змінні середовища**

```bash
cd server
copy .env.example .env
```

На Linux/macOS: `cp .env.example .env`. Значення за замовчуванням підходять для локального Docker Compose.

**2. PostgreSQL**

```bash
cd server
docker compose up -d
```

**3. Залежності**

```bash
cd shared
npm install
npm run build

cd ../server
npm install

cd ../client
npm install
```

**4. Міграції БД**

```bash
cd server
npm run db:migrate
```

**5. Backend (потрібен для синхронізації MITRE)**

```bash
cd server
npm run dev
```

**6. Синхронізація MITRE ATT&CK** (обов'язково **до** seed — рівні посилаються на техніки в БД)

```bash
curl -X POST http://localhost:3001/api/mitre/sync
```

Або `POST http://localhost:3001/api/mitre/sync` у Postman / Insomnia.

**7. Seed**

У **новому терміналі** (backend лишається запущеним):

```bash
cd server
npm run seed
npm run seed-translations
```

**8. Frontend**

```bash
cd client
npm run dev
```

**9. Відкрийте застосунок**

- URL: `http://localhost:5173`
- Тестовий вхід (після seed): **admin@cybertactics.test** / **admin123**

### Розробка (наступні рази)

У **двох терміналах**:

```bash
# Backend (порт 3001)
cd server
npm run dev
```

```bash
# Frontend (порт 5173, проксі /api → backend)
cd client
npm run dev
```

### Збірка

```bash
cd shared && npm run build && cd ..
cd server && npm run build && cd ..
cd client && npm run build && cd ..
```

## CI/CD Security Pipeline

Перед деплоєм на Railway код проходить автоматичні перевірки в **GitHub Actions** (workflow `.github/workflows/security-ci.yml`):

- build / lint / typecheck для `shared`, `server`, `client`
- dependency audit (`npm audit`)
- SonarCloud SAST + Quality Gate
- Snyk (npm dependencies)
- Trivy (Docker image backend)

Детальна схема, security gates і налаштування secrets — у [diploma-docs/ci-cd-pipeline.md](./diploma-docs/ci-cd-pipeline.md).

**Deploy flow:** PR → green CI → merge в `main` → Railway deploy. Рекомендовано увімкнути branch protection на `main`.

## Використання

1. Запустіть backend і frontend (див. вище).
2. Відкрийте в браузері `http://localhost:5173`.
3. Увійдіть (тестовий акаунт після seed — нижче) або зареєструйте новий.
4. Оберіть місію **Operation Ghost**, щоб почати.
5. Проходьте завдання, вирішуйте задачі й заробляйте XP.

## Місії та завдання

### Operation Ghost (5 завдань)

1. **Reconnaissance (T1593)** — пошук email адміна в HTML-коді
2. **Resource Development (T1583.001)** — вибір домену для фішингу
3. **Initial Access (T1566.001)** — складання фішингового листа
4. **Execution (T1059.001)** — написання PowerShell-команди
5. **Persistence (T1547.001)** — вибір ключа реєстру для автозавантаження

**Основні маршрути:**

| Шлях | Опис |
|------|------|
| `/login`, `/agreement` | Вхід / реєстрація, угода користувача |
| `/missions`, `/missions/:id/assignments`, `/missions/:id/assignments/:assignmentId` | Місії та ігровий екран |
| `/skill-matrix` | Матриця MITRE ATT&CK |
| `/leaderboard`, `/ranks` | Таблиця лідерів, кар’єрні ранги |
| `/support` | Звернення до підтримки (ліміт 3/день) |
| `/news`, `/news/:id` | Новини |
| `/profile` | Профіль і аватар |
| `/faq`, `/community` | FAQ і спільнота |
| `/admin/tickets`, `/admin/news`, `/settings` | **ADMIN:** підтримка, новини, користувачі |

## API

Повна документація — [DOCUMENTATION.md](./DOCUMENTATION.md) (API, БД, Stealth, підтримка, сповіщення, threat model).

## Особливості

- Браузерний симулятор без окремого інсталювання клієнта
- Гейміфікація: XP, ранги, Stealth (regen, блок при 0, mock-відновлення), таблиця лідерів
- Типи завдань: Code Editor, Tactical Choice, Phishing Constructor, Sentence Constructor
- MITRE ATT&CK: синхронізація з CTI, Skill Matrix з пошуком за ID техніки, модальні вікна Kill Chain
- Підтримка користувачів: звернення, відповіді адміна, закриття з причиною
- Сповіщення в шапці (відповідь підтримки, rank-up, новини)
- Новини: публічна стрічка + адмін CRUD, сповіщення при публікації
- Профіль з аватаром; блокування акаунтів адміном
- Локалізація **uk/en** (i18next, переклади в БД, `seed-translations`)
- Кіберпанк-дизайн, Monaco Editor, Framer Motion

## Ліцензія

MIT

## Тестовий обліковий запис

Після `npm run seed` у каталозі `server` (після `POST /api/mitre/sync`):

- **Email:** admin@cybertactics.test  
- **Пароль:** admin123  

Сид визначено у `server/prisma/seed.ts`. Повторне наповнення даних:

```bash
curl -X POST http://localhost:3001/api/mitre/sync
cd server && npm run seed
```

Користувач створюється з початковими значеннями: XP 0, ранг Script Kiddie, Stealth 100%. Увійдіть і проходьте місію **Operation Ghost**.
