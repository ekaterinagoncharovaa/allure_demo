import * as allure from "allure-js-commons";
const { casesFor, verdictFor } = require("./_catalogue");

const SEVERITY = { integration: "critical", api: "normal", ui: "minor", e2e: "blocker" };

// шум, который презентующий вычищает регуляркой при создании automation rule
const reqId = () => Math.random().toString(16).slice(2, 8);

export function generate(key) {
  const cases = casesFor(key);
  if (!cases.length) return;

  context(`Demo: ${cases[0].feature}`, () => {
    cases.forEach((testCase) => {
      it(testCase.title, { retries: 0 }, () => {
        const verdict = verdictFor(testCase);

        allure.epic("Telecom Portal");
        allure.feature(testCase.feature);
        allure.story(testCase.key);
        allure.owner(testCase.owner);
        allure.layer(testCase.layer);
        allure.tags(testCase.layer, testCase.key);
        allure.severity(verdict ? verdict.severity : SEVERITY[testCase.layer]);
        Object.entries(testCase.params).forEach(([name, value]) =>
          allure.parameter(name, String(value)),
        );

        allure.step("prepare the environment", () => {
          expect(true).to.eq(true);
        });
        allure.step("run the scenario", () => {
          expect(true).to.eq(true);
        });
        allure.step("verify the result", () => {
          expect(true).to.eq(true);
        });

        // Проверка вынесена из шага намеренно: так падение гарантированно
        // доезжает до Cypress, а не теряется внутри асинхронного step().
        if (verdict) {
          const message = verdict.noisy
            ? `${verdict.message} (request-id: ${reqId()})`
            : verdict.message;
          expect(false, message).to.eq(true);
        }
      });
    });
  });
}
