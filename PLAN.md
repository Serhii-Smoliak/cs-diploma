# CyberTactics — план реалізації

Документ описує етапи розробки платформи. Детальна технічна документація — у [DOCUMENTATION.md](./DOCUMENTATION.md).

**Roadmap:** тиждень 1 (MVP) → 2 (UX / контент Operation Ghost) → 3 (безпека платформи) → 4 (контент) → 5 (валідація / прогрес) → 6 (Sonar + OWASP ZAP + security testing / деплой) → 7 (полірування / демо) → 8 (захист диплому).

---

## Тиждень 1 — MVP (базовий контур) ✅

**Статус:** реалізовано (з зауваженнями — див. тиждень 2).

### Виконані завдання за тиждень 1

- сформовано концепцію CyberTactics;
- визначено проблему та цільову аудиторію;
- описано практичну цінність проєкту;
- визначено основні цілі MVP;
- реалізовано базову архітектуру;
- реалізовано frontend-частину з основними сторінками;
- реалізовано backend API;
- налаштовано PostgreSQL + Prisma;
- реалізовано авторизацію через JWT;
- реалізовано місії, рівні та прогрес користувача;
- реалізовано XP, ранги та Stealth;
- реалізовано Skill Matrix;
- реалізовано MITRE ATT&CK sync;
- реалізовано базову локалізацію;
- підготовлено технічну документацію MVP;
- сформовано початкову модель загроз;
- визначено довірені та недовірені компоненти.

### Технічний статус (коротко)

| Область | Статус |
|--------|--------|
| Auth (JWT), користувач, прогрес | ✅ |
| Місія Operation Ghost (5 рівнів), seed, MITRE sync | ✅ |
| Типи завдань: `code_editor`, `tactical_choice`, `phishing_constructor` | ✅ (phishing — чернетка, див. тиждень 2) |
| XP, Stealth (базова зміна при submit) | ✅ (без відновлення / paywall) |
| Skill Matrix, i18n | ✅ |
| Leaderboard, платний тариф, AI-перевірка | ❌ не в scope MVP |

**Відомі проблеми MVP (переносимо в тиждень 2):**

- На екрані завдання (напр. 3-й рівень *Phishing Email Construction*) **немає чіткого заголовка рівня** у шапці сторінки — лише дрібний підзаголовок у Work Area.
- **Підказки та «правильна відповідь» видно одразу** у task-компонентах (hints); early reveal у Context — ✅ прибрано.
- **`POST /api/levels/:id/submit` повертає `correctAnswer`** — ✅ прибрано (§2.2.1).
- `phishing_constructor` зроблено як вільна форма листа з keyword-валідацією — **розраховано під майбутню AI-перевірку**, якої не буде.

---

## Тиждень 2 — Operation Ghost: UX, Stealth, конструктор фішингу

**Мета:** довести проходження місії (зокрема 3-й рівень) до цільової геймплей-логіки без AI; виправити навчальний UX підказок; додати Stealth-екonomy та заготовки монетизації.

**Пріоритет:** високий. Задачі можна робити паралельно, але **§2.4 (конструктор)** залежить від нової схеми `work_area` / `validation` у JSON і `AnswerValidator`.

---

### 2.1 Заголовок рівня на екрані завдання

**Проблема:** на сторінці `/missions/:missionId/assignments/:assignmentId` не видно назви рівня (напр. *Phishing Email Construction*).

**Ціль:**

- У шапці ігрового екрана (`GameLayout` / `WorkArea`) показувати **назву поточного рівня** (`level.title` + i18n ключ `levels:{level_id}.title`).
- Опційно — підзаголовок місії (`Operation Ghost` / `Операція Привид`) поруч із «← Back to assignments».

**Файли:** `client/src/components/game/GameLayout.tsx`, `WorkArea.tsx`, переклади в `seed-translations.ts` / namespace `levels`.

**Критерій готовності:** відкривши 3-й рівень, користувач одразу бачить *Phishing Email Construction* (або локалізований варіант).

**Спрощення лівої панелі (Context) — доповнення до §2.1:**

**Прибрати:** ✅ зроблено
- заголовок **«Панель контексту»**;
- блок **Handler** (`HandlerAvatar`) — **видалено** разом з API `/handlers/random/:group`;
- окремий блок **«Ваша попередня правильна відповідь»** / **«Надана відповідь»**;
- окремий зелений badge **«Завдання виконано»** у панелі;
- блок **«Правильна відповідь (для навчання)»** для незавершених рівнів (`validation`).

