# Распаковать в корень репозитория allure_demo

```
cypress/e2e/3-demo/generated/   480 тестов, 5 кластеров, 10 флаки
cypress/e2e/3-demo/generated/JIRA.md   подключение Jira + порядок на демо
.github/workflows/demo.yml      workflow только для демо-спеков, ~1 минута
package.json                    добавлены два скрипта
```

Дальше:

```bash
npm run local:run:demo     # проверить: должно падать ~126 из 480
git add -A && git commit -m "demo stand" && git push
```
