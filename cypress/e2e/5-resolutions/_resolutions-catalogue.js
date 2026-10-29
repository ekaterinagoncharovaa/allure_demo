/**
 * Каталог автотестов для проверки фичи Resolutions в Allure TestOps.
 *
 * Тесты не ходят в приложение и падают детерминированно. Причины падений
 * подобраны под пункты задачи про Resolutions:
 *
 *   payments-service   5 тестов  одна и та же ошибка в 3 фичах у 2 владельцев
 *                                 -> группировка по похожим падениям, один дефект
 *   price-mismatch     4 теста   похожие сообщения с разными числами
 *                                 -> фильтр error_message.contains("Price mismatch"), регулярка
 *   ui-timeout         4 теста   один селектор, разные страницы, слой UI
 *                                 -> error category "Environment"
 *   auth-token         3 теста   протухший токен в CI (тестовые данные, не баг)
 *   one-off            2 теста   уникальные падения, группироваться не должны
 *   flaky              2 теста   падают на нечётных прогонах и зеленеют на rerun
 *                                 -> кандидаты на Mute
 *
 * Проверено: 40 тестов. Нечётный прогон — 20 красных, чётный прогон
 * или rerun из TestOps — 18 красных.
 */

// --- причины падений -------------------------------------------------------

const PAYMENTS_DOWN = {
  cluster: 'payments-service',
  message: () =>
    'CypressError: `cy.request()` failed trying to load: http://payments-service:8080/api/v2/charges\n'
    + 'Error: connect ECONNREFUSED 10.12.4.17:8080',
}

const PRICE_MISMATCH = {
  cluster: 'price-mismatch',
  // Сообщения разные: числа зависят от корзины. Точное совпадение их не склеит.
  message: (item) =>
    `AssertionError: Price mismatch: expected '${item.data.expected} EUR' to equal '${item.data.actual} EUR'`,
}

const UI_TIMEOUT = {
  cluster: 'ui-timeout',
  message: () =>
    'AssertionError: Timed out retrying after 10000ms: Expected to find element: `[data-test=search-results]`, but never found it.',
}

const AUTH_TOKEN = {
  cluster: 'auth-token',
  message: () =>
    'AssertionError: Expected status 200, got 401: token expired (account: ci-bot@shop.example)',
}

const DISCOUNT_UNDEFINED = {
  cluster: 'one-off',
  message: () =>
    'TypeError: Cannot read properties of undefined (reading \'discountCode\')',
}

const BANNER_STATUS = {
  cluster: 'one-off',
  message: () => 'AssertionError: expected \'Draft\' to equal \'Published\'',
}

const PUSH_FLAKY = {
  cluster: 'flaky',
  message: () =>
    'AssertionError: expected the push notification to be delivered within 5000 ms, but it was not',
}

// --- вспомогательное -------------------------------------------------------

let seq = 0
function t (title, opts) {
  seq += 1
  return {
    index: seq,
    title,
    feature: opts.feature,
    story: opts.story,
    component: opts.component,
    layer: opts.layer,
    severity: opts.severity || 'normal',
    tags: opts.tags || ['regression'],
    owner: opts.owner,
    fail: opts.fail || null,
    flaky: Boolean(opts.flaky),
    data: opts.data || {},
    action: opts.action,
  }
}

// Владельцы: разные, чтобы было что "назначать на одного человека".
const ANNA = 'anna.petrova'
const IVAN = 'ivan.sidorov'
const MARIA = 'maria.kim'
const KATE = 'kategonc'

const F_CHECKOUT = 'Checkout'
const F_ORDERS = 'Orders'
const F_SEARCH = 'Catalog search'
const F_ACCOUNT = 'Account'
const F_NOTIFY = 'Notifications'
const F_ADMIN = 'Admin panel'

// --- каталог ---------------------------------------------------------------