**Залишити без змін:**
- **MITRE badge** (T1593 тощо).

**Діалог у `DialogueLog` — цільова структура:**

```
[Система]: Місія 'Операція Привид' розпочата.
[Система]: Ціль: Apex Dynamics.
[КООРДИНАТОР]: …брифінг з level.dialogue…
[КООРДИНАТОР]: Вітаю. Ти успішно надав відповідь: {{answer}}. Завдання виконано.   ← один рядок, лише якщо completed + lastAnswer
```

**As-is (тимчасово, до доопрацювання):** статус і «Надана відповідь» ще вставляються двома рядками `[Система]` **перед** брифінгом координатора — це треба замінити на один `[КООРДИНАТОР]` **після** брифінгу.

**Якщо рівень не виконано:** опційно один рядок `[Система]: Статус: Завдання не виконано.` (без повідомлення координатора).

**Файли:** `ContextPanel.tsx`, `DialogueLog.tsx`; i18n: `handlerTaskCompleted` (`{{answer}}`), `taskStatusNotCompleted` (для незавершеного) у namespace `ui` / seed.

**Оновлення перекладів без скидання прогресу:** `npx tsx prisma/seed-translations.ts` (не повний `npm run seed` — він видаляє test user і `user_progress`).

**Критерій готовності:** ліва колонка = MITRE badge + лог діалогу; підсумок успіху — **одне** повідомлення `[КООРДИНАТОР]` після брифінгу, без окремих карток і без дублювання в `[Система]`.

---

### 2.2 Підказки, попередні відповіді та «пройти заново»

**Поточна поведінка (неправильна / частково виправлено):**

- ~~Блок «Correct answer for training» у `ContextPanel`~~ — ✅ прибрано.
- У task-компонентах (`PhishingConstructor`, `CodeEditor`, `TacticalChoice`) блок `level.hints` рендериться **завжди**.

**Цільова поведінка:**

| Ситуація | Ліва панель (Context) | Права панель (Work Area) |
|----------|----------------------|---------------------------|
| Перша спроба, без помилок | MITRE badge + діалог (system / handler), **без** окремих карток статусу/відповіді | Форма вводу / вибору, **без підказок** |
| Невірна відповідь | Показати **наступну** підказку з `hints[]` (по одній за спробу) | Форма активна |
| Рівень уже **успішно** пройдений раніше | Після брифінгу координатора — **один** рядок `[КООРДИНАТОР]` з `UserProgress.lastAnswer` («Вітаю… надав відповідь: … Завдання виконано»), не окремий блок | За замовчуванням **заблоковано** (read-only) |
| Кнопка «Пройти заново» | — | Розблоковує праву частину; скидає локальний стан спроби; підказки знову з нуля |

**Backend:**

- Зберігати в `UserProgress`: `attempts`, `lastAnswer`, `completed` (вже є).
- Додати (за потреби) **`hintsRevealed`** або обчислювати номер підказки з `attempts` на клієнті / сервері.
- API `POST /api/levels/:id/submit`: у відповіді при помилці повертати **`hint`** (наступний рядок з `hints[attempts-1]`) замість/разом із загальним message.
- Опційно: `POST /api/levels/:id/retry` — скидання `completed` для повторного проходження (або окремий прапорець `isRetryMode` без втрати історії).

**Frontend:**

- Прибрати блок «correct answer for training» для незавершених рівнів з `ContextPanel.tsx`. ✅
- Підказки рендерити лише після failed submit (з відповіді API або локального лічильника).
- Кнопка **«Пройти заново»** — у `ContextPanel` або `WorkArea`, блокує/розблоковує праву колонку через стан `retryMode` у `gameStore`.

**Критерій готовності:** новий користувач не бачить рішення до успіху; після успіху бачить свою відповідь; «заново» дає чисту спробу.

---

### 2.2.1 API submit — не повертати `correctAnswer`

**Проблема (as-is):** `POST /api/levels/:id/submit` у відповіді (навіть при `success: false`) повертає **`correctAnswer`** з `validation` — клієнт або DevTools одразу показують правильний варіант. Це суперечить §2.2 (підказки по одній, без витоку рішення).

**Приклад поточної відповіді (небажано):**
```json
{
  "success": false,
  "message": "Неправильна відповідь. Stealth -5%",
  "stealthChange": -5,
  "correctAnswer": "[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z]{2,}",
  "userAnswer": "..."
}
```

**Ціль:**

