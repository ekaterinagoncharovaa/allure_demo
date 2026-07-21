import * as allure from "allure-js-commons";

context('Demo: failures and flaky tests', () => {
  beforeEach(() => {
    allure.epic("Demo Scenarios");
    allure.feature("Stability Showcase");
    allure.owner("Ekaterina Goncharova");
  })

  it('shows the full todo list after adding an item', () => {
    allure.story("Genuine product bug");
    allure.severity("critical");
    allure.tags("regression", "todo", "ui");
    allure.description("Adds a new item to the todo list and verifies the full list length. **Known product bug**: the newly added item is not rendered.");
    allure.issue("https://github.com/ekaterinagoncharovaa/allure_demo/issues/2", "DEMO-2: new todo item not rendered");
    cy.visit('/todo');
    cy.get('.new-todo').type('Ship the release{enter}');
    // BUG (intentional): only 3 items exist, so this always fails
    cy.get('.todo-list li').should('have.length', 4);
  })

  it('shows the correct page title', () => {
    allure.story("Genuine product bug");
    allure.severity("normal");
    allure.tags("regression", "ui");
    allure.description("Verifies the page title matches the product spec. **Known product bug**: the title was not updated for v2.");
    allure.issue("https://github.com/ekaterinagoncharovaa/allure_demo/issues/3", "DEMO-3: page title not updated to v2");
    // Intentionally wrong expected title — always fails
    cy.title().should('eq', 'Cypress Kitchen Sink v2');
  })

  it('loads the dashboard within SLA', () => {
    allure.story("Infrastructure hiccups");
    allure.severity("minor");
    allure.tags("performance", "flaky-candidate");
    allure.description("Checks that the dashboard loads within the SLA. Occasionally fails due to slow cold starts on the infrastructure side.");
    cy.visit('/');
    const run = Number(Cypress.env('RUN_PARITY') || 0);
    // Red on even runs, green on odd runs -> alternating history = classic flake
    expect(run % 2, 'load time is under the SLA').to.eq(1);
  })

  it('receives the webhook callback in time', () => {
    allure.story("Infrastructure hiccups");
    allure.severity("minor");
    allure.tags("integration", "flaky-candidate");
    allure.description("Waits for the webhook callback within the timeout. Occasionally fails due to network latency between services.");
    const run = Number(Cypress.env('RUN_PARITY') || 0);
    // Red on odd runs, green on even runs (opposite parity)
    expect(run % 2, 'callback arrived before the timeout').to.eq(0);
  })
})
