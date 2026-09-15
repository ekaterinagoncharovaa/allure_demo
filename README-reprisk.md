# Стенд автотестов для демо RepRisk

75 тестов в доменах RepRisk: компании, инциденты, вотчлисты, отчёты, публичный API, права доступа.

**Первый прогон:** 20 красных — 11 в дефекте `report-service`, 6 в дефекте `esg-taxonomy`, 3 флаки.
**Rerun из TestOps:** 17 красных, флаки зеленеют.

Тесты не ходят в приложение — никакого сервера поднимать не надо, `start-test` не нужен.

---

## Установка

Открой терминал и вставляй по одной команде.

```bash
cd "$(find ~ -maxdepth 5 -type d -name allure_demo | head -1)" && pwd
```

```bash
unzip -o ~/Downloads/reprisk-stand.zip -d .
```

```bash
ls cypress/e2e/4-reprisk/
```

Должно показать два файла: `_reprisk-catalogue.js` и `reprisk-suite.cy.js`.

---

## Скрипт в package.json

В блок `"scripts"` добавь строку:

```json
"cy:run:reprisk": "cypress run --spec \"cypress/e2e/4-reprisk/**/*.cy.js\""
```

Проверить локально:

```bash
npx cypress run --spec "cypress/e2e/4-reprisk/**/*.cy.js"
```

Должно быть `75 tests, 20 failing`.

---

## Workflow

Не пиши новый — скопируй рабочий и поправь три места.

```bash
cp .github/workflows/demo.yml .github/workflows/reprisk.yml
```

В `reprisk.yml` меняешь:

1. `name:` → `RepRisk demo`
2. `ALLURE_PROJECT_ID` → `15889`
3. строку запуска → `allurectl watch -- npm run cy:run:reprisk`

Строку `CYPRESS_IS_RERUN: ${{ github.event.inputs.ALLURE_JOB_RUN_ID != '' }}` **оставь как есть** — именно она чинит флаки на перезапуске.

---

## Коммит

```bash
git add -A && git commit --no-verify -m "RepRisk demo suite" && git push
```

---

## Что показывать на демо

**Дефект `report-service`** — 11 падений, в каждом свой `request-id`. Заводишь дефект по регулярке, которая игнорирует хвост:

```
ReportGenerationError: report-service returned 503.*
```

Это самый сильный момент: одна регулярка съедает одиннадцать красных тестов.

**Дефект `esg-taxonomy`** — 6 падений, сообщение одинаковое, матчер по точному совпадению. Показывает, что не всегда нужна регулярка.

**Флаки** — 3 теста. Падают на первом прогоне, зеленеют на rerun. После двух-трёх прогонов TestOps сам пометит их как flaky.

**Связь с ручным кейсом** — первый тест называется ровно так же, как ручной кейс #947909: `Company search returns an exact match by name and identifier`. Привяжи к нему автоматизацию, и в History кейса будут и ручные прогоны, и автоматические. Это акт 8 сценария.

**Темп прогона** — около полутора минут. Ускорить: `CYPRESS_STEP_DELAY=100`. Замедлить, если хочешь больше времени на рассказ: `CYPRESS_STEP_DELAY=800`.