- **Не включати** `correctAnswer` у JSON відповіді submit **ні при успіху, ні при помилці**.
- При невірній відповіді повертати лише: `success`, `message`, `stealthChange`, опційно **`hint`** (наступний рядок з `hints[]`), опційно `userAnswer` (відповідь користувача для UI).
- При успіху: `success`, `message`, `xpGained`, `stealthChange`, `nextLevelId` — без еталонної відповіді.
- Оновити **`SubmitAnswerResponse`** у `@cybertactics/shared` і клієнт, якщо десь читається `correctAnswer` з submit.

**Файли:** `server/src/services/levelService.ts`, `shared/src/index.ts`, task-компоненти / `gameStore` (прибрати залежність від `correctAnswer` у response).

**Критерій готовності:** у Network на failed/success submit немає поля `correctAnswer`; навчальний фідбек — лише через `hint` або після успішного проходження з `UserProgress.lastAnswer`.

---

### 2.3 Stealth: відновлення, блокування, монетизація (заготовки)

**Поточна поведінка:** Stealth змінюється при submit (`levelService.ts`); при 0 — немає окремого UX.

**Ціль:**

1. **Вичерпаний Stealth (0%):** блокувати submit; показати модалку / панель з варіантами:
   - **Купити маскування** (разове відновлення Stealth до N%) — заготовка під оплату.
   - **Перейти на платний тариф** — заготовка (посилання / mock checkout).
   - **Зачекати** — таймер до наступної спроби (напр. 1 година) або до відновлення Stealth.

2. **Відновлення Stealth:** кожні `STEALTH_REGEN_INTERVAL_SECONDS` сек **`+STEALTH_REGEN_AMOUNT`** (пасивно і mock «зачекати»). Значення — **env**:
   ```env
   STEALTH_REGEN_INTERVAL_SECONDS=3600
   STEALTH_REGEN_AMOUNT=10
   STEALTH_MAX=100
   ```
   Зберігати `lastStealthUpdateAt` у `UserStats` (міграція Prisma).

3. **Cron / on-read:** при `GET /users/:id/stats` або login перераховувати Stealth за часом, що минув.

**Frontend:** оновити `TopBar` / `StealthBar`; модалка при `stealth === 0` і спробі submit.

**Критерій готовності:** env-кероване відновлення; при 0 Stealth — три опції (mock); після очікування / «покупки» можна знову проходити завдання.

---

### 2.4 Рівень 3 — конструктор фішинг-листа (Duolingo-style)

**Проблема:** `ghost_initial_03` (*Phishing Email Construction*) — вільні поля To/Subject/Body + keywords; це було під **AI-оцінку**, яка **не буде** в проєкті.

**Ціль:** замінити на **конструктор речень / фраз** (як Duolingo):

- Для кожного поля листа (**subject**, **body** — мінімум; опційно **opening**, **call-to-action**) — **банк слів/фраз**: правильні фрагменти + distractors.
- Користувач **збирає** лист кліком по токенах (drag або tap-to-add у слот).
- **Валідація:** лише **одна (або кілька) этalonних комбінацій** проходить рівень; частково правильна комбінація може давати **частковий XP** (опційно, налаштовується в JSON).
- **Вкладення:** лишити вибір з фіксованого списку (без .exe) — окремий крок або частина конструктора.

**Новий тип завдання (рекомендація):** `sentence_constructor` **або** розширити `phishing_constructor` новою схемою `work_area`:

```json
{
  "task_type": "sentence_constructor",
  "work_area": {
    "fields": [
      {
        "id": "subject",
        "label": "Subject",
        "slots": 4,
        "tokens": [
          { "id": "t1", "text": "Urgent", "correct": true, "slot": 0 },
          { "id": "t2", "text": "Q3 report", "correct": true, "slot": 1 }
        ]
      }
    ],
    "attachments": [ "..."]
  },
  "validation": {
    "type": "sentence_combination",
    "correct_sequences": {
      "subject": ["token_id_1", "token_id_2", "..."],
      "body": ["..."]
    },
    "partial_xp_rules": []
  }
}
```

**Backend:** `AnswerValidator` — новий тип `sentence_combination`; збереження `lastAnswer` як JSON обраних token id.

**Frontend:** новий компонент `SentenceConstructor.tsx` (або переписати `PhishingConstructor.tsx`).

**Контент:** оновити `server/src/data/missions/operation_ghost.json` для `ghost_initial_03`; перезапустити seed після MITRE sync.

**Критерій готовності:** рівень 3 проходиться без AI, лише через правильну комбінацію токенів; UX схожий на word-bank конструктор.

