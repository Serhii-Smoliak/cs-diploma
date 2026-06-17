## Security requirements

### 1. Автентифікація

Платформа повинна підтримувати реєстрацію та вхід користувачів через email/username і пароль.

Паролі користувачів не повинні зберігатися у відкритому вигляді. Для зберігання паролів використовується хешування через `bcrypt`.

Після успішного входу сервер видає JWT-токен, який використовується для доступу до захищених API endpointʼів.

JWT повинен містити лише мінімально необхідні дані користувача, наприклад `userId` та `email`.

Роль користувача не повинна вважатися довіреною, якщо вона передається з клієнта або з JWT. Для критичних операцій роль перевіряється на сервері через базу даних.

Для endpointʼів входу та реєстрації повинен бути застосований rate limit, щоб зменшити ризик brute force атак.

---

### 2. Авторизація

Усі дії, які змінюють персональні дані користувача, прогрес, XP, Stealth або адміністративні ресурси, повинні вимагати валідний JWT.

Сервер повинен перевіряти права доступу на кожному захищеному endpointʼі незалежно від стану frontend-застосунку.

Клієнтська перевірка прав доступу використовується лише для UX і не є механізмом безпеки.

---

### 3. Ролі користувачів

У системі передбачені ролі:

| Роль    | Права                                                                            |
|---------|----------------------------------------------------------------------------------|
| `USER`  | Проходження місій, перегляд власного профілю, прогресу, статистики, Skill Matrix |
| `ADMIN` | Усі права USER, а також синхронізація MITRE ATT&CK і керування перекладами       |

За замовчуванням новий користувач отримує роль `USER`.

Роль `ADMIN` не повинна видаватися через публічний API реєстрації.

---

### 4. Захист admin endpointʼів

Адміністративні endpointʼи повинні бути доступні лише користувачам з роллю `ADMIN`.

До admin endpointʼів належать:

* `POST /api/mitre/sync`
* `POST /api/translations`
* `POST /api/translations/bulk`

Для таких endpointʼів обов’язкові дві перевірки:

1. користувач має валідний JWT;
2. роль користувача в базі даних дорівнює `ADMIN`.

Якщо JWT відсутній або невалідний — сервер повертає `401`.

Якщо користувач авторизований, але не має ролі `ADMIN` — сервер повертає `403`.

---

### 5. Ownership check

Користувач повинен мати доступ лише до власного прогресу, статистики, XP та Stealth.

Рекомендовані endpointʼи:

* `GET /api/users/me`
* `GET /api/users/me/progress`
* `GET /api/users/me/stats`

Legacy endpointʼи з параметром `:id` повинні перевіряти, що `id` з URL збігається з `userId` із JWT.

Якщо користувач намагається отримати прогрес або статистику іншого користувача, сервер повинен повернути `403`.

Це захищає систему від IDOR-вразливостей.

---

### 6. Захист навчального контенту

Навчальний контент, місії, рівні, підказки та MITRE-дані можуть бути доступні для читання відповідно до логіки застосунку.

Однак сервер не повинен повертати еталонні відповіді до завдань до моменту, коли це дозволено бізнес-логікою.

Endpoint `POST /api/levels/:id/submit` не повинен повертати `correctAnswer`.

Валідаційні правила рівня повинні залишатися на сервері.

Frontend не повинен містити повну логіку перевірки правильності відповіді, якщо це дозволяє користувачу обійти навчальний сценарій.

Для завдань типу phishing або sentence constructor потрібно обмежувати користувацький input, щоб зменшити ризик створення небезпечного або неетичного контенту.

---

### 7. Захист progress / XP / Stealth

XP, ранг, Stealth і прогрес користувача повинні змінюватися лише на сервері.

Клієнт не повинен напряму передавати нові значення XP, rank або Stealth.

Після submit відповіді сервер сам:

* перевіряє правильність відповіді;
* оновлює `UserProgress`;
* нараховує XP лише за перше успішне проходження;
* змінює Stealth;
* оновлює освоєні MITRE techniques.

Повторне проходження вже виконаного рівня не повинно повторно нараховувати XP.

Якщо Stealth дорівнює 0 або менше, сервер повинен блокувати submit і повертати ознаку `stealthDepleted`.

Відновлення Stealth через mock-дії повинно перевіряти cooldown на сервері, а не лише на клієнті.

---

### 8. Безпечна робота з MITRE sync

MITRE sync є адміністративною операцією, оскільки вона змінює довідник технік у базі даних.

Endpoint `POST /api/mitre/sync` повинен бути захищений через JWT + ADMIN.

Звичайний користувач не повинен мати можливості запускати синхронізацію.

Під час синхронізації потрібно:

* отримувати дані лише з очікуваного джерела MITRE CTI;
* фільтрувати потрібні STIX-об’єкти;
* виконувати upsert у БД;
* не дозволяти користувачу передавати довільний URL для sync;
* обробляти помилки без розкриття внутрішніх stack trace.

Це зменшує ризики data poisoning, SSRF та DoS через важку операцію синхронізації.

---

### 9. Безпечна робота з translations API

Публічні GET endpointʼи перекладів можуть бути доступні без авторизації, оскільки вони потрібні для i18n.

Write-операції з перекладами повинні бути доступні лише адміністратору:

* `POST /api/translations`
* `POST /api/translations/bulk`

Для translations API обов’язкові такі вимоги:

