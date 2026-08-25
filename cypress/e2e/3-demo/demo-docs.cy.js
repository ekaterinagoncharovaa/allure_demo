import * as allure from "allure-js-commons";

context("Demo: living documentation", () => {
  beforeEach(() => {
    allure.epic("Telecom Portal");
    allure.feature("Self-Service");
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
      expect(true).to.eq(true);
    });

    allure.step("Select the current billing period", () => {
      expect(true).to.eq(true);
    });

    allure.step("Verify the invoice totals", () => {
      expect(true).to.eq(true);
    });

    allure.step("Check the invoice PDF is downloadable", () => {
      expect(true).to.eq(true);
    });
  });
});