---

### 2.6 Delta threat model

Після реалізації §2.2–2.4 — зафіксувати в **DOCUMENTATION.md** оновлення моделі загроз (delta до базової з тижня 1):

| Зміна функціоналу | Threat / control |
|-------------------|------------------|
| §2.2 — прибрано early reveal відповіді, підказки по одній | **Control:** зменшення витоку навчальних даних до проходження рівня |
| §2.2.1 — прибрано `correctAnswer` з відповіді submit | **Control:** API не розкриває еталон з `validation` (лише `hint` / progress) |
| §2.4 — sentence constructor замість вільного фішинг-тексту | **Control:** обмеження offensive-контенту (фіксований банк токенів, без AI) |
| §2.3 — Stealth, regen з env, блок при 0 | **Threat/control:** зловживання regen / обход cooldown; **control:** env-ліміти, mock paywall |

**Критерій готовності:** у DOCUMENTATION.md є розділ «Threat model (delta, тиждень 2)» з threats, controls і змінами ризикового профілю після §2.2–2.4.

---

### 2.5 Загальні задачі тижня 2 (чеклист)

- [x] **2.1** Заголовок рівня на game screen
- [x] **2.1** Спрощення Context: прибрати «Панель контексту», Handler, окремі блоки, «Правильна відповідь (для навчання)»
- [x] **2.1** Підсумок успіху — один рядок `[КООРДИНАТОР]` після брифінгу
- [x] **2.2** Підказки приховані (`TaskHints`); «Пройти заново» у Work Area
- [x] **2.2** Прибрати early reveal correct answer з `ContextPanel`
- [x] **2.2.1** Прибрати `correctAnswer` з відповіді `POST /api/levels/:id/submit`
- [x] **2.2** Уніфікувати логіку для всіх `task_type` (code, choice, phishing)
- [x] **2.3** Env для Stealth regen + міграція `lastStealthUpdateAt`
- [x] **2.3** UX при Stealth = 0 (маскування / тариф / очікування)
- [x] **2.4** Схема JSON + validator для sentence constructor
- [x] **2.4** UI конструктора + контент `ghost_initial_03`
- [x] **2.4** Оновити DOCUMENTATION.md (структура JSON, тип завдання)
- [x] **2.6** Delta threat model у DOCUMENTATION.md (витік відповідей, межі offensive-контенту, Stealth/regen)
- [ ] Регресія: пройти Operation Ghost 1→5 після змін

---

### Орієнтовний порядок виконання (тиждень 2)

1. **2.1** — швидкий UX fix заголовка + Context panel ✅; далі — один рядок `[КООРДИНАТОР]` для підсумку успіху
2. **2.2** + **2.2.1** — підказки / retry; прибрати `correctAnswer` з API submit  
3. **2.4** — новий конструктор (найбільший обсяг)  
4. **2.3** — Stealth economy + env  
5. **2.6** — delta threat model у DOCUMENTATION.md (після §2.2–2.4)

---

## Тиждень 3 — Безпека платформи

**Фокус:** безпека платформи.

### План

- [x] Додати **ролі користувачів** (напр. `user`, `admin`) — схема БД, middleware (`requireAdmin` читає роль з БД; JWT claims — backlog).
- [x] Реалізувати **admin-захист** для критичних endpointʼів.
- [x] Захистити:
  - [x] `POST /api/mitre/sync`;
  - [x] translations API (`POST` / `bulk`; PUT/DELETE немає в API);
  - [ ] потенційні admin-операції (seed-тригери, bulk-оновлення контенту тощо) — **немає HTTP-маршрутів**, окрім translations bulk.
- [x] Перевірити доступ до **progress / stats** лише для **власного** користувача; заборонити підміну `:id` у URL (`resolveOwnerUserId`, `/users/me/*`).
- [x] Оновити **threat model** після змін (розділ у DOCUMENTATION.md §Threat model).

**Критерій готовності:** неавторизований / звичайний user не може викликати admin API; користувач A не читає прогрес користувача B.

---

## Тиждень 4 — Розширення навчального контенту

**Фокус:** розширення навчального контенту + **рефакторинг REST API місій**.

### 4.1 REST API: CRUD місій (замість «slug у URL»)

**Проблема (as-is):** у URL використовується рядок на кшталт `operation_ghost` — це зараз поле `Mission.id`, але виглядає як **назва / slug місії**, а не як стабільний ідентифікатор ресурсу. Є лише `GET /api/missions` і `GET /api/missions/:id/levels`; повноцінного CRUD немає.

