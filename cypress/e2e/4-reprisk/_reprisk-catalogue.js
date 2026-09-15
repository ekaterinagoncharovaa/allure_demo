/**
 * Каталог автотестов для демо RepRisk.
 *
 * Здесь нет обращений к приложению: тесты детерминированные, чтобы прогон
 * на демо всегда выглядел одинаково. Меняется только одно — второй запуск
 * (rerun из TestOps) чинит флаки-тесты.
 *
 * Проверено: первый прогон — 75 тестов, 20 красных
 *            (11 report-service + 6 esg-taxonomy + 3 флаки)
 *            rerun из TestOps — 75 тестов, 17 красных (флаки позеленели)
 */

// --- причины падений -------------------------------------------------------

// Шумный дефект: в каждом сообщении свой request-id.
// На демо показываешь, что матчер по регулярке всё равно собирает их в один дефект.
const REPORT_SERVICE = {
  cluster: "report-service",
  noisy: true,
  message: (id) =>
    `ReportGenerationError: report-service returned 503 for template "due-diligence" (request-id: ${id})`,
};

// Стабильный дефект: сообщение одинаковое, матчер по точному совпадению.
const ESG_TAXONOMY = {
  cluster: "esg-taxonomy",
  noisy: false,
  message: () =>
    `TaxonomyMappingError: unknown ESG issue code 'ENV-014' in issue taxonomy v3`,
};

// Флаки: падает на первом прогоне, зеленеет на перезапуске.
const FLAKY_TIMEOUT = {
  cluster: "flaky",
  noisy: false,
  message: () =>
    `AssertionError: expected the alert to be delivered within 5000 ms, but it was not`,
};

// --- вспомогательное -------------------------------------------------------

