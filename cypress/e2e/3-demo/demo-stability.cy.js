import * as allure from "allure-js-commons";

/**
 * Demo stand: one failure cluster + two flaky tests.
 *
 * The four billing tests fail with the SAME error message plus a
 * run-specific request id. That is what makes the "write a regex, strip
 * the noise, link them all to one defect" moment real rather than staged.
 *
 * Issue links are declared inside the test body (not in beforeEach):
 * hooks and tests are separate contexts, and metadata set in a hook does
 * not reliably attach to the result.
 *
 * ISSUE NUMBERS: change the two constants below if your tickets get
 * different numbers on GitHub.
 */

const ISSUE_BILLING = 4; // "Billing service unreachable from staging"

const issueUrl = (n) =>
  `https://github.com/ekaterinagoncharovaa/allure_demo/issues/${n}`;

// Run-specific noise. The presenter strips this part in the regex.
const reqId = () => Math.random().toString(16).slice(2, 8);

const BILLING_ERROR =
  "connect ECONNREFUSED 10.0.4.12:8443 - telecom-billing-service unreachable";

context("Demo: billing integration", () => {
  beforeEach(() => {
    allure.epic("Telecom Portal");
    allure.feature("Billing");
    allure.owner("Ekaterina Goncharova");
    allure.story("Billing service integration");
    allure.tags("regression", "billing", "integration");
  });

  const SCENARIOS = [
    ["invoice history loads for the current period", "critical"],
    ["payment methods are listed for the subscriber", "critical"],
    ["tariff change is accepted by the billing service", "normal"],
    ["billing export returns a signed document", "minor"],
  ];

  SCENARIOS.forEach(([title, severity]) => {
    it(title, { retries: 0 }, () => {
      allure.severity(severity);
      // One root cause, four symptoms -> all four point at the same ticket.
      allure.issue(
        issueUrl(ISSUE_BILLING),
        `DEMO-${ISSUE_BILLING}: billing service unreachable from staging`,
      );
      allure.description(
        "Calls the billing service and verifies the response payload. " +
          "**Known issue**: the service is unreachable from this environment.",
      );
      expect(false, `${BILLING_ERROR} (request-id: ${reqId()})`).to.eq(true);
    });
  });
});

// No issue link here on purpose: a flaky test is not a known problem with a
// ticket, it is a test we have not decided about yet. It gets muted, not filed.
context("Demo: flaky tests", () => {
  beforeEach(() => {
    allure.epic("Telecom Portal");
    allure.feature("Self-Service");
    allure.owner("Ekaterina Goncharova");
    allure.story("Infrastructure hiccups");
  });

  it("loads the dashboard within SLA", () => {
    allure.severity("minor");
    allure.tags("performance", "flaky-candidate");
    allure.description(
      "Checks that the dashboard loads within the SLA. " +
        "Occasionally fails due to slow cold starts on the infrastructure side.",
    );
    cy.visit("/");
    const run = Number(Cypress.env("RUN_PARITY") || 0);
    // Red on even runs, green on odd runs -> alternating history
    expect(run % 2, "load time is under the SLA").to.eq(1);
  });

  it("receives the webhook callback in time", () => {
    allure.severity("minor");
    allure.tags("integration", "flaky-candidate");
    allure.description(
      "Waits for the webhook callback within the timeout. " +
        "Occasionally fails due to network latency between services.",
    );
    const run = Number(Cypress.env("RUN_PARITY") || 0);
    // Red on odd runs, green on even runs (opposite parity)
    expect(run % 2, "callback arrived before the timeout").to.eq(0);
  });
});