**Приклад поточного виклику (треба змінити підхід):**
```
GET /api/missions/operation_ghost/levels   ← не опиратися на «назву» місії в маршруті
```

**Цільовий підхід:**

1. **Розділити ідентифікатор і назву:**
   - `id` — первинний ключ ресурсу (рекомендація: UUID або окремий стабільний id);
   - `name` / `slug` — людиночитна назва (*Operation Ghost*), **не** частина URL для доступу до даних (або лише опційний slug для SEO, не для API).

2. **CRUD місій** (читання — для всіх авторизованих / публічно; створення/редагування — admin, тиждень 3):

   | Метод | Шлях | Опис |
   |-------|------|------|
   | `GET` | `/api/missions` | Список місій |
   | `GET` | `/api/missions/:id` | Одна місія за **`id`** |
   | `POST` | `/api/missions` | Створити місію (admin) |
   | `PUT` | `/api/missions/:id` | Оновити місію (admin) |
   | `DELETE` | `/api/missions/:id` | Видалити місію (admin) |
   | `GET` | `/api/missions/:id/levels` | Рівні місії за **`id`**, не за назвою |

3. **Рівні** — вкладений ресурс або окремий CRUD (за потреби):
   - `GET /api/missions/:missionId/levels`
   - `GET /api/levels/:levelId` (опційно)
   - admin: `POST/PUT/DELETE` для рівнів

4. **Backend:** `server/src/routes/missions.ts`, Prisma-модель `Mission` (міграція id/slug), `seed` + JSON (`mission_id` → внутрішній id).

5. **Frontend:** маршрути `/missions/:missionId/...` і `api.getMissionLevels(missionId)` — передавати **`mission.id`** з відповіді `GET /api/missions`, не hardcode `operation_ghost` і не плутати з `name`.

6. **Документація:** оновити DOCUMENTATION.md, приклади curl, таблицю endpoints.

**Критерій готовності:** клієнт отримує список місій, бере `id` з JSON і запитує рівні через `/api/missions/{uuid}/levels`; admin може створити/редагувати місію через REST; у URL немає людиночитного slug замість id.

---

### 4.2 Контент і навчальна подача — план

- [ ] **4.1** Рефакторинг REST API місій (CRUD, `id` замість slug/назви в URL).
- [ ] **4.3** Лінк на pill тактики («Розvідka») з `MitreTechniqueBadge` → окрема сторінка kill chain / тактики.
- [ ] Додати або **покращити завдання** в першій місії (Operation Ghost).
- [ ] Додати **рівні складності** (мітки / фільтри beginner → advanced).
- [ ] Покращити **пояснення атак** у діалогах і контексті:
  - [ ] контекст (навіщо цей крок у kill chain);
  - [ ] дія (що робить атакуючий);
  - [ ] результат (що отримуємо після успіху);
  - [ ] захист / виявлення (як це помітити або зупинити).
- [ ] Додати більше **defensive-пояснень**, щоб offensive-контент був **етично обмежений** (навчальна рамка, не інструкція для зловживань).
- [ ] Перевірити, чи місія проходиться **логічно від простого до складного** (рекон → resource → initial access → execution → persistence).

**Критерій готовності:** Operation Ghost читається як цілісний навчальний сценарій з defensive блоками в кожному рівні; API місій відповідає CRUD-конвенції з §4.1.

---

### 4.3 Сторінка тактики MITRE (лінк «Розвідка» з Context panel)

**Проблема (as-is):** у `ContextPanel` біля MITRE badge тег тактики (**«Розвідка»**, `Reconnaissance` тощо) — статичний `<span>` без навігації. Користувач не розуміє, **навіщо** цей етап у kill chain і що означає тип завдання на цьому рівні.

**As-is:** `MitreTechniqueBadge.tsx` — `T1593 →` веде зовні на attack.mitre.org; pill тактики не клікабельний.

**Ціль:**

1. **Лінк з блоку «Поточна техніка MITRE»** — pill тактики (`Розvідка`, `Initial Access` …) робити **внутрішнім** посиланням (підкреслення / hover як у заголовках місій), не зовнішнім MITRE URL.
2. **Окрема сторінка** (напр. `/mitre/tactics/:tacticSlug` або `/learn/kill-chain/:stageId`):
   - назва етапу Cyber Kill Chain (локалізовано);
   - коротко: **навіщо** цей етап, **що робить** атакуючий, **результат** для сценарію;
   - **defensive** блок: як виявити / зупинити (навчальна рамка);
   - опційно — список технік цієї тактики з Operation Ghost / Skill Matrix.
