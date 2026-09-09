/**
 * Каталог демо-тестов: ~480 кейсов Telecom Portal.
 *
 * Зачем: на шести тестах не видно ни кластеров, ни трендов, ни флаки.
 * Здесь падает ~20%, падения собраны в кластеры с ОДИНАКОВЫМ сообщением,
 * поэтому одно automation rule ловит весь кластер.
 *
 * Прогон управляется двумя переменными:
 *   CYPRESS_RUN_PARITY  — номер прогона (в CI = github.run_number)
 *   CYPRESS_DEMO_SCRIPT — "off" выключает все падения (зелёный прогон)
 */

// ---------- измерения ----------
const REGIONS = ["north", "south", "east", "west", "central"];
const PLANS = ["basic", "unlimited", "unlimited_plus", "family", "business", "prepaid"];
const CHANNELS = ["web", "ios", "android", "ussd", "callcenter"];
const DOCS = ["passport", "id_card", "residence", "company_reg"];
const PAY = ["card", "sepa", "wallet", "invoice", "voucher"];
const EVENTS = ["activation", "top_up", "overdue", "plan_change", "roaming_on", "roaming_off"];
const ENDPOINTS = ["subscribers", "tariffs", "invoices", "payments", "usage", "devices", "sim", "tickets"];
const API_CASES = ["ok", "auth", "validation", "pagination", "filters", "rate_limit", "errors", "contract"];
const SCREENS = ["login", "overview", "tariffs", "invoices", "payments", "usage", "settings", "support"];
const UI_CASES = ["render", "filter", "export", "permissions"];

// ---------- сборка каталога ----------
function product(dims) {
  const keys = Object.keys(dims);
  let out = [{}];
  keys.forEach((k) => {
    const next = [];
    out.forEach((row) => dims[k].forEach((v) => next.push({ ...row, [k]: v })));
    out = next;
  });
  return out;
}

function build(key, feature, layer, owner, count, dims, titleFn) {
  const combos = product(dims);
  const out = [];
  let i = 0;
  while (out.length < count) {
    const params = combos[i % combos.length];
    const cycle = Math.floor(i / combos.length);
    const suffix = cycle === 0 ? "" : ` #${cycle + 1}`;
    out.push({
      id: `${key}::${Object.values(params).join("-")}${suffix}`,
      key, feature, layer, owner, params,
      title: titleFn(params) + suffix,
    });
    i += 1;
  }
  return out;
}

const SUITES = [
  build("subscribers", "Subscribers", "api", "kategonc", 60,
    { region: REGIONS, doc: DOCS, channel: CHANNELS },
    (p) => `subscriber is registered in ${p.region} with ${p.doc} via ${p.channel}`),

  build("tariffs", "Tariffs", "api", "kategonc", 60,
    { plan: PLANS, region: REGIONS, channel: CHANNELS },
    (p) => `${p.plan} plan is available in ${p.region} via ${p.channel}`),

  build("billing", "Billing", "integration", "kategonc", 72,
    { plan: PLANS, event: EVENTS, region: REGIONS.slice(0, 2) },
    (p) => `invoice is issued for ${p.event} on ${p.plan} (${p.region})`),

  build("payments", "Payments", "integration", "kategonc", 60,
    { method: PAY, plan: PLANS, channel: CHANNELS.slice(0, 2) },
    (p) => `payment by ${p.method} is accepted for ${p.plan} (${p.channel})`),

  build("notifications", "Notifications", "integration", "kategonc", 48,
    { event: EVENTS, channel: CHANNELS, region: REGIONS.slice(0, 2) },
    (p) => `${p.event} notification is delivered over ${p.channel}`),

  build("selfservice", "Self-Service", "e2e", "kategonc", 40,
    { screen: SCREENS, channel: CHANNELS.slice(0, 3) },
    (p) => `subscriber completes ${p.screen} journey on ${p.channel}`),

  build("publicapi", "Public API", "api", "kategonc", 64,
    { endpoint: ENDPOINTS, case: API_CASES },
    (p) => `GET /${p.endpoint} — ${p.case}`),

  build("adminui", "Admin panel", "ui", "kategonc", 44,
    { screen: SCREENS, case: UI_CASES },
    (p) => `${p.screen} screen — ${p.case}`),

  build("network", "Network", "integration", "kategonc", 32,
    { region: REGIONS, event: EVENTS.slice(0, 4), plan: PLANS.slice(0, 2) },
    (p) => `${p.event} is applied on the network in ${p.region}`),
].flat();

// ---------- детерминированный ГПСЧ ----------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function sample(pool, n, seed) {
  const scored = pool
    .map((item) => ({ item, k: hash(seed + "|" + item.id) }))
    .sort((a, b) => a.k - b.k);
  return new Set(scored.slice(0, n).map((s) => s.item.id));
}

