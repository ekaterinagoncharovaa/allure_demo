import * as allure from "allure-js-commons";

/**
 * Demo regression suite.
 *
 * Purpose: give the demo stand a realistic failure volume so the
 * "N failures is not N problems" step actually has something to collapse.
 *
 * Produces 120 tests, of which 52 fail across 4 error signatures:
 *   20 x infrastructure  — one upstream service unreachable
 *   14 x authentication  — expired service token
 *   10 x configuration   — feature toggle off on the environment
 *    8 x product bugs    — genuinely distinct, one investigation each
 *
 * The first three clusters share a stable error message plus a
 * run-specific suffix (request id), which is what the
 * "write a regex, strip the noise, link 20 results to one defect"
 * moment needs.
 *
 * SEVERITY is assigned deliberately, not randomly, so the severity tree
 * is a second useful lens rather than a duplicate of the categories:
 *
 *            blocker  critical  normal  minor  trivial   total
 *   infra          0         2      10      6        2      20
 *   auth           0         3       7      4        0      14
 *   config         0         1       5      4        0      10
 *   product        3         3       2      0        0       8
 *   ------------------------------------------------------------
 *   FAILING        3         9      24     14        2      52
 *   passing        2        10      33     17        6      68
 *
 * The point of that shape: every release-blocking failure is a product
 * bug. The 20-test infrastructure cluster contains none. So the two
 * lenses answer different questions — "how many problems are there"
 * (categories) and "which one do I open first" (severity) — and
 * filtering to blocker+critical+failed leaves 12 tests out of 52.
 *
 * retries: 0 on generated tests — the flaky story lives in
 * demo-stability.cy.js, and retry noise here would muddy the counts.
 */

const OPTS = { retries: 0 };

// Short pseudo-random suffix so each failure message carries run-specific
// noise. This is the part the presenter strips in the regex.
const reqId = () => Math.random().toString(16).slice(2, 8);

const AREAS = [
  {
    epic: "Telecom Portal",
    feature: "Billing",
    owner: "Ekaterina Goncharova",
    stories: ["Invoice history", "Payment methods", "Tariff change"],
  },
  {
    epic: "Telecom Portal",
    feature: "Subscriber Account",
    owner: "Ekaterina Goncharova",
    stories: ["Profile", "SIM management", "Contact details"],
  },
  {
    epic: "Telecom Portal",
    feature: "Self-Service",
    owner: "Demo Team",
    stories: ["Top-up", "Package activation", "Support tickets"],
  },
  {
    epic: "Back Office",
    feature: "Reporting",
    owner: "Demo Team",
    stories: ["Daily revenue", "Churn export"],
  },
];

const pick = (arr, i) => arr[i % arr.length];

/**
 * Explicit severity sequences per cluster.
 * Written out rather than computed so the totals stay quotable:
 * if you say "three blockers" on a call, it is three, every run.
 */
const SEVERITY = {
  // 20 infra failures: no blockers — an unreachable service is not a
  // release-blocking product defect, and the demo point depends on that.
  infra: [
    "critical", "normal", "normal", "minor", "normal",
    "critical", "minor", "normal", "trivial", "normal",
    "minor", "normal", "minor", "normal", "trivial",
    "minor", "normal", "normal", "minor", "normal",
  ],
  // 14 auth failures
  auth: [
    "critical", "normal", "minor", "normal", "critical",
    "normal", "minor", "normal", "normal", "critical",
    "minor", "normal", "minor", "normal",
  ],
  // 10 config failures
  config: [
    "critical", "normal", "minor", "normal", "minor",
    "normal", "minor", "normal", "minor", "normal",
  ],
  // 68 passing tests, spread across all five levels
  stable: [
    "normal", "minor", "critical", "normal", "trivial",
    "normal", "minor", "normal", "critical", "minor",
    "normal", "blocker", "normal", "minor", "normal",
    "trivial", "critical", "normal", "minor", "normal",
    "normal", "minor", "critical", "normal", "trivial",
    "normal", "minor", "normal", "critical", "minor",
    "normal", "blocker", "normal", "minor", "normal",
    "trivial", "critical", "normal", "minor", "normal",
    "normal", "minor", "critical", "normal", "trivial",
    "normal", "minor", "normal", "critical", "minor",
    "normal", "normal", "normal", "minor", "normal",
    "trivial", "critical", "normal", "minor", "normal",
    "normal", "minor", "critical", "normal", "normal",
    "normal", "minor", "normal",
  ],
};