3. **Контент:** перевикористати i18n з namespace `mitre` (`killChain.stage.*`, `killChain.fullDescription.*`, `killChain.goal.*`, `killChain.result.*`) — частина вже є в `MitreTechniqueModal.tsx`; уникати дублювання текстів.
4. **Маршрут і навігація:** React Router; з game screen — відкрити в тій самій вкладці або новій (за замовчуванням — та сама вкладка, «Назад» повертає на рівень).
5. **Slug:** нормалізувати `technique.tactic` → `reconnaissance` (як `normalizeTactic` у `MitreTechniqueModal`).

**Файли:** `MitreTechniqueBadge.tsx`, нова `TacticInfoPage.tsx` (або `KillChainStagePage.tsx`), `App.tsx` / routes, `seed-translations.ts` (за потреби доповнити `mitre`).

**Критерій готовності:** на екрані завдання клік по **«Розvідka»** відкриває сторінку з зрозумілим поясненням етапу; T1593 як і раніше веде на MITRE; тексти українською / англійською через i18n.

---

## Тиждень 5 — Валідація відповідей, прогрес, Skill Matrix

**Фокус:** валідація відповідей, прогрес, Skill Matrix.

### План

- [ ] **Покращити перевірку відповідей** (`AnswerValidator`, edge cases, нові типи з тижня 2).
- [ ] Виправити / доопрацювати **`completedLevels`** у `UserStats` (інкремент при першому успіху).
- [ ] Перевірити коректність **XP, Stealth, рангу** (формули, cap, повторні спроби).
- [ ] Покращити **Skill Matrix**:
  - [ ] освоєні техніки (завершені рівні / `UserMitreTechnique`);
  - [ ] неосвоєні техніки;
  - [ ] прогрес **по тактиках** (агрегація по MITRE tactic).
- [ ] Перевірити **повторне проходження** рівнів **без повторного нарахування XP** (retry mode з тижня 2).

**Критерій готовності:** статистика користувача збігається з фактичним прогресом; Skill Matrix відображає реальний стан.

---

## Тиждень 6 — Перевірка безпеки (Sonar, OWASP ZAP), стабілізація MVP, деплой

**Фокус:** довести, що додаток **перевірений інструментами** (SAST + DAST), закрити критичні findings; стабілізувати MVP; підготувати деплой і артефакти для диплому.

**Мета для захисту:** мати **звіти** (SonarCloud dashboard, OWASP ZAP HTML/JSON), короткий **Security verification summary** у DOCUMENTATION.md і відповіді на питання «як ви перевірили безпеку».

---

### 6.1 Статичний аналіз — SonarQube / SonarCloud

**Навіщо:** автоматичний пошук вразливостей, code smells, дублікатів, проблем безпеки у **TypeScript** (client + server) до деплою.

**План:**

- [ ] Підключити репозиторій до **SonarCloud** (безкоштовно для public repo) або локальний **SonarQube**.
- [ ] Додати `sonar-project.properties` у корінь (monorepo):
  ```properties
  sonar.projectKey=cybertactics
  sonar.organization=<org>
  sonar.sources=client/src,server/src,shared/src
  sonar.exclusions=**/node_modules/**,**/dist/**,**/*.test.ts
  sonar.javascript.lcov.reportPaths=client/coverage/lcov.info,server/coverage/lcov.info
  sonar.sourceEncoding=UTF-8
  ```
- [ ] Запуск локально (приклад):
  ```bash
  npx sonarqube-scanner
  ```
  або через **GitHub Actions** / GitLab CI на кожен push / PR.
- [ ] Увімкнути **Quality Gate**: 0 нових **Blocker/Critical** vulnerabilities; 0 нових **High** security hotspots без review.
- [ ] Виправити або **задокументувати accepted risk** для findings, які не виправляються до захисту (з обґрунтуванням).
- [ ] Зберегти **скриншот** Sonar dashboard (Security, Reliability, Coverage) для звіту / презентації.

**Що перевіряє Sonar у контексті CyberTactics:**

- hardcoded secrets, слабкі crypto-патерни;
- XSS / injection у шаблонах (де застосовно);
- некоректна обробка помилок, dead code;
- дублікати в `AnswerValidator`, `levelService`, auth middleware.

**Критерій готовності:** проєкт проходить Quality Gate (або є таблиця «finding → статус»); скриншот у матеріалах диплому.

