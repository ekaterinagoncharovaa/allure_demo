import * as allure from "allure-js-commons";
const { it } = require("mocha");
const allure = require("allure-js-commons");

it("Subscriber can switch to a different tariff plan @allure.id:75553", async() => {
    await allure.owner("kategonc");
    await allure.step("Open the tariff plans page", async () => {});
    await allure.step("Select the Unlimited Plus plan", async () => {});
    await allure.step("Confirm the switch", async () => {});
    await allure.step("Verify the new plan is shown as active", async () => {});
});