function requestId(seed) {
  let h = 0x811c9dc5;
  const s = `reprisk-${seed}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const OWNERS = ["kategonc", "qa.zurich", "qa.automation"];

let seq = 0;
function t(title, opts) {
  seq += 1;
  return {
    index: seq,
    title,
    feature: opts.feature,
    story: opts.story,
    layer: opts.layer,
    severity: opts.severity || "normal",
    tags: opts.tags || ["regression"],
    owner: OWNERS[seq % OWNERS.length],
    fail: opts.fail || null,
    flaky: Boolean(opts.flaky),
    action: opts.action,
  };
}

// --- каталог ---------------------------------------------------------------

const F_PROFILE = "Company Profile";
const F_INCIDENTS = "Risk Incidents";
const F_WATCHLISTS = "Watchlists";
const F_REPORTING = "Reporting";
const F_API = "Public API";
const F_ACCESS = "Access control";

export const CATALOGUE = [
  // --- Company Profile / Search (8) — все зелёные --------------------------
  // Название первого теста совпадает с ручным кейсом #947909: к нему
  // привязывается автоматизация, чтобы показать "один кейс — два способа".
  t("Company search returns an exact match by name and identifier", {
    feature: F_PROFILE, story: "Search", layer: "UI", severity: "critical",
    tags: ["smoke"], action: "search for a company by its full legal name",
  }),
  t("Search by ISIN resolves to a single company", {
    feature: F_PROFILE, story: "Search", layer: "UI", severity: "critical",
    tags: ["smoke"], action: "search by ISIN",
  }),
  t("Search by LEI resolves to a single company", {
    feature: F_PROFILE, story: "Search", layer: "UI",
    action: "search by LEI",
  }),
  t("Partial name search ranks results by relevance", {
    feature: F_PROFILE, story: "Search", layer: "UI",
    action: "search by the first word of a company name",
  }),
  t("Company search is case-insensitive", {
    feature: F_PROFILE, story: "Search", layer: "UI", severity: "minor",
    action: "search in lower case",
  }),
  t("Trailing whitespace in the query does not affect the result", {
    feature: F_PROFILE, story: "Search", layer: "UI", severity: "minor",
    action: "search with a trailing space",
  }),
  t("Unknown company returns an empty state with a hint", {
    feature: F_PROFILE, story: "Search", layer: "UI",
    action: "search for a company that does not exist",
  }),
  t("Recently viewed companies appear in the search dropdown", {
    feature: F_PROFILE, story: "Search", layer: "UI", severity: "minor",
    action: "open the search dropdown",
  }),

  // --- Company Profile / Overview (7) — все зелёные ------------------------
  t("Profile header shows country, sector and identifiers", {
    feature: F_PROFILE, story: "Profile overview", layer: "UI",
    tags: ["smoke"], action: "open a company profile",
  }),
  t("Current RepRisk Index is displayed with its update date", {
    feature: F_PROFILE, story: "Profile overview", layer: "UI", severity: "critical",
    tags: ["smoke"], action: "read the current index value",
  }),
  t("Peak RRI for the last two years is displayed", {
    feature: F_PROFILE, story: "Profile overview", layer: "UI",
    action: "read the peak index value",
  }),
  t("Rating letter grade matches the index band", {
    feature: F_PROFILE, story: "Profile overview", layer: "UI", severity: "critical",
    action: "compare the rating against the index",
  }),
  t("Subsidiaries are listed on the corporate structure tab", {
    feature: F_PROFILE, story: "Profile overview", layer: "UI",
    action: "open the corporate structure tab",
  }),
  t("Profile shows the number of related incidents", {
    feature: F_PROFILE, story: "Profile overview", layer: "UI",
    action: "read the incident counter",
  }),
  t("Company without a score renders a not-rated state", {
    feature: F_PROFILE, story: "Profile overview", layer: "UI", severity: "minor",
    action: "open a profile of an unrated company",
  }),

  // --- Company Profile / Score history (5) — все зелёные -------------------
  t("Score history chart renders 24 months by default", {
    feature: F_PROFILE, story: "Score history", layer: "UI",
    tags: ["smoke"], action: "open the score history chart",
  }),
  t("Switching the period to 12 months redraws the chart", {
    feature: F_PROFILE, story: "Score history", layer: "UI",
    action: "switch the period selector",
  }),
  t("Hovering a data point shows the exact score and date", {
    feature: F_PROFILE, story: "Score history", layer: "UI", severity: "minor",
    action: "hover over a data point",
  }),
  t("Score history can be exported as CSV", {
    feature: F_PROFILE, story: "Score history", layer: "UI",
    action: "export the history",
  }),
  t("Empty history renders a placeholder instead of an empty chart", {
    feature: F_PROFILE, story: "Score history", layer: "UI", severity: "minor",
    action: "open the history of a company without data",
  }),

  // --- Risk Incidents / Feed (7) — один флаки ------------------------------
  t("Incident feed is sorted by publication date", {
    feature: F_INCIDENTS, story: "Incident feed", layer: "UI",
    tags: ["smoke"], action: "open the incident feed",
  }),
  t("Filtering the feed by severity narrows the result set", {
    feature: F_INCIDENTS, story: "Incident feed", layer: "UI",
    action: "apply a severity filter",
  }),
  t("Filtering by ESG issue returns only tagged incidents", {
    feature: F_INCIDENTS, story: "Incident feed", layer: "UI",
    action: "apply an ESG issue filter",
  }),
  t("Feed pagination keeps the active filters", {
    feature: F_INCIDENTS, story: "Incident feed", layer: "UI",
    action: "go to the second page",
  }),
  t("Incident counter matches the applied filters", {
    feature: F_INCIDENTS, story: "Incident feed", layer: "UI",
    action: "compare the counter against the list",
  }),
  t("Feed loads the next page on scroll", {
    feature: F_INCIDENTS, story: "Incident feed", layer: "UI",
    flaky: true, fail: FLAKY_TIMEOUT,
    action: "scroll to the bottom of the feed",
  }),
  t("Clearing all filters restores the full feed", {
    feature: F_INCIDENTS, story: "Incident feed", layer: "UI", severity: "minor",
    action: "clear the filters",
  }),

  // --- Risk Incidents / Details (6) — один флаки ---------------------------
  t("Incident card shows the publication date and source link", {
    feature: F_INCIDENTS, story: "Incident details", layer: "UI", severity: "critical",
    tags: ["smoke"], action: "open an incident card",
  }),
  t("Severity level is displayed on the incident card", {
    feature: F_INCIDENTS, story: "Incident details", layer: "UI",
    action: "read the severity level",
  }),
  t("At least one ESG issue tag is assigned to an incident", {
    feature: F_INCIDENTS, story: "Incident details", layer: "UI",
    action: "read the ESG issue tags",
  }),
  t("Related companies are listed on the incident card", {
    feature: F_INCIDENTS, story: "Incident details", layer: "UI",
    action: "read the related companies block",
  }),
  t("Source link opens the original publication", {
    feature: F_INCIDENTS, story: "Source verification", layer: "UI",
    flaky: true, fail: FLAKY_TIMEOUT,
    action: "follow the source link",
  }),
  t("Sharing an incident produces a permanent link", {
    feature: F_INCIDENTS, story: "Incident details", layer: "UI", severity: "minor",
    action: "share the incident",
  }),

  // --- Watchlists (8) — один флаки ----------------------------------------
  t("A company can be added to an existing watchlist", {
    feature: F_WATCHLISTS, story: "Watchlist management", layer: "UI", severity: "critical",
    tags: ["smoke"], action: "add a company to a watchlist",
  }),
  t("A new watchlist can be created from the company profile", {
    feature: F_WATCHLISTS, story: "Watchlist management", layer: "UI",
    action: "create a watchlist",
  }),
  t("A company can be removed from a watchlist", {
    feature: F_WATCHLISTS, story: "Watchlist management", layer: "UI",
    action: "remove a company from a watchlist",
  }),
  t("Watchlist shows the current score for every company", {
    feature: F_WATCHLISTS, story: "Watchlist management", layer: "UI",
    action: "open a watchlist",
  }),
  t("A watchlist can be shared with another analyst", {
    feature: F_WATCHLISTS, story: "Watchlist management", layer: "UI",
    action: "share a watchlist",
  }),
  t("A new incident on a watched company creates an alert", {
    feature: F_WATCHLISTS, story: "Alerts", layer: "UI", severity: "critical",
    tags: ["smoke"], flaky: true, fail: FLAKY_TIMEOUT,
    action: "publish a new incident for a watched company",
  }),
  t("Alert contains the company name and the incident date", {
    feature: F_WATCHLISTS, story: "Alerts", layer: "UI",
    action: "open the notification panel",
  }),
  t("Alert digest respects the user notification settings", {
    feature: F_WATCHLISTS, story: "Alerts", layer: "UI",
    action: "change the digest frequency",
  }),

  // --- Reporting (14) — 11 красных, дефект report-service ------------------
  t("Report generation starts from the company profile", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI",
    tags: ["smoke"], action: "start a report generation",
  }),
  t("Report generation progress is displayed", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI",
    action: "watch the progress indicator",
  }),
  t("Report history lists previously generated reports", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI", severity: "minor",
    action: "open the report history",
  }),
  t("Generated report becomes available for download", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI", severity: "critical",
    tags: ["smoke"], fail: REPORT_SERVICE,
    action: "wait for the report to be ready",
  }),
  t("Report PDF contains the company name and current score", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI", severity: "critical",
    fail: REPORT_SERVICE, action: "open the generated PDF",
  }),
  t("Report PDF contains the incident list for the period", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI", severity: "critical",
    fail: REPORT_SERVICE, action: "check the incident section of the PDF",
  }),
  t("Report PDF contains the ESG issue breakdown", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI",
    fail: REPORT_SERVICE, action: "check the ESG breakdown section",
  }),
  t("Report period selection limits the incidents included", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI",
    fail: REPORT_SERVICE, action: "generate a report for a 6-month period",
  }),
  t("Report can be generated for a watchlist", {
    feature: F_REPORTING, story: "Portfolio report", layer: "UI",
    fail: REPORT_SERVICE, action: "generate a report for a watchlist",
  }),
  t("Portfolio report aggregates scores across companies", {
    feature: F_REPORTING, story: "Portfolio report", layer: "UI",
    fail: REPORT_SERVICE, action: "open the aggregated section",
  }),
  t("Scheduled export delivers the report by email", {
    feature: F_REPORTING, story: "Scheduled exports", layer: "UI",
    fail: REPORT_SERVICE, action: "trigger a scheduled export",
  }),
  t("Scheduled export respects the configured frequency", {
    feature: F_REPORTING, story: "Scheduled exports", layer: "UI", severity: "minor",
    fail: REPORT_SERVICE, action: "check the next scheduled run",
  }),
  t("Report generation is logged in the audit trail", {
    feature: F_REPORTING, story: "Scheduled exports", layer: "UI",
    fail: REPORT_SERVICE, action: "open the audit trail",
  }),
  t("Failed report generation shows an actionable error", {
    feature: F_REPORTING, story: "Due diligence report", layer: "UI",
    fail: REPORT_SERVICE, action: "inspect the error message",
  }),

  // --- Public API (12) — 4 красных, дефект esg-taxonomy --------------------
  t("GET /companies returns 200 for a known identifier", {
    feature: F_API, story: "Company endpoint", layer: "API", severity: "critical",
    tags: ["smoke"], action: "send GET /companies?isin=...",
  }),
  t("Company payload contains id, name, country and current RRI", {
    feature: F_API, story: "Company endpoint", layer: "API", severity: "critical",
    tags: ["smoke"], action: "validate the response body",
  }),
  t("GET /companies returns 404 for an unknown identifier", {
    feature: F_API, story: "Company endpoint", layer: "API",
    action: "send a request with a non-existent id",
  }),
  t("Expired token is rejected with 401", {
    feature: F_API, story: "Auth and limits", layer: "API", severity: "critical",
    action: "send a request with an expired token",
  }),
  t("Missing token is rejected with 401", {
    feature: F_API, story: "Auth and limits", layer: "API",
    action: "send a request without a token",
  }),
  t("Rate limit headers are present in every response", {
    feature: F_API, story: "Auth and limits", layer: "API",
    action: "inspect the response headers",
  }),
  t("Exceeding the rate limit returns 429", {
    feature: F_API, story: "Auth and limits", layer: "API",
    action: "send requests above the limit",
  }),
  t("GET /incidents returns incidents for a company", {
    feature: F_API, story: "Incidents endpoint", layer: "API", severity: "critical",
    tags: ["smoke"], action: "send GET /incidents?company=...",
  }),
  t("Incident payload contains the ESG issue codes", {
    feature: F_API, story: "Incidents endpoint", layer: "API", severity: "critical",
    fail: ESG_TAXONOMY, action: "validate the issue codes in the payload",
  }),
  t("Incident payload maps issue codes to readable names", {
    feature: F_API, story: "Incidents endpoint", layer: "API",
    fail: ESG_TAXONOMY, action: "resolve the issue codes to names",
  }),
  t("Incidents can be filtered by ESG issue code", {
    feature: F_API, story: "Incidents endpoint", layer: "API",
    fail: ESG_TAXONOMY, action: "filter incidents by issue code",
  }),
  t("Incident payload includes the source URL", {
    feature: F_API, story: "Incidents endpoint", layer: "API",
    action: "validate the source field",
  }),

  // --- Access control (7) — 3 красных, тот же дефект esg-taxonomy ----------
  t("A user without the analyst role sees the profile read-only", {
    feature: F_ACCESS, story: "Roles", layer: "UI", severity: "critical",
    tags: ["smoke"], action: "open a profile as a viewer",
  }),
  t("Export button is hidden without the export entitlement", {
    feature: F_ACCESS, story: "Entitlements", layer: "UI", severity: "critical",
    action: "look for the export control",
  }),
  t("Direct export URL returns 403 without entitlement", {
    feature: F_ACCESS, story: "Entitlements", layer: "API", severity: "critical",
    action: "open the export URL directly",
  }),
  t("Entitlement change takes effect on the next login", {
    feature: F_ACCESS, story: "Entitlements", layer: "UI",
    action: "grant an entitlement and sign in again",
  }),
  t("An export by an entitled user is recorded in the audit log", {
    feature: F_ACCESS, story: "Roles", layer: "UI",
    action: "export data and open the audit log",
  }),
  t("ESG issue taxonomy is filtered by the user entitlement", {
    feature: F_ACCESS, story: "Entitlements", layer: "UI",
    fail: ESG_TAXONOMY, action: "open the issue filter as a limited user",
  }),
  t("Taxonomy filter hides codes outside the subscription", {
    feature: F_ACCESS, story: "Entitlements", layer: "API",
    fail: ESG_TAXONOMY, action: "request a restricted issue code",
  }),
  t("Restricted issue code is not returned by the API", {
    feature: F_ACCESS, story: "Entitlements", layer: "API",
    fail: ESG_TAXONOMY, action: "validate the filtered payload",
  }),
];

/**
 * Вердикт для теста. Единственное, что меняется между прогонами, — флаки:
 * на перезапуске из TestOps они зеленеют.
 */
export function verdictFor(item, isRerun) {
  if (!item.fail) return { ok: true };
  if (item.flaky && isRerun) return { ok: true };
  return {
    ok: false,
    cluster: item.fail.cluster,
    message: item.fail.noisy
      ? item.fail.message(requestId(item.index))
      : item.fail.message(),
  };
}