export const CATALOGUE = [
  // --- Checkout (9) --------------------------------------------------------
  t('Customer pays for an order with a saved card', {
    feature: F_CHECKOUT, story: 'Payment', component: 'payments', layer: 'API',
    severity: 'blocker', tags: ['smoke'], owner: ANNA, fail: PAYMENTS_DOWN,
    action: 'pay for an order with a saved card',
  }),
  t('Customer pays for a large order with 3-D Secure', {
    feature: F_CHECKOUT, story: 'Payment', component: 'payments', layer: 'API',
    severity: 'critical', owner: ANNA, fail: PAYMENTS_DOWN,
    action: 'pay for an order over 1000 EUR',
  }),
  t('Cart total includes VAT for a small cart', {
    feature: F_CHECKOUT, story: 'Pricing', component: 'pricing', layer: 'API',
    owner: KATE, action: 'put items for 40 EUR in the cart',
  }),
  t('Cart total includes VAT for a 100 EUR cart', {
    feature: F_CHECKOUT, story: 'Pricing', component: 'pricing', layer: 'API',
    severity: 'critical', owner: KATE, fail: PRICE_MISMATCH,
    data: { expected: '119.00', actual: '141.61' },
    action: 'put items for 100 EUR in the cart',
  }),
  t('Cart total includes VAT for a 250 EUR cart', {
    feature: F_CHECKOUT, story: 'Pricing', component: 'pricing', layer: 'API',
    severity: 'critical', owner: KATE, fail: PRICE_MISMATCH,
    data: { expected: '297.50', actual: '354.02' },
    action: 'put items for 250 EUR in the cart',
  }),
  t('Cart total includes VAT for an 80 EUR cart', {
    feature: F_CHECKOUT, story: 'Pricing', component: 'pricing', layer: 'API',
    owner: KATE, fail: PRICE_MISMATCH,
    data: { expected: '95.20', actual: '113.29' },
    action: 'put items for 80 EUR in the cart',
  }),
  t('Discount code SAVE10 reduces the total by 10%', {
    feature: F_CHECKOUT, story: 'Discounts', component: 'pricing', layer: 'API',
    owner: MARIA, action: 'apply the SAVE10 code',
  }),
  t('Cart without a discount code keeps the full price', {
    feature: F_CHECKOUT, story: 'Discounts', component: 'pricing', layer: 'API',
    severity: 'minor', owner: MARIA, fail: DISCOUNT_UNDEFINED,
    action: 'check out without a discount code',
  }),
  t('Checkout page shows the delivery estimate', {
    feature: F_CHECKOUT, story: 'Delivery', component: 'checkout-ui', layer: 'UI',
    severity: 'minor', owner: ANNA, action: 'open the checkout page',
  }),

  // --- Orders (7) ----------------------------------------------------------
  t('Order status becomes Paid after a successful charge', {
    feature: F_ORDERS, story: 'Order status', component: 'orders', layer: 'API',
    severity: 'critical', tags: ['smoke'], owner: IVAN, fail: PAYMENTS_DOWN,
    action: 'pay for an order and reload its status',
  }),
  t('Customer refunds a delivered order', {
    feature: F_ORDERS, story: 'Refunds', component: 'orders', layer: 'API',
    severity: 'critical', owner: IVAN, fail: PAYMENTS_DOWN,
    action: 'request a refund for a delivered order',
  }),
  t('Order total in the order details matches the cart', {
    feature: F_ORDERS, story: 'Order details', component: 'pricing', layer: 'API',
    owner: IVAN, fail: PRICE_MISMATCH,
    data: { expected: '178.50', actual: '212.42' },
    action: 'open the details of an order for 150 EUR net',
  }),
  t('Order history lists orders newest first', {
    feature: F_ORDERS, story: 'Order history', component: 'orders', layer: 'UI',
    owner: IVAN, action: 'open the order history',
  }),
  t('Order history is paginated by 20 items', {
    feature: F_ORDERS, story: 'Order history', component: 'orders', layer: 'UI',
    severity: 'minor', owner: IVAN, action: 'scroll to the second page of orders',
  }),
  t('Cancelled order is shown with a grey badge', {
    feature: F_ORDERS, story: 'Order history', component: 'orders', layer: 'UI',
    severity: 'trivial', owner: IVAN, action: 'cancel an order',
  }),
  t('Invoice PDF can be downloaded for a paid order', {
    feature: F_ORDERS, story: 'Order details', component: 'orders', layer: 'API',
    owner: IVAN, action: 'download the invoice',
  }),

  // --- Catalog search (7) --------------------------------------------------
  t('Search by product name returns matching items', {
    feature: F_SEARCH, story: 'Search results', component: 'catalog', layer: 'UI',
    severity: 'critical', tags: ['smoke'], owner: ANNA, action: 'search for \'laptop\'',
  }),
  t('Search for \'phone\' shows results', {
    feature: F_SEARCH, story: 'Search results', component: 'catalog', layer: 'UI',
    owner: ANNA, fail: UI_TIMEOUT, action: 'search for \'phone\'',
  }),
  t('Search for \'headphones\' shows results', {
    feature: F_SEARCH, story: 'Search results', component: 'catalog', layer: 'UI',
    owner: ANNA, fail: UI_TIMEOUT, action: 'search for \'headphones\'',
  }),
  t('Search with a typo suggests the correct spelling', {
    feature: F_SEARCH, story: 'Suggestions', component: 'catalog', layer: 'UI',
    severity: 'minor', owner: MARIA, fail: UI_TIMEOUT, action: 'search for \'hedphones\'',
  }),
  t('Brand filter narrows the results', {
    feature: F_SEARCH, story: 'Filters', component: 'catalog', layer: 'UI',
    owner: MARIA, action: 'filter results by brand',
  }),
  t('Price filter narrows the results', {
    feature: F_SEARCH, story: 'Filters', component: 'catalog', layer: 'UI',
    owner: MARIA, action: 'filter results by price',
  }),
  t('Empty search shows popular products', {
    feature: F_SEARCH, story: 'Search results', component: 'catalog', layer: 'UI',
    severity: 'minor', owner: ANNA, action: 'submit an empty search',
  }),

  // --- Account (7) ---------------------------------------------------------
  t('Customer signs in with email and password', {
    feature: F_ACCOUNT, story: 'Sign in', component: 'auth', layer: 'API',
    severity: 'blocker', tags: ['smoke'], owner: MARIA, action: 'sign in',
  }),
  t('Admin profile is returned for a valid admin token', {
    feature: F_ACCOUNT, story: 'Profile', component: 'auth', layer: 'API',
    severity: 'critical', owner: MARIA, fail: AUTH_TOKEN,
    action: 'request the admin profile',
  }),
  t('Support agent profile is returned for a valid token', {
    feature: F_ACCOUNT, story: 'Profile', component: 'auth', layer: 'API',
    owner: MARIA, fail: AUTH_TOKEN, action: 'request the support agent profile',
  }),
  t('Customer profile is returned for a valid token', {
    feature: F_ACCOUNT, story: 'Profile', component: 'auth', layer: 'API',
    owner: MARIA, action: 'request the customer profile',
  }),
  t('Saved addresses are listed in the profile', {
    feature: F_ACCOUNT, story: 'Addresses', component: 'account-ui', layer: 'UI',
    owner: KATE, action: 'open saved addresses',
  }),
  t('Customer changes the default address', {
    feature: F_ACCOUNT, story: 'Addresses', component: 'account-ui', layer: 'UI',
    severity: 'minor', owner: KATE, action: 'change the default address',
  }),
  t('Password reset link expires after 24 hours', {
    feature: F_ACCOUNT, story: 'Password reset', component: 'auth', layer: 'API',
    owner: MARIA, action: 'open a password reset link from yesterday',
  }),

  // --- Notifications (5) ---------------------------------------------------
  t('Order confirmation email is sent after payment', {
    feature: F_NOTIFY, story: 'Email', component: 'notifications', layer: 'API',
    owner: IVAN, fail: PAYMENTS_DOWN, action: 'pay for an order and check the mailbox',
  }),
  t('Password reset email is sent', {
    feature: F_NOTIFY, story: 'Email', component: 'notifications', layer: 'API',
    severity: 'minor', owner: IVAN, action: 'request a password reset',
  }),
  t('Push notification is delivered when an order ships', {
    feature: F_NOTIFY, story: 'Push', component: 'notifications', layer: 'API',
    severity: 'minor', tags: ['regression', 'flaky'], owner: IVAN,
    fail: PUSH_FLAKY, flaky: true, action: 'mark an order as shipped',
  }),
  t('Push notification is delivered for a price drop', {
    feature: F_NOTIFY, story: 'Push', component: 'notifications', layer: 'API',
    severity: 'minor', tags: ['regression', 'flaky'], owner: IVAN,
    fail: PUSH_FLAKY, flaky: true, action: 'lower the price of a watched item',
  }),
  t('Customer unsubscribes from marketing emails', {
    feature: F_NOTIFY, story: 'Email', component: 'notifications', layer: 'UI',
    severity: 'trivial', owner: IVAN, action: 'click unsubscribe',
  }),

  // --- Admin panel (5) -----------------------------------------------------
  t('Admin sees the dashboard after sign-in', {
    feature: F_ADMIN, story: 'Dashboard', component: 'admin-ui', layer: 'UI',
    severity: 'critical', owner: KATE, fail: AUTH_TOKEN,
    action: 'sign in to the admin panel',
  }),
  t('Admin search finds a product by SKU', {
    feature: F_ADMIN, story: 'Products', component: 'admin-ui', layer: 'UI',
    owner: KATE, fail: UI_TIMEOUT, action: 'search for a SKU in the admin panel',
  }),
  t('Admin publishes a promo banner', {
    feature: F_ADMIN, story: 'Content', component: 'admin-ui', layer: 'UI',
    owner: KATE, fail: BANNER_STATUS, action: 'publish a promo banner',
  }),
  t('Admin exports orders to CSV', {
    feature: F_ADMIN, story: 'Orders export', component: 'admin-ui', layer: 'UI',
    severity: 'minor', owner: KATE, action: 'export orders to CSV',
  }),
  t('Admin changes a product price', {
    feature: F_ADMIN, story: 'Products', component: 'admin-ui', layer: 'UI',
    owner: KATE, action: 'change a product price',
  }),
]

/**
 * Флаки падают на нечётных номерах прогона (run_number) и проходят на чётных.
 * Rerun из TestOps — это новый прогон воркфлоу с номером +1, так что после
 * падения на нечётном прогоне rerun их зеленит.
 */
export function verdictFor (item, { runNumber }) {
  if (!item.fail) return { ok: true }
  if (item.flaky && runNumber % 2 === 0) return { ok: true }
  return { ok: false, cluster: item.fail.cluster, message: item.fail.message(item) }
}
