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
ct_mvp/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI-компоненти
│   │   ├── pages/          # Сторінки
│   │   ├── store/          # Zustand
│   │   ├── services/       # API-клієнт
│   │   └── styles/         # Глобальні стилі
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API-маршрути
│   │   ├── services/       # Бізнес-логіка
│   │   ├── validators/     # Перевірка відповідей
│   │   ├── db/             # Екземпляр Prisma Client
│   │   └── data/           # JSON місій для seed
└── shared/                 # Спільні типи TypeScript
```

## Установка та запуск

### Вимоги

- Node.js 20+ LTS
- Yarn або npm
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
yarn install
yarn build

cd ../server
yarn install

cd ../client
yarn install
```

**4. Міграції БД**

```bash
cd server
yarn db:migrate
```

**5. Backend (потрібен для синхронізації MITRE)**

```bash
cd server
yarn dev
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
yarn seed
```

**8. Frontend**

```bash
cd client
yarn dev
```

**9. Відкрийте застосунок**

- URL: `http://localhost:5173`
- Тестовий вхід (після seed): **admin@cybertactics.test** / **admin123**

### Розробка (наступні рази)

У **двох терміналах**:

```bash
# Backend (порт 3001)
cd server
yarn dev
```

```bash
# Frontend (порт 5173, проксі /api → backend)
cd client
yarn dev
```

### Збірка

```bash
cd shared && yarn build && cd ..
cd server && yarn build && cd ..
cd client && yarn build && cd ..
```

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

**Маршрути:**

- `/missions` — список місій
- `/missions/:missionId/assignments` — список завдань місії
- `/missions/:missionId/assignments/:assignmentId` — виконання конкретного завдання

## API

Повний перелік endpointів і призначення — у [DOCUMENTATION.md § API Endpoints](./DOCUMENTATION.md#api-endpoints).

## Особливості

- Браузерний симулятор без окремого інсталювання клієнта
- Гейміфікація (XP, ранги, метрика Stealth)
- Три типи завдань: Code Editor, Tactical Choice, Phishing Constructor
- Інтеграція з MITRE ATT&CK — синхронізація технік із офіційного репозиторію CTI
- Skill Matrix — усі техніки MITRE та прогрес користувача
- Модальні вікна технік з візуалізацією Kill Chain
- Кіберпанк-дизайн інтерфейсу
- Monaco Editor для коду
- Система прогресу й досягнень
- Відображення правильних відповідей для навчання

## Ліцензія

MIT

## Тестовий обліковий запис

Після `yarn seed` у каталозі `server` (після `POST /api/mitre/sync`):

- **Email:** admin@cybertactics.test  
- **Пароль:** admin123  

Сид визначено у `server/prisma/seed.ts`. Повторне наповнення даних:

```bash
curl -X POST http://localhost:3001/api/mitre/sync
cd server && yarn seed
```

Користувач створюється з початковими значеннями: XP 0, ранг Script Kiddie, Stealth 100%. Увійдіть і проходьте місію **Operation Ghost**.
