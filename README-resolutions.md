# Стенд автотестов для проверки Resolutions

40 тестов интернет-магазина (Checkout, Orders, Catalog search, Account, Notifications, Admin panel).
Тесты не ходят в приложение и падают детерминированно, причины падений подобраны под пункты задачи про Resolutions.

**Нечётный прогон:** 20 красных. **Чётный прогон или rerun из TestOps:** 18 красных (флаки зеленеют).

| Причина | Тестов | Статус | Сообщение | Что проверяем |
|---|---|---|---|---|
| payments-service лежит | 5 | broken | `connect ECONNREFUSED 10.12.4.17:8080` | Одна причина в 3 фичах у 2 владельцев: группировка по похожим падениям, один дефект на всех, назначение группы на одного человека |
| НДС считается дважды | 4 | failed | `Price mismatch: expected '119.00 EUR' to equal '141.61 EUR'` (числа разные) | Точное совпадение их не склеит: фильтр по тексту ошибки, регулярка |
| Таймаут UI | 4 | failed | `Timed out retrying after 10000ms: Expected to find element: [data-test=search-results]` | Error category «Environment», фильтр по `layer=UI` |
| Протухший токен | 3 | failed | `Expected status 200, got 401: token expired` | Проблема тестовых данных, а не продукта |
| Одиночные | 2 | broken / failed | `TypeError: ... reading 'discountCode'`, `expected 'Draft' to equal 'Published'` | Не должны ни с чем группироваться |
| Флаки | 2 | failed на нечётных | `push notification ... within 5000 ms` | Кандидаты на Mute |

Атрибуты для фильтров: `feature`, `story`, `layer` (API/UI), `severity`, `owner`
(anna.petrova, ivan.sidorov, maria.kim, kategonc), `tag` (smoke, regression, flaky)
и кастомный лейбл `component` (payments, pricing, orders, catalog, auth, notifications, admin-ui и др.).

---

## Запуск

Actions → **Resolutions demo** → Run workflow. Запустите 2–3 раза, чтобы появилась история
и флаки начали мигать. Лончи называются `Resolutions demo #N`.

Проект в TestOps тот же, что у `demo.yml` (секрет `ALLURE_PROJECT_ID`).
Для отдельного проекта впишите его ID в `.github/workflows/resolutions.yml`.

Локально:

```bash
npx cypress run --spec "cypress/e2e/5-resolutions/**/*.cy.js"
```

Темп: `CYPRESS_STEP_DELAY=50` быстрее, `CYPRESS_STEP_DELAY=500` медленнее.

---

## Error categories

Project settings → Error categories:

| Категория | Regex по message |
|---|---|
| Infrastructure: service down | `.*ECONNREFUSED.*` |
| Product: wrong price | `.*Price mismatch.*` |
| Environment: UI timeout | `.*Timed out retrying after \d+ms.*` |
| Test data: expired token | `.*401.*token expired.*` |

---

## Чек-лист по задаче

- [ ] Resolutions: падения payments-service собираются в одну группу, хотя у них разные фичи и владельцы
- [ ] Resolutions: группировка по error categories
- [ ] Resolutions: фильтр по атрибутам TR (`owner`, `component`, `layer`, `tag`)
- [ ] Resolutions: фильтр по тексту ошибки, все 4 `Price mismatch` при разных числах
- [ ] Resolutions: правило, которое автоматически вешает дефект на все `ECONNREFUSED`
- [ ] Resolutions: правило Mute для флаки-тестов
- [ ] Error Categories → выбрать категорию → assign for triage
- [ ] Дерево TR → отфильтровать → выделить → assign for triage
