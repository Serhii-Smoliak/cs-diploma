# Документація CyberTactics

Каталог `docs/` містить технічну та організаційну документацію дипломного проєкту **CyberTactics**. Скріншоти інтерфейсу та звіти DAST (OWASP ZAP) додаються до **пояснювальної записки**, не до цього репозиторію.

## Файли

| Файл | Призначення |
|------|-------------|
| [documentation.md](./documentation.md) | Повна технічна документація: архітектура, стек, БД, API, бізнес-логіка, i18n, threat model, перевірка безпеки |
| [security-requirements.md](./security-requirements.md) | Вимоги безпеки, acceptance criteria, STRIDE-ризики, чеклисти для нових фіч |
| [ci-cd-pipeline.md](./ci-cd-pipeline.md) | CI/CD pipeline: GitHub Actions, SonarCloud, Snyk, Trivy, security gates, deploy на Railway |
| [weekly-report.md](./weekly-report.md) | Щотижневий звіт виконання (8 тижнів): план, факт, ризики, remediation, посилання на артефакти |
| [ui-overview.md](./ui-overview.md) | Огляд інтерфейсу: екрани платформи, скріншоти `img_37` … `img_61`, опис доступних дій |
| [owasp-zap-report.md](./owasp-zap-report.md) | Звіт OWASP ZAP: baseline, remediation, повторний scan, скріни `img_24` … `img_36`, `img_62` |

## Зображення

Файли в [img/](./img/):

- `img_1` … `img_36` — ілюстрації до [weekly-report.md](./weekly-report.md) (архітектура, CI, OWASP ZAP тощо);
- `img_37` … `img_61` — скріншоти UI для [ui-overview.md](./ui-overview.md);
- `img_62` — Active Scan OWASP ZAP для [owasp-zap-report.md](./owasp-zap-report.md).

Нові скріншоти тимчасово можна класти в корінь `docs/`; при оновленні документації їх перейменовують у `img_N.png` і переносять у `img/`.

## Швидкі посилання з кореня репозиторію

- [README.md](../README.md) — установка, запуск, маршрути, тестовий акаунт
- [sonar-project.properties](../sonar-project.properties) — налаштування SonarCloud
- [.github/workflows/security-ci.yml](../.github/workflows/security-ci.yml) — CI workflow

## Версії

Актуальність технічних розділів перевіряйте за полем **«Оновлено»** в кінці [documentation.md](./documentation.md).