---

### 6.2 Динамічне тестування — OWASP ZAP

**Навіщо:** перевірка **запущеного** застосунку (DAST) — заголовки, cookies, JWT, типові OWASP Top 10 (injection, broken auth, misconfiguration).

**Передумова:** backend + frontend працюють (dev або staging), є тестовий користувач після seed.

**План:**

- [ ] Встановити **OWASP ZAP** (Desktop або Docker `ghcr.io/zaproxy/zaproxy:stable`).
- [ ] **Baseline scan** (швидкий passive scan):
  ```bash
  docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
    -t http://localhost:5173 \
    -r zap-baseline-report.html
  ```
  (URL фронтенду; API — окремо, див. нижче.)
- [ ] **API scan** проти backend (`http://localhost:3001`):
  - список endpoints з DOCUMENTATION.md;
  - імпортувати OpenAPI, якщо є, або **Manual Explore** + контекст із JWT.
- [ ] **Authenticated scan** (рекомендовано):
  1. `POST /api/auth/login` → отримати JWT;
  2. у ZAP Context додати заголовок `Authorization: Bearer <token>`;
  3. spider по `/api/missions`, `/api/levels/:id/submit`, `/api/users/me/stats`;
  4. active scan з обмеженою інтенсивністю (не навантажувати staging).
- [ ] Перевірити окремо:
  - [ ] submit з malformed JSON / oversized body;
  - [ ] доступ до чужого progress без token / з чужим token;
  - [ ] admin routes (`POST /api/mitre/sync`, translations) без ролі admin (після тижня 3);
  - [ ] CORS, `Content-Security-Policy`, `X-Frame-Options` (nginx / Helmet на server).
- [ ] Зберегти **ZAP HTML report** + короткий summary: High/Medium/Low/Informational.
- [ ] Виправити **High** та релевантні **Medium**; решту — у «accepted / false positive» з поясненням.

**Критерій готовності:** є звіт ZAP по staging; немає незакритих High без обґрунтування; у DOCUMENTATION.md — посилання на звіт і дата сканування.

---

### 6.3 Залежності та supply chain

- [ ] `npm audit` у `client`, `server`, `shared` — виправити **critical/high** або задокументувати.
- [ ] Опційно: **Dependabot** / **Snyk** у CI для автоматичних PR на оновлення залежностей.
- [ ] Переконатися, що `.env`, `JWT_SECRET`, паролі БД **не** потрапляють у git (перевірка Sonar secrets + `.gitignore`).

---

### 6.4 Ручне security testing (чеклист)

- [ ] auth (JWT, термін дії, invalid token, logout / expired);
- [ ] access control (ролі, власний progress/stats);
- [ ] protected routes (frontend + API);
- [ ] admin routes;
- [ ] input validation (submit, register, translations);
- [ ] rate limiting на login / register (якщо додано на тижні 3).

**Типові ризики:**

- [ ] unauthorized access;
- [ ] privilege escalation;
- [ ] tampering з прогресом (підміна `userId`, `levelId`, повторний XP);
- [ ] некоректні submit-запити (malformed JSON, ReDoS у regex validator тощо).

---

### 6.5 Артефакти для диплому (Security verification summary)

Додати розділ у **DOCUMENTATION.md** «Перевірка безпеки» з таблицею:

| Інструмент | Тип | Область | Дата | Результат |
|------------|-----|---------|------|-----------|
| SonarCloud | SAST | client, server, shared | YYYY-MM-DD | Quality Gate passed / N issues fixed |
| OWASP ZAP | DAST | staging URL + API | YYYY-MM-DD | 0 High open / report attached |
| npm audit | SCA | dependencies | YYYY-MM-DD | 0 critical |

- [ ] Скриншоти Sonar (Security tab, Quality Gate).
- [ ] ZAP HTML report у `docs/security/` (або посилання на CI artifact).
- [ ] 1–2 абзаци в тексті диплому: **як інструменти доповнюють threat model** (тиждень 3) і manual testing.

**Критерій готовності:** на захисті можна показати Sonar + ZAP і сказати «ми не лише описали загрози, а й прогнали код і живий застосунок через industry-standard інструменти».

---

### 6.6 Стабілізація та документація

- [ ] Стабілізувати MVP (регресія Operation Ghost, auth flow).
- [ ] Оновити **API-документацію** (DOCUMENTATION.md, приклади запитів/відповідей).
- [ ] Оновити **архітектурну документацію** (діаграми, threat model, env).

---