/** Applies the standard label set to the current test. */
function label(area, story, severity, tags, description) {
  allure.epic(area.epic);
  allure.feature(area.feature);
  allure.story(story);
  allure.owner(area.owner);
  allure.severity(severity);
  allure.tags(...tags);
  allure.label("release", Cypress.env("RELEASE") || "2026.08");
  allure.label("microservice", area.feature.toLowerCase().replace(/\s+/g, "-"));
  if (description) allure.description(description);
}

// ---------------------------------------------------------------------------
// Cluster 1 — infrastructure: 20 failures, one shared root cause
// ---------------------------------------------------------------------------

context("Regression: Billing integration", () => {
  SEVERITY.infra.forEach((severity, idx) => {
    const i = idx + 1;
    const area = pick(AREAS, i);
    it(`billing service responds for scenario ${i}`, OPTS, () => {
      label(
        area,
        pick(area.stories, i),
        severity,
        ["regression", "integration", "billing"],
        "Calls the billing service and verifies the response payload.",
      );
      throw new Error(
        `connect ECONNREFUSED 10.0.4.12:8443 - telecom-billing-service unreachable (request-id: ${reqId()}, attempt 1)`,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Cluster 2 — authentication: 14 failures, one shared root cause
// ---------------------------------------------------------------------------

context("Regression: Authenticated journeys", () => {
  SEVERITY.auth.forEach((severity, idx) => {
    const i = idx + 1;
    const area = pick(AREAS, i + 1);
    it(`authenticated user completes journey ${i}`, OPTS, () => {
      label(
        area,
        pick(area.stories, i),
        severity,
        ["regression", "auth"],
        "Signs in as a subscriber and walks through the journey.",
      );
      throw new Error(
        `401 Unauthorized: service token expired at 2026-08-04T05:12:44Z (session: ${reqId()})`,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Cluster 3 — configuration: 10 failures, one shared root cause
// ---------------------------------------------------------------------------

context("Regression: Checkout configuration", () => {
  SEVERITY.config.forEach((severity, idx) => {
    const i = idx + 1;
    const area = pick(AREAS, i + 2);
    it(`checkout flow variant ${i} is available`, OPTS, () => {
      label(
        area,
        pick(area.stories, i),
        severity,
        ["regression", "checkout", "config"],
        "Verifies the checkout variant is enabled on this environment.",
      );
      expect(
        false,
        `feature toggle 'featureToggle.newCheckout' is disabled on env=staging (evaluated: ${reqId()})`,
      ).to.eq(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Cluster 4 — genuine product bugs: 8 distinct failures.
// This is where every blocker lives.
// ---------------------------------------------------------------------------

const PRODUCT_BUGS = [
  ["invoice total excludes VAT for prepaid tariffs", "blocker", "Billing"],
  ["tariff change is charged twice on retry", "blocker", "Billing"],
  ["SIM swap leaves the old SIM active for 60s", "blocker", "Subscriber Account"],
  ["tariff change confirmation email is not sent", "critical", "Billing"],
  ["daily revenue report double-counts refunds", "critical", "Reporting"],
  ["package activation is not idempotent on retry", "critical", "Self-Service"],
  ["top-up receipt shows the wrong currency symbol", "normal", "Self-Service"],
  ["churn export truncates names over 64 chars", "normal", "Reporting"],
];

context("Regression: Known product defects", () => {
  PRODUCT_BUGS.forEach(([title, severity, featureName], i) => {
    const area = AREAS.find((a) => a.feature === featureName) || AREAS[0];
    it(`${title}`, OPTS, () => {
      label(
        area,
        pick(area.stories, i),
        severity,
        ["regression", "product-bug"],
        `Product behaviour does not match the specification: ${title}.`,
      );
      expect(false, `product behaviour mismatch: ${title}`).to.eq(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Passing tests — so the pass rate looks like a real suite, not a disaster,
// and so the severity tree has healthy branches as well as red ones.
// ---------------------------------------------------------------------------

context("Regression: Stable coverage", () => {
  SEVERITY.stable.forEach((severity, idx) => {
    const i = idx + 1;
    const area = pick(AREAS, i);
    it(`stable scenario ${i}`, OPTS, () => {
      label(
        area,
        pick(area.stories, i),
        severity,
        ["regression", "smoke"],
        "Stable regression scenario, part of the weekly scope.",
      );
      expect(true).to.eq(true);
    });
  });
});