* whitelist для `locale`;
* whitelist для `namespace`;
* валідація формату `key`;
* заборона `..`, `/`, `\` у ключах;
* обмеження bulk-операцій, наприклад до 500 записів;
* валідація `value`;
* заборона path-like значень у query параметрах.

Це зменшує ризики path traversal, data poisoning і масового засмічення БД.

---

### 10. Загальні вимоги до API-безпеки

Backend повинен використовувати security headers через Helmet.

Сервер не повинен розкривати `X-Powered-By`.

Помилки API повинні бути узагальненими. У production не можна повертати stack trace або внутрішні повідомлення помилок.

Для невідомих маршрутів API повинен повертати контрольовану 404-відповідь.

Для критичних дій потрібно використовувати перевірку input через валідатори.

---

### 11. Мінімальний чеклист перевірки

| Перевірка                             | Очікуваний результат            |
|---------------------------------------|---------------------------------|
| Без JWT → `POST /api/mitre/sync`      | `401`                           |
| USER → `POST /api/mitre/sync`         | `403`                           |
| ADMIN → `POST /api/mitre/sync`        | `200` або успішний sync         |
| Без JWT → `POST /api/translations`    | `401`                           |
| USER → `POST /api/translations`       | `403`                           |
| ADMIN з ключем `../../etc/passwd`     | `400`                           |
| USER A → `/api/users/{id_B}/progress` | `403`                           |
| Submit при Stealth = 0                | submit заблокований             |
| Повторне проходження рівня            | XP повторно не нараховується    |
| Submit відповіді                      | `correctAnswer` не повертається |

## Security acceptance criteria для нових фіч

### 1. Endpoint не доступний без JWT

**Критерій:** якщо endpoint працює з персональними даними, прогресом, XP, Stealth або адміністративними діями, він повинен вимагати JWT.

| Умова                                     | Очікуваний результат                          |
|-------------------------------------------|-----------------------------------------------|
| Запит без `Authorization: Bearer <token>` | `401 Unauthorized`                            |
| Запит з невалідним JWT                    | `401 Unauthorized`                            |
| Запит з валідним JWT                      | Endpoint переходить до перевірки прав доступу |

---

### 2. Admin endpoint доступний тільки admin

**Критерій:** endpointʼи адміністративних операцій доступні лише користувачу з роллю `ADMIN`.

| Endpoint                      | USER            | ADMIN            |
|-------------------------------|-----------------|------------------|
| `POST /api/mitre/sync`        | `403 Forbidden` | Доступ дозволено |
| `POST /api/translations`      | `403 Forbidden` | Доступ дозволено |
| `POST /api/translations/bulk` | `403 Forbidden` | Доступ дозволено |

Роль повинна перевірятися на сервері через базу даних, а не через дані з клієнта.

---

### 3. User не може читати чужий progress

**Критерій:** користувач має доступ лише до власного прогресу та статистики.

| Умова                                         | Очікуваний результат |
|-----------------------------------------------|----------------------|
| USER A відкриває `/api/users/me/progress`     | `200 OK`             |
| USER A відкриває `/api/users/me/stats`        | `200 OK`             |
| USER A відкриває `/api/users/{id_B}/progress` | `403 Forbidden`      |
| USER A відкриває `/api/users/{id_B}/stats`    | `403 Forbidden`      |

---

### 4. User не може напряму змінити XP / Stealth

**Критерій:** XP, rank, Stealth і progress змінюються лише через серверну бізнес-логіку.

| Сценарій                                            | Очікуваний результат                             |
|-----------------------------------------------------|--------------------------------------------------|
| Користувач передає `xp` у body submit-запиту        | Значення ігнорується                             |
| Користувач передає `stealth` у body submit-запиту   | Значення ігнорується                             |
| Користувач повторно проходить вже завершений рівень | XP повторно не нараховується                     |
| Stealth = 0                                         | Submit блокується                                |
| Невірна відповідь                                   | Stealth зменшується сервером                     |
| Правильна відповідь                                 | XP/Stealth оновлюються сервером згідно з rewards |

---

### 5. Input проходить серверну валідацію

**Критерій:** усі вхідні дані, які впливають на БД або бізнес-логіку, проходять серверну валідацію.

| Компонент         | Валідація                                         |
|-------------------|---------------------------------------------------|
| Auth              | email, username, password                         |
| Submit answer     | тип відповіді, структура body, levelId            |
| Translations      | `locale`, `namespace`, `key`, `value`             |
| Bulk translations | ліміт кількості записів, структура кожного запису |
| User avatar       | формат data URL / допустимий тип                  |
| MITRE sync        | користувач не може передати довільний URL         |

Некоректний input повинен повертати `400 Bad Request`.

---

### 6. Response не повертає службову інформацію

**Критерій:** API не повинен повертати дані, які допомагають обійти логіку застосунку або розкрити внутрішню реалізацію.

| Endpoint / сценарій           | Не повинно повертатися                                           |
|-------------------------------|------------------------------------------------------------------|
| `POST /api/levels/:id/submit` | `correctAnswer`, повний `validation`, службові правила перевірки |
| Auth errors                   | інформація, чи існує конкретний email                            |
| Server errors                 | stack trace, Prisma error, SQL, шлях до файлів                   |
| Admin errors                  | внутрішні назви сервісів, секрети, env                           |

---

### 7. Помилки не розкривають внутрішню реалізацію

**Критерій:** у production API повертає узагальнені повідомлення про помилки.

| Тип помилки               | Очікувана відповідь                         |
|---------------------------|---------------------------------------------|
| Невалідний JWT            | `401 Unauthorized`                          |
| Немає прав                | `403 Forbidden`                             |
| Некоректний input         | `400 Bad Request`                           |
| Ресурс не знайдено        | `404 Not Found`                             |
| Внутрішня помилка сервера | `500 Internal Server Error` без stack trace |

Повідомлення помилок не повинні містити:

* stack trace;
* SQL-запити;
* Prisma error details;
* абсолютні шляхи до файлів;
* значення секретів або env;
* внутрішню структуру сервісів.

---

## Definition of Done для security acceptance criteria

Нова фіча вважається прийнятою з погляду безпеки, якщо:

1. захищені endpointʼи не працюють без JWT;
2. admin endpointʼи недоступні для `USER`;
3. користувач не може отримати чужий progress/stats;
4. XP, Stealth і progress не змінюються напряму з клієнта;
5. весь input проходить серверну валідацію;
6. response не повертає службову інформацію;
7. помилки не розкривають внутрішню реалізацію;
8. негативні сценарії перевірені вручну або через automated tests.


Ось готовий блок.

## Архітектура через принципи Security by Design

Архітектура побудована як клієнт-серверна система: frontend відповідає за інтерфейс, backend — за бізнес-логіку, перевірку доступу, валідацію відповідей, оновлення прогресу, XP, Stealth та роботу з PostgreSQL. Такий підхід дозволяє застосувати принципи Security by Design і не покладатися на довіру до клієнтської частини. 

### 1. Least privilege

Кожен користувач має лише мінімально необхідні права.

Звичайний користувач `USER` може:

* проходити місії;
* переглядати власний профіль;
* переглядати власний progress/stats;
* працювати з Skill Matrix.

Адміністративні дії доступні лише ролі `ADMIN`:

* `POST /api/mitre/sync`;
* `POST /api/translations`;
* `POST /api/translations/bulk`.

Роль перевіряється на сервері через базу даних, а не через frontend або JWT claim.

### 2. Secure defaults

За замовчуванням новий користувач отримує роль `USER`.

Admin-права не видаються через публічну реєстрацію.

Захищені endpointʼи не повинні працювати без JWT.

Якщо endpoint працює з персональними даними, прогресом, XP, Stealth або адміністративними операціями — доступ має бути закритий за замовчуванням.

Публічними залишаються лише ті read endpointʼи, які потрібні для роботи застосунку, наприклад читання місій, MITRE techniques або перекладів.

### 3. Defense in depth

Безпека не залежить від одного механізму.

Для захисту використовуються кілька рівнів:

* JWT для автентифікації;
* RBAC для admin endpointʼів;
* ownership check для progress/stats;
* серверна валідація input;
* Helmet security headers;
* rate limit на auth endpointʼи;
* приховування службових помилок;
* серверне оновлення XP, Stealth і progress.

Навіть якщо frontend буде змінено користувачем, backend все одно перевіряє права, власника ресурсу і валідність даних.

### 4. Fail securely

При помилці система повинна переходити у безпечний стан.

Очікувана поведінка:

| Сценарій                     | Результат                                   |
|------------------------------|---------------------------------------------|
| Немає JWT                    | `401 Unauthorized`                          |
| JWT невалідний               | `401 Unauthorized`                          |
| USER викликає admin endpoint | `403 Forbidden`                             |
| USER читає чужий progress    | `403 Forbidden`                             |
| Некоректний input            | `400 Bad Request`                           |
| Внутрішня помилка            | `500 Internal Server Error` без stack trace |

Система не повинна повертати stack trace, SQL, Prisma details, env або внутрішні шляхи файлів.

### 5. Validate input on server

Усі дані, які приходять з frontend, вважаються недовіреними.

Сервер повинен перевіряти:

* email, username, password;
* `levelId`;
* структуру відповіді на завдання;
* `locale`, `namespace`, `key`, `value` для translations API;
* bulk-операції;
* avatar upload;
* query parameters.

Frontend-валідація може бути лише допоміжною для UX, але не замінює серверну.

### 6. Never trust frontend

Frontend не має права напряму визначати:

* чи відповідь правильна;
* скільки XP нарахувати;
* який Stealth встановити;
* чи рівень завершено;
* яку роль має користувач;
* чи має користувач доступ до admin endpointʼа.

Усі критичні рішення приймає backend.

Особливо важливо, що `POST /api/levels/:id/submit` не повертає `correctAnswer`, а `validation` залишається на сервері.

### 7. Minimize exposed attack surface

API повинно відкривати лише необхідні endpointʼи.

Рекомендований підхід:

* використовувати `/users/me/*` замість `/users/:id/*`;
* legacy endpointʼи з `:id` залишити deprecated або прибрати;
* admin endpointʼи закрити через JWT + ADMIN;
* не дозволяти MITRE sync з довільного URL;
* обмежити translations bulk до 500 записів;
* не додавати CRUD місій без RBAC;
* не відкривати службові/debug endpointʼи у production.

Чим менше публічних write endpointʼів, тим менша площа атаки.

---

## DFD

### Основні компоненти

| Компонент        | Опис                                                                                            |
|------------------|-------------------------------------------------------------------------------------------------|
| Frontend         | React/Vite клієнт, UI для місій, завдань, профілю, Skill Matrix, перекладів                     |
| Backend API      | Express API, бізнес-логіка, auth, RBAC, validation, progress, XP, Stealth                       |
| PostgreSQL       | Основне сховище користувачів, місій, рівнів, прогресу, статистики, MITRE techniques, перекладів |
| MITRE CTI Source | Зовнішнє джерело STIX JSON для MITRE ATT&CK                                                     |
| Admin            | Користувач з роллю `ADMIN`, який може запускати sync і змінювати переклади                      |
| User             | Звичайний користувач платформи                                                                  |

---

## DFD: контекстний рівень

```text
[User]
  │
  │ HTTPS / UI actions
  ▼
[Frontend]
  │
  │ REST API / JWT
  ▼
[Backend API]
  │
  │ Prisma queries
  ▼
[PostgreSQL]

[Admin]
  │
  │ Admin UI / API calls / JWT
  ▼
[Frontend]
  │
  ▼
[Backend API]
  │
  ├── sync MITRE data ─────► [MITRE CTI Source]
  │
  └── store/update data ───► [PostgreSQL]
```

---

## Auth flow

```text
[User]
  │ email / password
  ▼
[Frontend]
  │ POST /api/auth/login
  ▼
[Backend API]
  │ validate credentials
  │ compare password hash
  ▼
[PostgreSQL]
  │ user + passwordHash
  ▼
[Backend API]
  │ issue JWT
  ▼
[Frontend]
  │ store JWT
  ▼
[User session]
```

### Security controls

* пароль перевіряється тільки на backend;
* password hash зберігається у PostgreSQL;
* JWT містить мінімальні дані;
* роль не береться з frontend;
* auth endpointʼи мають rate limit.

---

## Admin flows

```text
[Admin]
  │ admin action
  ▼
[Frontend]
  │ JWT
  ▼
[Backend API]
  │ authenticate
  │ requireAdmin
  │ check role in DB
  ▼
[PostgreSQL]
  │ role = ADMIN?
  ▼
[Backend API]
  ├── POST /api/mitre/sync
  ├── POST /api/translations
  └── POST /api/translations/bulk
```

### Security controls

* без JWT — `401`;
* роль `USER` — `403`;
* роль перевіряється через БД;
* admin endpointʼи не довіряють frontend;
* write-операції доступні тільки admin.

---

## MITRE CTI sync flow

```text
[Admin]
  │ POST /api/mitre/sync
  ▼
[Frontend]
  │ JWT
  ▼
[Backend API]
  │ authenticate
  │ requireAdmin
  │ fetch fixed MITRE CTI URL
  ▼
[MITRE CTI Source]
  │ STIX JSON
  ▼
[Backend API]
  │ filter attack-pattern
  │ transform data
  │ upsert techniques
  ▼
[PostgreSQL]
  │ mitre_techniques
```

### Security controls

* sync запускає тільки `ADMIN`;
* користувач не передає довільний URL;
* backend використовує фіксоване джерело MITRE CTI;
* дані проходять фільтрацію перед записом у БД;
* помилки sync не розкривають stack trace.

---

## Progress / stats flow

```text
[User]
  │ open profile / missions / skill matrix
  ▼
[Frontend]
  │ GET /api/users/me/progress
  │ GET /api/users/me/stats
  │ JWT
  ▼
[Backend API]
  │ authenticate
  │ resolve current user
  │ apply passive stealth regen
  ▼
[PostgreSQL]
  │ user_progress
  │ user_stats
  │ user_mitre_techniques
  ▼
[Backend API]
  │ return only current user's data
  ▼
[Frontend]
```

### Security controls

* progress/stats доступні тільки з JWT;
* рекомендовані endpointʼи — `/users/me/*`;
* legacy `/users/:id/*` перевіряє ownership;
* користувач не може читати чужий progress;
* XP/Stealth не змінюються напряму з frontend.

---

## Submit answer / XP / Stealth flow

```text
[User]
  │ submit answer
  ▼
[Frontend]
  │ POST /api/levels/:id/submit
  │ JWT + answer
  ▼
[Backend API]
  │ authenticate
  │ load level
  │ validate answer
  │ update progress
  │ calculate XP
  │ update Stealth
  │ update MITRE completion
  ▼
[PostgreSQL]
  │ user_progress
  │ user_stats
  │ user_mitre_techniques
  ▼
[Backend API]
  │ result without correctAnswer
  ▼
[Frontend]
```

### Security controls

* правильність відповіді визначає backend;
* `correctAnswer` не повертається;
* `validation` не віддається клієнту;
* XP нараховується лише сервером;
* повторне проходження не дає повторний XP;
* submit блокується при Stealth = 0.

---

## Translations flow

### Read flow

```text
[Frontend]
  │ GET /api/translations
  │ GET /api/translations/namespaces
  ▼
[Backend API]
  │ validate locale
  │ validate namespace
  ▼
[PostgreSQL]
  │ translations
  │ languages
  ▼
[Backend API]
  │ return translation values
  ▼
[Frontend]
```

### Write flow

```text
[Admin]
  │ create/update translations
  ▼
[Frontend]
  │ POST /api/translations
  │ POST /api/translations/bulk
  │ JWT
  ▼
[Backend API]
  │ authenticate
  │ requireAdmin
  │ validate key/value/locale/namespace
  ▼
[PostgreSQL]
  │ upsert translations
```

### Security controls

* read translations можуть бути публічними для i18n;
* write translations — тільки `ADMIN`;
* `locale` і `namespace` проходять whitelist;
* `key` не може містити `..`, `/`, `\`;
* bulk має ліміт записів;
* некоректний input повертає `400`.

---

## Trust boundaries

```text
[Browser / Frontend]
        │
        │ Untrusted boundary
        ▼
[Backend API]
        │
        │ Trusted internal boundary
        ▼
[PostgreSQL]

[Backend API]
        │
        │ External data boundary
        ▼
[MITRE CTI Source]
```

### Межі довіри

| Межа                 | Ризик                                  | Контроль                                                |
|----------------------|----------------------------------------|---------------------------------------------------------|
| Frontend → Backend   | Підробка запитів, зміна body, обхід UI | JWT, RBAC, ownership, server validation                 |
| Backend → PostgreSQL | Пошкодження або витік даних            | Prisma, контроль доступу через API, мінімізація raw SQL |
| Backend → MITRE CTI  | Недовірені зовнішні дані               | fixed URL, filtering, transform, upsert                 |
| Public read API      | Надмірне розкриття даних               | не повертати службові поля                              |
| Admin API            | Несанкціонована зміна даних            | JWT + ADMIN + роль з БД                                 |

---

## Sensitive data stores

| Сховище            | Дані                                | Захист                                    |
|--------------------|-------------------------------------|-------------------------------------------|
| `users`            | email, username, passwordHash, role | bcrypt, JWT auth, role check              |
| `user_progress`    | completed, attempts, lastAnswer     | ownership check                           |
| `user_stats`       | XP, rank, Stealth                   | server-side update only                   |
| `translations`     | UI-тексти                           | admin write, validated input              |
| `mitre_techniques` | MITRE ATT&CK дані                   | admin sync, fixed source                  |
| `levels`           | validation, rewards, task content   | validation не повертати в submit response |

---

## Trust boundaries

### 1. Browser → Backend

```text
[Browser / Frontend]
        │
        │ Trust Boundary: untrusted client input
        ▼
[Backend API]
```

**Ризики:**

* підробка HTTP-запитів;
* зміна request body;
* підміна JWT;
* спроба напряму змінити XP / Stealth / progress;
* обхід UI-обмежень.

**Контролі:**

* JWT authentication;
* server-side authorization;
* server-side input validation;
* ownership check;
* backend-only update для XP / Stealth / progress.

---

### 2. Backend → Database

```text
[Backend API]
        │
        │ Trust Boundary: application data access layer
        ▼
[PostgreSQL]
```

**Ризики:**

* несанкціонований доступ до даних;
* пошкодження progress/stats;
* data poisoning;
* витік passwordHash або службових полів.

**Контролі:**

* доступ до БД тільки через backend;
* Prisma ORM;
* відсутність прямого доступу з frontend;
* RBAC;
* ownership check;
* мінімізація службових полів у response.

---

### 3. Backend → External MITRE Source

```text
[Backend API]
        │
        │ Trust Boundary: external data source
        ▼
[MITRE CTI Source]
```

**Ризики:**

* недовірені зовнішні дані;
* data poisoning;
* DoS через важку sync-операцію;
* SSRF, якщо дозволити довільний URL.

**Контролі:**

* sync тільки для `ADMIN`;
* фіксований MITRE CTI URL;
* фільтрація STIX-обʼєктів;
* transform перед записом у БД;
* upsert замість неконтрольованого insert.

---

### 4. User API → Admin API

```text
[User API]
        │
        │ Trust Boundary: privilege boundary
        ▼
[Admin API]
```

**Ризики:**

* elevation of privilege;
* USER викликає admin endpoint;
* зміна MITRE techniques;
* зміна translations;
* запуск sync без прав.

**Контролі:**

* `authenticate`;
* `requireAdmin`;
* перевірка ролі через БД;
* роль не береться з frontend;
* роль не довіряється з JWT claim;
* `USER` отримує `403 Forbidden`.

---

### 5. Public endpoints → Protected endpoints

```text
[Public Endpoints]
        │
        │ Trust Boundary: authentication boundary
        ▼
[Protected Endpoints]
```

**Public endpoints:**

* `POST /api/auth/login`;
* `POST /api/auth/register`;
* `GET /api/missions`;
* `GET /api/mitre/techniques`;
* `GET /api/translations`;
* `GET /api/translations/namespaces`.

**Protected endpoints:**

* `GET /api/users/me`;
* `GET /api/users/me/progress`;
* `GET /api/users/me/stats`;
* `POST /api/levels/:id/submit`;
* `POST /api/users/me/stealth/masking`;
* `POST /api/users/me/stealth/wait`.

**Admin protected endpoints:**

* `POST /api/mitre/sync`;
* `POST /api/translations`;
* `POST /api/translations/bulk`.

**Ризики:**

* доступ без JWT;
* витік персональних даних;
* зміна стану користувача без авторизації;
* виклик admin-операцій звичайним користувачем.

**Контролі:**

* protected endpoints вимагають JWT;
* admin endpoints вимагають JWT + `ADMIN`;
* public endpoints не повинні повертати службові поля;
* write-операції не повинні бути public;
* помилки не повинні розкривати внутрішню реалізацію.

---

## Summary table

| Trust boundary               | Тип межі                  | Основний ризик              | Основний контроль                     |
|------------------------------|---------------------------|-----------------------------|---------------------------------------|
| Browser → Backend            | Untrusted client boundary | Підробка запитів            | JWT, validation, ownership            |
| Backend → Database           | Data access boundary      | Несанкціонована зміна даних | Prisma, RBAC, backend-only access     |
| Backend → MITRE Source       | External source boundary  | Недовірені зовнішні дані    | Fixed URL, filtering, admin-only sync |
| User API → Admin API         | Privilege boundary        | Elevation of privilege      | `requireAdmin`, role check in DB      |
| Public → Protected endpoints | Authentication boundary   | Доступ без авторизації      | JWT, 401/403, minimal public API      |

## Threat model

### 1. Контекст оновлення

Модель загроз оновлена після перегляду архітектури через Security by Design, уточнення DFD, позначення trust boundaries та виконання OWASP ZAP remediation.

Основний фокус оновлення:

* нові потоки даних;
* admin API;
* progress / stats;
* translations API;
* MITRE sync;
* ризики, знижені після OWASP ZAP remediation.

---

## 2. Нові та уточнені потоки даних

| Потік              | Джерело       | Приймач          | Дані                               | Основний ризик                  | Контроль                              |
|--------------------|---------------|------------------|------------------------------------|---------------------------------|---------------------------------------|
| Auth flow          | Browser       | Backend API      | email, password                    | brute force, spoofing           | bcrypt, JWT, rate limit               |
| JWT session        | Backend API   | Browser          | JWT token                          | token theft, replay             | expiration, signature validation      |
| Protected user API | Browser       | Backend API      | JWT, user actions                  | доступ без auth                 | authenticate middleware               |
| Progress / stats   | Backend API   | PostgreSQL       | progress, XP, Stealth              | IDOR, tampering                 | ownership check, backend-only update  |
| Submit answer      | Browser       | Backend API      | answer payload                     | cheat, XP накрутка              | server validation, no direct XP input |
| Admin API          | Browser/Admin | Backend API      | sync/translation commands          | elevation of privilege          | JWT + ADMIN                           |
| MITRE sync         | Backend API   | MITRE CTI source | STIX JSON                          | data poisoning, DoS             | fixed URL, admin-only, filtering      |
| Translations read  | Browser       | Backend API      | locale, namespace                  | path traversal, info disclosure | whitelist validation                  |
| Translations write | Admin         | Backend API      | key/value/locale/namespace         | tampering, content poisoning    | admin-only, validation, bulk limit    |
| Database access    | Backend API   | PostgreSQL       | users, levels, stats, translations | unauthorized data access        | backend-only DB access                |

---

## 3. Уточнені ризики для Admin API

Admin API включає:

* `POST /api/mitre/sync`;
* `POST /api/translations`;
* `POST /api/translations/bulk`.

### STRIDE для Admin API

| STRIDE                 | Ризик                        | Як проявляється                         | Контроль                |
|------------------------|------------------------------|-----------------------------------------|-------------------------|
| Spoofing               | Підміна admin-користувача    | Використання чужого JWT                 | JWT validation          |
| Tampering              | Зміна MITRE або translations | USER змінює системні дані               | `requireAdmin`          |
| Repudiation            | Заперечення admin-дії        | Admin запускає sync і заперечує         | audit logging           |
| Information Disclosure | Витік службових деталей      | Stack trace / internal error у response | generic errors          |
| Denial of Service      | Частий запуск sync або bulk  | Навантаження на API/DB                  | rate limit, admin-only  |
| Elevation of Privilege | USER викликає admin endpoint | Відсутній role check                    | роль перевіряється в БД |

### Вимоги до контролю

Admin endpoint повинен:

* вимагати JWT;
* перевіряти роль `ADMIN` через БД;
* повертати `401` без JWT;
* повертати `403` для `USER`;
* не довіряти ролі з frontend;
* не повертати службові помилки.

---

## 4. Уточнені ризики для progress / stats

Progress / stats включають:

* `GET /api/users/me/progress`;
* `GET /api/users/me/stats`;
* deprecated `GET /api/users/:id/progress`;
* deprecated `GET /api/users/:id/stats`;
* XP;
* rank;
* Stealth;
* completed levels;
* UserMitreTechnique.

### STRIDE для progress / stats

| STRIDE                 | Ризик                        | Як проявляється                      | Контроль                 |
|------------------------|------------------------------|--------------------------------------|--------------------------|
| Spoofing               | Доступ від імені іншого user | Підміна JWT або userId               | userId тільки з JWT      |
| Tampering              | Накрутка XP / Stealth        | Користувач передає xp/stealth у body | backend-only calculation |
| Repudiation            | Заперечення проходження      | Немає історії submit                 | логування submit result  |
| Information Disclosure | Читання чужого прогресу      | `/users/:id/stats` з чужим id        | ownership check          |
| Denial of Service      | Масові submit-запити         | Навантаження на validation           | rate limiting            |
| Elevation of Privilege | Доступ до чужих stats        | IDOR через userId                    | ownership guard          |

### Вимоги до контролю

Progress / stats повинні:

* читатися через `/users/me/*`;
* не дозволяти доступ до чужого `userId`;
* не приймати XP або Stealth напряму з frontend;
* оновлюватися тільки після серверної перевірки відповіді;
* не нараховувати XP повторно за вже пройдений рівень;
* блокувати submit при Stealth = 0.

---

## 5. Уточнені ризики для translations API

Translations API включає:

* `GET /api/translations/languages`;
* `GET /api/translations`;
* `GET /api/translations/namespaces`;
* `POST /api/translations`;
* `POST /api/translations/bulk`.

### STRIDE для translations API

| STRIDE                 | Ризик                    | Як проявляється                  | Контроль          |
|------------------------|--------------------------|----------------------------------|-------------------|
| Spoofing               | USER видає себе за admin | Виклик write endpointʼів         | JWT + ADMIN       |
| Tampering              | Підміна перекладів       | Зміна навчального/UI-контенту    | RBAC + validation |
| Repudiation            | Заперечення зміни        | Немає історії змін               | audit logging     |
| Information Disclosure | Витік службових ключів   | API повертає debug/internal keys | DTO minimization  |
| Denial of Service      | Масовий bulk-запис       | Великий payload                  | bulk limit        |
| Elevation of Privilege | USER змінює контент      | Немає admin guard                | `requireAdmin`    |

### Окремий ризик: Path Traversal

OWASP ZAP раніше виявив потенційний Path Traversal у:

```text
GET /api/translations/namespaces?namespaces=...
```

Контролі після remediation:

* whitelist для `namespace`;
* whitelist для `locale`;
* заборона `..`;
* заборона `/`;
* заборона `\`;
* валідація query parameters;
* некоректний input → `400 Bad Request`.

---

## 6. Ризики, знижені після OWASP ZAP remediation

### Було виявлено під час baseline scan

| Alert                                  | Ризик                 | Категорія                      |
|----------------------------------------|-----------------------|--------------------------------|
| Path Traversal                         | High / Low confidence | Broken Access Control / CWE-22 |
| Missing X-Content-Type-Options         | Low                   | Security Misconfiguration      |
| X-Powered-By: Express                  | Low                   | Information Disclosure         |
| Suspicious comments                    | Informational         | Sensitive info in comments     |
| Authentication Request Identified      | Informational         | Auth flow detected             |
| Session Management Response Identified | Informational         | Token response detected        |

### Після remediation

| Ризик                                     | Статус після виправлення          | Знижений ризик                    |
|-------------------------------------------|-----------------------------------|-----------------------------------|
| Path Traversal у translations API         | Більше не фіксується              | Tampering / Broken Access Control |
| Відсутній `X-Content-Type-Options`        | Виправлено через security headers | MIME-sniffing                     |
| `X-Powered-By: Express`                   | Приховано                         | Fingerprinting                    |
| TODO/debug comments у response            | Прибрано                          | Information Disclosure            |
| Слабка validation translations query      | Посилено                          | Path traversal / data poisoning   |
| Admin endpointʼи без достатнього контролю | Закрито через RBAC                | Elevation of Privilege            |

Після повторного OWASP ZAP baseline scan залишились лише informational alerts:

* Authentication Request Identified;
* Session Management Response Identified.

Ці alerts не є вразливостями. Вони підтверджують, що ZAP коректно визначив login endpoint і token-based session response.

---

## 7. Оновлена таблиця ключових ризиків

| Ризик                                | Категорія                 | Поточна критичність | Поточний контроль                 |
|--------------------------------------|---------------------------|---------------------|-----------------------------------|
| USER викликає MITRE sync             | Elevation of Privilege    | Знижено             | JWT + ADMIN                       |
| USER змінює translations             | Tampering                 | Знижено             | RBAC + validation                 |
| Path Traversal у translations        | Tampering / BAC           | Знижено             | whitelist + forbidden path chars  |
| USER читає чужий progress            | Information Disclosure    | Знижено             | ownership check                   |
| XP / Stealth накручуються з frontend | Tampering                 | Знижено             | backend-only calculation          |
| API розкриває Express                | Information Disclosure    | Знижено             | disabled `x-powered-by`           |
| MIME sniffing                        | Security Misconfiguration | Знижено             | `X-Content-Type-Options: nosniff` |
| Stack trace / internal errors        | Information Disclosure    | Знижено             | generic error handler             |
| Масові submit-запити                 | DoS                       | Частково відкрито   | рекомендовано rate limiting       |
| Відсутність audit trail              | Repudiation               | Частково відкрито   | рекомендовано audit logging       |

---

## 8. Залишкові ризики

| Ризик                     | Статус            | Рекомендація                                      |
|---------------------------|-------------------|---------------------------------------------------|
| Масові submit-запити      | Відкритий         | Додати rate limit на `POST /levels/:id/submit`    |
| Частий MITRE sync         | Частково знижений | Додати admin rate limit / cooldown                |
| Відсутність audit logging | Відкритий         | Логувати admin actions, sync, translation changes |
| Legacy `/users/:id/*`     | Частково знижений | Видалити після переходу на `/users/me/*`          |
| JWT у localStorage        | Прийнятий для MVP | Надалі розглянути httpOnly cookie                 |
| Повна AST-валідація коду  | Не реалізовано    | Додати AST parser для production                  |
| Public translations read  | Прийнятий ризик   | Не повертати службові/debug keys                  |

---

## 9. Delta threat model: до / після

### До

* translations API мав потенційний Path Traversal ризик;
* security headers були неповні;
* backend розкривав `X-Powered-By`;
* API response міг містити debug/TODO-коментарі;
* admin API та MITRE sync потребували чіткішого RBAC-опису;
* progress/stats потребували явної ownership-моделі.

### Після

* translations API має whitelist validation;
* path-like input блокується;
* security headers посилені;
* `X-Powered-By` приховано;
* debug/TODO-коментарі прибрані з response;
* admin API захищений JWT + ADMIN;
* роль перевіряється через БД;
* progress/stats захищені ownership check;
* XP/Stealth змінюються тільки backend-логікою;
* повторний OWASP ZAP baseline не фіксує попередні технічні alerts.

---

## Risk Register

| ID   | Ризик                                       | Опис                                                                                                                      | Вплив  | Ймовірність | Рівень | Поточні контролі                                                                                                             | Залишковий ризик | Рекомендації                                                                  |
|------|---------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|--------|-------------|--------|------------------------------------------------------------------------------------------------------------------------------|------------------|-------------------------------------------------------------------------------|
| R-01 | IDOR                                        | Користувач може спробувати отримати progress/stats іншого користувача через підміну `userId` у URL                        | High   | Medium      | High   | `/users/me/*`, ownership check, перевірка `userId` з JWT                                                                     | Low              | Прибрати legacy `/users/:id/*`, додати automated tests                        |
| R-02 | Privilege escalation                        | Звичайний `USER` може спробувати викликати admin endpointʼи                                                               | High   | Medium      | High   | JWT + `requireAdmin`, роль перевіряється в БД                                                                                | Low              | Додати audit logging для admin actions                                        |
| R-03 | Content tampering                           | Зловмисник може спробувати змінити translations, MITRE techniques або навчальний контент                                  | High   | Medium      | High   | Admin-only write API, validation, whitelist locale/namespace, fixed MITRE CTI source                                         | Medium           | Додати versioning/audit trail для translations і MITRE sync                   |
| R-04 | Information disclosure                      | API може випадково повернути службові дані: stack trace, validation rules, `correctAnswer`, debug-коментарі, X-Powered-By | High   | Medium      | High   | generic error handler, disabled `x-powered-by`, Helmet, no `correctAnswer` in submit response                                | Low              | Перевіряти responses у ZAP/Sonar, не повертати debug fields                   |
| R-05 | Brute force login                           | Атакувальник може масово підбирати email/password                                                                         | Medium | Medium      | Medium | rate limit на `/auth/login` і `/auth/register`, bcrypt                                                                       | Medium           | Додати account lockout / captcha після багатьох невдалих спроб                |
| R-06 | DoS через submit endpoints                  | Масові запити на `POST /levels/:id/submit` можуть створити навантаження на validation, DB update і progress logic         | Medium | Medium      | Medium | JWT required, server validation, Stealth block при 0                                                                         | Medium           | Додати rate limit на submit, cooldown, request size limit                     |
| R-07 | DoS через sync endpoint                     | Частий запуск `POST /mitre/sync` може навантажити backend, БД або зовнішнє MITRE CTI джерело                              | High   | Low         | Medium | endpoint доступний тільки `ADMIN`, fixed MITRE URL                                                                           | Medium           | Додати admin rate limit, cooldown, job queue, lock на один active sync        |
| R-08 | Неправильне використання offensive-контенту | Навчальні завдання можуть бути використані не лише для навчання, а й для створення шкідливих сценаріїв                    | High   | Medium      | High   | гейміфікований навчальний контекст, обмежені сценарії, sentence constructor, defensive-пояснення, відсутність реальних цілей | Medium           | Додавати більше defensive context, етичні попередження, sandbox-only сценарії |

## Secure Design Decisions

| ID     | Рішення                                                                     | Обґрунтування                                                                                                                                 | Знижений ризик                            |
|--------|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| SDD-01 | XP / Stealth рахуються тільки на backend                                    | Клієнт не може напряму встановити XP, rank, Stealth або completed status. Усі зміни виконуються після серверної перевірки відповіді.          | Tampering, накрутка прогресу              |
| SDD-02 | `userId` береться тільки з JWT                                              | Backend не довіряє `userId`, переданому з frontend або URL, для визначення поточного користувача.                                             | IDOR, spoofing                            |
| SDD-03 | Admin endpoints захищені RBAC                                               | Для `POST /api/mitre/sync`, `POST /api/translations`, `POST /api/translations/bulk` потрібні JWT + роль `ADMIN`. Роль перевіряється через БД. | Privilege escalation                      |
| SDD-04 | Translations namespace проходить whitelist validation                       | `locale` і `namespace` перевіряються на сервері. Path-like значення з `..`, `/`, `\` блокуються.                                              | Path Traversal, content tampering         |
| SDD-05 | MITRE sync доступний тільки admin                                           | Синхронізація MITRE CTI змінює системний довідник, тому endpoint закритий для звичайних користувачів.                                         | Data poisoning, DoS, privilege escalation |
| SDD-06 | Debug / TODO інформація не повертається у response                          | API response не повинен містити службові коментарі, stack trace, SQL, Prisma details або внутрішні шляхи.                                     | Information disclosure                    |
| SDD-07 | Security headers додаються централізовано                                   | Helmet і централізоване налаштування headers застосовуються на рівні backend API, а не окремо в кожному endpointʼі.                           | Security misconfiguration, MIME sniffing  |
| SDD-08 | OWASP ZAP scan використовується як validation, а не як єдиний метод безпеки | ZAP підтверджує ефективність controls після реалізації, але не замінює threat modeling, secure design, code review, SAST і manual testing.    | Хибне відчуття повної безпеки             |
| SDD-09 | Frontend вважається недовіреним                                             | Будь-який request з браузера може бути змінений користувачем, тому всі критичні перевірки виконуються на backend.                             | Business logic bypass                     |
| SDD-10 | `correctAnswer` не повертається у submit response                           | Еталонна відповідь і validation rules залишаються на сервері.                                                                                 | Витік навчального контенту                |

## Security-by-Design Matrix

| Принцип                 | Як застосовано                                                                                                              | Security effect                                                                    |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| Least Privilege         | Користувач має доступ тільки до власного progress/stats. Admin API доступний лише користувачу з роллю `ADMIN`.              | Знижує ризик IDOR та privilege escalation.                                         |
| Secure Defaults         | Нові protected endpointʼи за замовчуванням закриті та вимагають JWT. Новий користувач отримує роль `USER`.                  | Зменшує ризик випадкового відкриття критичних API.                                 |
| Defense in Depth        | Використовується JWT + RBAC + ownership check + server-side validation + security headers.                                  | Навіть якщо один контроль буде обійдено, інші рівні продовжують захищати систему.  |
| Fail Securely           | Якщо JWT відсутній, роль недостатня або input невалідний — доступ забороняється через `401`, `403` або `400`.               | Помилки не відкривають доступ до даних або admin-операцій.                         |
| Input Validation        | `namespaces`, `locale`, translation keys, submit answers, auth payload і query parameters проходять server-side validation. | Знижує ризики path traversal, content tampering і некоректної бізнес-логіки.       |
| Minimize Attack Surface | Admin/sync endpointʼи обмежені. MITRE sync доступний тільки admin. Legacy `/users/:id/*` замінюються на `/users/me/*`.      | Зменшує кількість точок атаки.                                                     |
| Never Trust Client      | XP, Stealth, rank і completed levels не приймаються напряму з frontend. Усі значення рахуються backend-логікою.             | Знижує ризик накрутки прогресу та обходу навчальної логіки.                        |
| Secure Admin Operations | `POST /api/mitre/sync`, `POST /api/translations`, `POST /api/translations/bulk` захищені JWT + ADMIN.                       | Захищає системні дані від несанкціонованої зміни.                                  |

---

## CI/CD Security Pipeline

Автоматизовані перевірки перед деплоєм (тиждень 5). Workflow: `.github/workflows/security-ci.yml`.

| Gate | Умова блокування merge/deploy |
|------|-------------------------------|
| Build & lint | `shared` / `server` / `client` — install, lint, build failed |
| Dependency audit | critical CVE в npm-залежностях |
| SonarCloud | Quality Gate failed |
| Snyk | high/critical vulnerabilities в dependencies |
| Trivy | CRITICAL/HIGH CVE в Docker image backend |

Deploy: merge в `main` лише після green checks → Railway auto-deploy. Деталі: [diploma-docs/ci-cd-pipeline.md](./diploma-docs/ci-cd-pipeline.md).
| Secure Error Handling   | API не повертає stack trace, Prisma details, SQL, env, debug/TODO-коментарі або внутрішні шляхи.                            | Знижує ризик information disclosure.                                               |
| Security Validation     | OWASP ZAP використовується для перевірки реалізованих controls, але не як єдиний метод безпеки.                             | Підтверджує remediation і доповнює threat modeling, manual testing та code review. |