### 6.7 Підготовка деплою

- [ ] backend (build, `npm start` / PM2);
- [ ] frontend (static build, nginx / CDN);
- [ ] PostgreSQL (managed або VPS);
- [ ] env (production secrets, без commit `.env`);
- [ ] міграції (`prisma migrate deploy`);
- [ ] seed + MITRE sync (порядок: sync → seed);
- [ ] **Повторний ZAP scan** уже на **staging/production URL** перед захистом.

**Критерій готовності:** чеклист деплою виконується на staging; критичні security findings закриті або задокументовані як accepted risk; Sonar + ZAP звіти актуальні (не старші за 2–4 тижні до захисту).

---

### Орієнтовний порядок (тиждень 6)

1. **6.3** — npm audit, secrets  
2. **6.1** — SonarCloud, Quality Gate, fix Critical/High  
3. **6.4** — manual checklist (паралельно з тижнем 3, якщо ролі ще не готові — зафіксувати findings)  
4. **6.2** — OWASP ZAP на local/staging  
5. **6.7** — деплой staging  
6. **6.2** — повторний ZAP на staging  
7. **6.5** — артефакти в DOCUMENTATION.md + `docs/security/`

---

## Тиждень 7 — Полірування, фінальний деплой, звіт

**Фокус:** полірування, фінальний деплой, фінальний звіт.

### План

- [ ] Відполірувати **UI/UX** (консистентність, mobile, стани loading/error).
- [ ] Виправити **дрібні баги** з backlog.
- [ ] Завершити **тексти та пояснення** в UI (i18n uk/en).
- [ ] Підготувати **фінальні скриншоти** для звіту.
- [ ] Розгорнути **демо-версію** (production/staging URL).
- [ ] Перевірити **повний demo flow**: реєстрація → місія → 5 рівнів → Skill Matrix → stealth/regen.
- [ ] **Фіналізувати звіт** (дипломна робота).
- [ ] Підготувати матеріали для **презентації** (структура слайдів, ключові метрики).

**Критерій готовності:** demo URL доступний; звіт і скриншоти відповідають фактичному стану продукту.

---

## Тиждень 8 — Захист диплому

**Фокус:** захист.

### План

- [ ] Підготувати **презентацію**.
- [ ] Підготувати **коротке демо** (5–10 хв, сценарій без збоїв).
- [ ] Перевірити **деплой перед захистом** (health check, БД, sync, seed).
- [ ] Підготувати відповіді на можливі питання:
  - [ ] чому **MITRE ATT&CK** як основа контенту;
  - [ ] чим відрізняється від **Hack The Box / TryHackMe**;
  - [ ] де **cybersecurity-складова** (захист, threat model, ethical framing);
  - [ ] яка **модель загроз**;
  - [ ] які **ризики враховано** (тиждень 3, 6 — Sonar, OWASP ZAP);
  - [ ] які **обмеження MVP** (без real pentest lab, без AI, mock monetization).
- [ ] Фінальна підготовка до захисту (репетиція, backup offline demo).

**Критерій готовності:** презентація + demo + Q&A готові; staging prod працює в день захисту.

---

## Backlog (поза основним roadmap)

- Leaderboard (сторінка зараз — заглушка)
- Реальна оплата (Stripe) — mock залишається в MVP
- AI-перевірка текстів — **не планується** (замінено sentence constructor, тиждень 2)
- AST-валідатор для PowerShell (зараз substring)
- Друга місія / додаткові campaign

---

## Посилання на код (as-is)

| Тема | Файл |
|------|------|
| Early reveal відповіді | ✅ прибрано з `ContextPanel.tsx` |
| Підсумок успіху | ✅ один `[КООРДИНАТОР]` після брифінгу (`ContextPanel.tsx`) |
| Pill тактики «Розvідka» (as-is) | `MitreTechniqueBadge.tsx` — статичний `<span>`, без внутр. сторінки (§4.3) |
| Завжди видимі hints | `client/src/components/tasks/PhishingConstructor.tsx` (~253–262), аналогічно в інших tasks |
| Stealth при submit | `server/src/services/levelService.ts` |
| Контент рівня 3 | `server/src/data/missions/operation_ghost.json` → `ghost_initial_03` |
| Missions REST (as-is) | `server/src/routes/missions.ts` — лише GET list + GET `/:id/levels` |
| Клієнт: рівні місії | `client/src/services/api.ts` → `GET /missions/${missionId}/levels` |
| Заголовок work area | `client/src/components/game/WorkArea.tsx` |