// ---------- флаки ----------
// f1, f2 чинятся на следующем прогоне; f3..f6 продолжают мигать.
// Первые ЧЕТЫРЕ чинятся на следующем прогоне (это те, что "починились"
// после перезапуска на демо). Остальные шесть продолжают мигать.
const FLAKY_HEAL_COUNT = 4;
const FLAKY_IDS = [
  "publicapi::usage-rate_limit",
  "publicapi::invoices-pagination",
  "adminui::invoices-export",
  "adminui::overview-filter",
  "selfservice::payments-web",
  "network::west-top_up-basic",
  "tariffs::unlimited-south-android",
  "subscribers::east-id_card-ios",
  "billing::family-roaming_on-north",
  "notifications::overdue-ussd-north",
];
const FLAKY_SET = new Set(FLAKY_IDS);

// ---------- кластеры ----------
const CLUSTERS = [
  {
    name: "billing-gateway",
    size: 36,
    pools: ["billing", "payments"],
    // тот же формат, что в demo-stability: постоянный текст + шумный request-id
    message: "connect ECONNREFUSED 10.0.4.12:8443 - telecom-billing-service unreachable",
    noisy: true,
    severity: "critical",
  },
  {
    name: "profile-schema",
    size: 26,
    pools: ["subscribers", "selfservice"],
    message: "SchemaValidationError: required field 'segment_code' is missing in subscriber profile",
    noisy: false,
    severity: "critical",
  },
  {
    name: "sms-provider",
    size: 16,
    pools: ["notifications", "network"],
    message: "SmsProviderError: gateway returned 503 Service Unavailable",
    noisy: false,
    severity: "normal",
  },
  {
    name: "tariff-cache",
    size: 20,
    pools: ["tariffs", "publicapi"],
    message: "AssertionError: tariff cache is stale, served revision 41 instead of 42",
    noisy: false,
    severity: "normal",
  },
  {
    name: "session-timeout",
    size: 12,
    pools: ["adminui", "selfservice"],
    message: "TimeoutError: session expired, redirected to /login",
    noisy: false,
    severity: "normal",
  },
];

const SINGLES = [
  "AssertionError: expected 200, got 502",
  "AssertionError: payload size 12.4 MB exceeds limit 10 MB",
  "TimeoutError: request did not finish within 30s",
  "AssertionError: duplicate subscriber_id in the response",
  "KeyError: 'invoice_total' not found in response body",
  "ValueError: could not parse timestamp '2026-13-01T00:00:00'",
];

// ---------- раскладка падений ----------
const failures = {};   // id -> { message, noisy, severity, cluster }

CLUSTERS.forEach((cluster) => {
  const pool = SUITES.filter(
    (c) => cluster.pools.includes(c.key) && !FLAKY_SET.has(c.id) && !failures[c.id],
  );
  const picked = sample(pool, cluster.size, cluster.name);
  picked.forEach((id) => {
    failures[id] = {
      message: cluster.message,
      noisy: cluster.noisy,
      severity: cluster.severity,
      cluster: cluster.name,
    };
  });
});

const singlePool = SUITES.filter((c) => !failures[c.id] && !FLAKY_SET.has(c.id));
Array.from(sample(singlePool, SINGLES.length, "singles")).forEach((id, i) => {
  failures[id] = { message: SINGLES[i], noisy: false, severity: "normal", cluster: null };
});

// ---------- API для спеков ----------
function casesFor(key) {
  return SUITES.filter((c) => c.key === key);
}

function runNumber() {
  return Number(Cypress.env("RUN_PARITY") || 0);
}

function verdictFor(testCase) {
  if (String(Cypress.env("DEMO_SCRIPT")) === "off") return null;

  if (FLAKY_SET.has(testCase.id)) {
    const run = runNumber();
    const idx = FLAKY_IDS.indexOf(testCase.id);
    // первые два чинятся на СЛЕДУЮЩЕМ прогоне (чётный красный -> нечётный зелёный),
    // остальные мигают редко и независимо друг от друга
    const green =
      idx < FLAKY_HEAL_COUNT
        ? run % 2 === 1
        : hash(testCase.id + "|" + run) % 5 === 0;
    return green ? null : {
      message: "flaky: timing-dependent assertion failed",
      noisy: false, severity: "minor", cluster: null, flaky: true,
    };
  }
  return failures[testCase.id] || null;
}

function stats() {
  return { total: SUITES.length, failing: Object.keys(failures).length + FLAKY_IDS.length };
}

module.exports = { SUITES, casesFor, verdictFor, stats, FLAKY_IDS, CLUSTERS };
