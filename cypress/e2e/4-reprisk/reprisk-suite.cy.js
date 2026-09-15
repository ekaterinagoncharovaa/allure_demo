import * as allure from "allure-js-commons";
import { CATALOGUE, verdictFor } from "./_reprisk-catalogue";

// Второй прогон: TestOps передаёт ALLURE_JOB_RUN_ID, workflow прокидывает его сюда.
const IS_RERUN = String(Cypress.env("IS_RERUN")).toLowerCase() === "true";

// Ритм прогона. 74 теста примерно за полторы минуты — успеваешь говорить,
// но клиент не скучает. Меняется через CYPRESS_STEP_DELAY.
const STEP_DELAY = Number(Cypress.env("STEP_DELAY") || 350);

const BY_FEATURE = CATALOGUE.reduce((acc, item) => {
  (acc[item.feature] = acc[item.feature] || []).push(item);
  return acc;
}, {});

Object.entries(BY_FEATURE).forEach(([feature, items]) => {
  describe(`RepRisk · ${feature}`, () => {
    items.forEach((item) => {
      it(item.title, () => {
        allure.epic("RepRisk platform");
        allure.feature(item.feature);
        allure.story(item.story);
        allure.layer(item.layer);
        allure.severity(item.severity);
        allure.owner(item.owner);
        allure.tags(...item.tags);
        allure.parameter("environment", "staging");
        allure.parameter("dataset", "demo-companies-2026");

        allure.step("Sign in to the RepRisk platform as an analyst", () => {});
        allure.step(`When I ${item.action}`, () => {});

        cy.wait(STEP_DELAY);

        allure.step(`Then ${item.title.toLowerCase()}`, () => {});

        cy.wait(STEP_DELAY).then(() => {
          const verdict = verdictFor(item, IS_RERUN);
          if (!verdict.ok) {
            throw new Error(verdict.message);
          }
        });
      });
    });
  });
});
