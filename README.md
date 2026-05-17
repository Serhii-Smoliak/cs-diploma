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
- npm 10+
- Docker / Docker Compose (для PostgreSQL з `server/docker-compose.yml`)

### Залежності (пакети без кореневого `package.json`)

Спочатку зберіть **shared**, потім встановіть залежності в **server** і **client**:

```bash
# Shared (зібрати першим)
cd shared
npm install
npm run build
cd ..

# Сервер
cd server
npm install
cd ..

# Клієнт
cd client
npm install
cd ..
```

### Ініціалізація бази даних

1. Запустіть PostgreSQL через Docker:

```bash
cd server
docker-compose up -d
```

2. Застосуйте міграції:

```bash
cd server
npm run db:migrate
```

3. Заповніть БД тестовими даними:

```bash
cd server
npm run seed
```

### Розробка

У **двох терміналах** (кореневого `npm run dev` для всього репозиторію немає):

```bash
# Backend (порт 3001)
cd server
npm run dev
```

```bash
# Frontend (порт 5173, проксі /api на backend)
cd client
npm run dev
```

### Збірка

```bash
cd shared && npm run build && cd ..
cd server && npm run build && cd ..
cd client && npm run build && cd ..
```

## Використання

1. Запустіть backend і frontend (див. вище).
2. Відкрийте в браузері `http://localhost:5173`.
3. Зареєструйте обліковий запис або увійдіть.
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

## API (коротко)

- `POST /api/auth/register` — реєстрація
- `POST /api/auth/login` — вхід
- `GET /api/missions` — список місій
- `GET /api/missions/:id/levels` — рівні місії
- `POST /api/levels/:id/submit` — відправка відповіді
- `GET /api/users/:id/progress` — прогрес (потрібен JWT)
- `GET /api/users/:id/stats` — статистика (потрібен JWT)

Повний перелік — у [DOCUMENTATION.md](./DOCUMENTATION.md).

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

Після `npm run seed` у каталозі `server`:

- **Email:** admin@cybertactics.test  
- **Пароль:** admin123  

Сид визначено у `server/prisma/seed.ts`. Повторне наповнення даних:

```bash
cd server && npm run seed
```

Користувач створюється з початковими значеннями: XP 0, ранг Script Kiddie, Stealth 100%. Увійдіть і проходьте місію **Operation Ghost**.
