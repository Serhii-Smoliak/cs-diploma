# CI/CD Security Pipeline — CyberTactics

## Схема

```
Push / Pull Request
        ↓
GitHub Actions (security-ci.yml)
        ↓
┌──────────────────────────────────────┐
│ Build & lint (build-and-check)       │
│  shared → server → client            │
│  (+ tests/coverage для Sonar)        │
└──────────────────────────────────────┘
        ↓ (паралельно, needs: build-and-check)
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Dependency   │ SonarCloud   │ Snyk         │ Trivy        │
│ audit        │ SAST         │ (server,     │ container    │
│              │              │  client)     │ scan         │
└──────────────┴──────────────┴──────────────┴──────────────┘
        ↓
Merge в main (branch protection)
        ↓
Railway auto-deploy (налаштування в UI Railway)
```

## Jobs

| Job | Інструмент | Що перевіряє |
|-----|------------|--------------|
| `build-and-check` | npm, eslint, prettier, vitest, tsc | Monorepo: збірка та перевірки перед deploy |
| `dependency-audit` | npm audit | CVE у залежностях (рівень **critical**) |
| `sonar` | SonarCloud | SAST: bugs, vulnerabilities, smells, hotspots, Quality Gate |
| `snyk-deps` | Snyk | vulnerable npm packages у **server і client** (severity ≥ high) |
| `container-scan` | Trivy | CVE у Docker image backend (CRITICAL, HIGH) |

### Деталі `build-and-check`

| Пакет | Команди в CI |
|-------|--------------|
| **shared** | `npm ci`, `npm run build` (tsc) |
| **server** | `npm ci`, `npm run db:generate`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run build` |
| **client** | `npm ci`, `npm run lint`, `npm run test:coverage`, `npm run build` (tsc + vite) |

Після server/client tests артефакт `coverage-reports` (`lcov.info`) завантажується для job `sonar`.

**Примітка:** окремого `typecheck` script немає — TypeScript перевіряється через `npm run build`. У `shared` lint/format у CI не запускаються (лише build). У `client` є `format:check` у `package.json`, але в CI поки не викликається.

### Деталі `snyk-deps`

Matrix: `server`, `client`. Перед Snyk збирається `shared`. Пакет **`shared` окремо не сканується** Snyk.

### Деталі `container-scan`

```bash
docker build -t cybertactics-server:ci -f server/Dockerfile .
```

Trivy: `scanners: vuln`, `severity: CRITICAL,HIGH`, `ignore-unfixed: true`, `skip-dirs` для системних npm-шляхів у базовому Node image.

## Security gates

Deploy / merge блокується, якщо:

- `build-and-check` — lint, format (server), tests, build або coverage upload не пройшли
- `dependency-audit` — знайдено **critical** CVE в залежностях (shared, server, client)
- `sonar` — Sonar **Quality Gate failed** або відсутній `SONAR_TOKEN`
- `snyk-deps` — знайдено **high/critical** вразливості в npm-залежностях server/client або відсутній `SNYK_TOKEN`
- `container-scan` — **CRITICAL/HIGH** CVE в Docker image

## Deploy flow (MVP)

```
Pull Request → GitHub Actions (усі jobs green) → merge в main → Railway auto-deploy
```

Рекомендації в GitHub:

1. **Branch protection** на `main`: require status checks:
   - `Build & lint`
   - `Dependency audit`
   - `SonarCloud SAST`
   - `Snyk dependencies` (matrix: server, client — два окремі checks)
   - `Container scan (Trivy)`
2. Require pull request before merging
3. Заборонити direct push у `main` (за можливості)

**Railway:** auto-deploy з `main`. Build/start команди налаштовані в **UI Railway** для сервісів `cs-diploma-be` і `cs-diploma-fe` (файлу `railway.toml` у репозиторії немає). Backend: збірка shared+server, `node dist/index.js`, pre-deploy `npx prisma migrate deploy`. Захист — branch protection + CI gates.

## Налаштування secrets

| Secret | Де взяти |
|--------|----------|
| `SONAR_TOKEN` | [sonarcloud.io](https://sonarcloud.io) → My Account → Security → Generate Token |
| `SNYK_TOKEN` | [snyk.io](https://snyk.io) → Account Settings → API Token |

`GITHUB_TOKEN` — вбудований; використовується SonarCloud action для коментарів у PR.

Поточні значення Sonar (у `sonar-project.properties` і args workflow):

```properties
sonar.organization=serhii-smoliak
sonar.projectKey=Serhii-Smoliak_cs-diploma
sonar.qualitygate.wait=true
sonar.javascript.lcov.reportPaths=client/coverage/lcov.info,server/coverage/lcov.info
```

## Docker image

Збірка з кореня репозиторію (monorepo: shared + server):

```bash
docker build -t cybertactics-server -f server/Dockerfile .
```

## Dependabot

`.github/dependabot.yml` — щотижневі PR на оновлення залежностей у `shared`, `server`, `client` та GitHub Actions.
