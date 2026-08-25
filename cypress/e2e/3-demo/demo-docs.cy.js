import * as allure from "allure-js-commons";

/**
 * Living-documentation demo.
 *
 * This test exists to be READ, not to catch bugs. It passes, and its
 * value on the call is that the test case generated from it in TestOps
 * is a readable document: named steps, owner, severity, description.
 *
 * This is the "before" version. The docs-demo branch changes three
 * things in it, and the test case follows without anyone touching it.
 */

context("Demo: living documentation", () => {
  beforeEach(() => {
    allure.epic("Telecom Portal");
    allure.feature("Billing");
    allure.owner("Ekaterina Goncharova");
    allure.story("Invoice history");
  });

  it("subscriber can view the invoice history", () => {
    allure.severity("critical");
    allure.tags("regression", "billing", "documentation");
    allure.description(
      "A subscriber opens the billing section and reviews invoices for " +
        "the current period. Verifies that the list is rendered and the " +
        "totals are consistent with the period selected.",
    );

    allure.step("Open the billing page", () => {
      cy.visit("/");
    });

    allure.step("Request invoices for the current period", () => {
      cy.get("body").should("exist");
    });

    allure.step("Verify the invoice totals", () => {
      expect(true).to.eq(true);
    });
  });
});
