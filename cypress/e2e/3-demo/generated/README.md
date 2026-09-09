# Сгенерированные демо-тесты

480 тестов Telecom Portal, падает ~100 (20%). Прогон около минуты — браузер никуда
не ходит, тесты чисто ассертные.

## Кластеры падений

480 тестов, падает **126** — это 26%. Внутри кластера **одинаковое сообщение об ошибке**,
поэтому одно automation rule закрывает весь кластер.

| Кластер | Тестов | Сообщение | Регулярка для правила |
|---|---|---|---|
| billing-gateway | **36** | `connect ECONNREFUSED 10.0.4.12:8443 - telecom-billing-service unreachable (request-id: a1b2c3)` | `.*telecom-billing-service unreachable.*` |
| profile-schema | 26 | `SchemaValidationError: required field 'segment_code' is missing in subscriber profile` | `.*required field 'segment_code' is missing.*` |
| tariff-cache | 20 | `AssertionError: tariff cache is stale, served revision 41 instead of 42` | `.*tariff cache is stale.*` |
| sms-provider | 16 | `SmsProviderError: gateway returned 503 Service Unavailable` | `.*gateway returned 503.*` |
| session-timeout | 12 | `TimeoutError: session expired, redirected to /login` | `.*session expired.*` |
| одиночные | 6 | у каждого своё | — |
| флаки | 10 | `flaky: timing-dependent assertion failed` | не заводим дефект, мьютим |

У **billing-gateway** в конце сообщения болтается случайный `request-id` — тот самый случай,
когда на демо надо написать регулярку и отрезать шум. Остальные кластеры ловятся по любой
устойчивой части текста.

## Флаки и перезапуск

Поведение зависит от `CYPRESS_RUN_PARITY` (в CI это `github.run_number`):

* **четыре** первых флаки красные на **чётном** прогоне и зелёные на следующем, нечётном —
  это те, что «починятся» после перезапуска на демо;
* остальные шесть мигают редко и независимо друг от друга.

**Перед демо посмотри номер последнего прогона в Actions.** Нужно, чтобы демо-прогон
попал на чётный номер: тогда после перезапуска из TestOps ровно два теста починятся,
а остальные останутся красными. Если номер нечётный — прогони workflow один раз вхолостую.

## Запуск

```bash
npm run local:run:demo                       # только демо-спеки
CYPRESS_DEMO_SCRIPT=off npm run local:run:demo   # всё зелёное
```

В CI — workflow `demo` (`.github/workflows/demo.yml`), запуск руками через Run workflow.

## История для трендов

Тренды и пометка «flaky» появятся только после нескольких прогонов. За день-два до демо
запусти workflow 5–6 раз подряд: кластеры и флаки будут выглядеть по-разному от прогона
к прогону.
