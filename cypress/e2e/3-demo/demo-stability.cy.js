import * as allure from "allure-js-commons";

context('Demo: failures and flaky tests', () => {
  beforeEach(() => {
    allure.epic("Demo Scenarios");
    allure.feature("Stability Showcase");
  })

  it('shows the full todo list after adding an item', () => {
    allure.story("Genuine product bug");
    allure.severity("critical");
    cy.visit('/todo');
    cy.get('.new-todo').type('Ship the release{enter}');
    // BUG (intentional): only 3 items exist, so this always fails
    cy.get('.todo-list li').should('have.length', 4);
  })

  it('shows the correct page title', () => {
    allure.story("Genuine product bug");
    // Intentionally wrong expected title — always fails
    cy.title().should('eq', 'Cypress Kitchen Sink v2');
  })

  it('loads the dashboard within SLA', () => {
    allure.story("Infrastructure hiccups");
    cy.visit('/');
    const run = Number(Cypress.env('RUN_PARITY') || 0);
    // Red on even runs, green on odd runs -> alternating history = classic flake
    expect(run % 2, 'load time is under the SLA').to.eq(1);
  })

  it('receives the webhook callback in time', () => {
    allure.story("Infrastructure hiccups");
    const run = Number(Cypress.env('RUN_PARITY') || 0);
    // Red on odd runs, green on even runs (opposite parity)
    expect(run % 2, 'callback arrived before the timeout').to.eq(0);
  })
})
