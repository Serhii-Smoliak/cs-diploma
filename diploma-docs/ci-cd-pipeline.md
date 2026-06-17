# CI/CD Security Pipeline — CyberTactics

Тиждень 5: автоматизовані перевірки безпеки перед деплоєм на Railway.

## Схема

```
Push / Pull Request
        ↓
GitHub Actions (security-ci.yml)
        ↓
┌──────────────────────────────────────┐
│ Build & lint                         │
│  shared → server → client            │
└──────────────────────────────────────┘
        ↓
Dependency audit (npm audit)
        ↓
SonarCloud SAST + Quality Gate
        ↓
Snyk (npm dependencies)
        ↓
Trivy (Docker image scan)
        ↓
Merge в main (branch protection)
        ↓
Railway deploy
```

## Jobs

| Job | Інструмент | Що перевіряє |
|-----|------------|--------------|
| `build-and-check` | npm, tsc, eslint | shared, server, client: install, lint, build |
| `dependency-audit` | npm audit | CVE у залежностях (рівень critical) |
| `sonar` | SonarCloud | SAST: bugs, vulnerabilities, smells, hotspots, Quality Gate |
| `snyk-deps` | Snyk | vulnerable npm packages (severity ≥ high) |
| `container-scan` | Trivy | CVE у Docker image backend (CRITICAL, HIGH) |

## Security gates

Deploy / merge блокується, якщо:

- `build-and-check` — build, lint або typecheck не пройшли
- `dependency-audit` — знайдено **critical** CVE в залежностях
- `sonar` — Sonar **Quality Gate failed**
- `snyk-deps` — знайдено **high/critical** вразливості в npm-залежностях
- `container-scan` — **CRITICAL/HIGH** CVE в Docker image
- відсутні GitHub Secrets для Sonar/Snyk (job падає до налаштування)

## Deploy flow (MVP)

```
Pull Request → GitHub Actions (усі jobs green) → merge в main → Railway auto-deploy
```

Рекомендації в GitHub:

1. **Branch protection** на `main`: require status checks (`Build & lint`, `Dependency audit`, `SonarCloud SAST`, `Snyk dependencies`, `Container scan`)
2. Require pull request before merging
3. Заборонити direct push у `main` (за можливості)

Railway: auto-deploy з `main`; build/start — у `railway.toml` (npm). Захист — branch protection + CI gates.

## Налаштування secrets

| Secret | Де взяти |
|--------|----------|
| `SONAR_TOKEN` | [sonarcloud.io](https://sonarcloud.io) → My Account → Security → Generate Token |
| `SNYK_TOKEN` | [snyk.io](https://snyk.io) → Account Settings → API Token |

Після імпорту репо в SonarCloud оновити `sonar-project.properties`:

```properties
sonar.organization=<your-org>
sonar.projectKey=<your-org>_cs-diploma
```

## Docker image

Збірка з кореня репозиторію (monorepo: shared + server):

```bash
docker build -t cybertactics-server -f server/Dockerfile .
```

## Dependabot

`.github/dependabot.yml` — щотижневі PR на оновлення залежностей у `shared`, `server`, `client` та GitHub Actions.

## Артефакти для звіту

- `.github/workflows/security-ci.yml`
- посилання на успішний GitHub Actions run
- SonarCloud dashboard / скриншот Quality Gate
- лог dependency audit / Snyk / Trivy у CI
