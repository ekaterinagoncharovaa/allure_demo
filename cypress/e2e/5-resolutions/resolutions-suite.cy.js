import * as allure from 'allure-js-commons'
import { CATALOGUE, verdictFor } from './_resolutions-catalogue'

// Rerun из TestOps: workflow прокидывает сюда признак по ALLURE_JOB_RUN_ID.
const IS_RERUN = String(Cypress.env('IS_RERUN')).toLowerCase() === 'true'
// Номер прогона GitHub Actions: флаки падают на нечётных.
const RUN_NUMBER = Number(Cypress.env('RUN_NUMBER') || 1)
// Темп прогона. Меняется через CYPRESS_STEP_DELAY.
const STEP_DELAY = Number(Cypress.env('STEP_DELAY') || 150)

// "AssertionError: ..." -> Error с name=AssertionError (в TestOps статус failed),
// остальные (CypressError, TypeError) -> broken.
function toError (message) {
  const match = /^(\w+Error): ([\s\S]*)$/.exec(message)
  const err = new Error(match ? match[2] : message)
  if (match) err.name = match[1]
  return err
}

const BY_FEATURE = CATALOGUE.reduce((acc, item) => {
  (acc[item.feature] = acc[item.feature] || []).push(item)
  return acc
}, {})

Object.entries(BY_FEATURE).forEach(([feature, items]) => {
  describe(`Shop · ${feature}`, () => {
    // Тесты генерируются из каталога, это осознанно.
    // eslint-disable-next-line mocha/no-setup-in-describe
    items.forEach((item) => {
      it(item.title, { retries: 0 }, () => {
        allure.epic('Online shop')
        allure.feature(item.feature)
        allure.story(item.story)
        allure.layer(item.layer)
        allure.severity(item.severity)
        allure.owner(item.owner)
        allure.label('component', item.component)
        allure.tags(...item.tags)
        allure.parameter('environment', 'staging')

        allure.step('Sign in as a test customer', () => {})
        allure.step(`When I ${item.action}`, () => {})

        allure.step(`Then ${item.title.toLowerCase()}`, () => {})

        cy.wait(STEP_DELAY).then(() => {
          const verdict = verdictFor(item, { isRerun: IS_RERUN, runNumber: RUN_NUMBER })
          if (!verdict.ok) throw toError(verdict.message)
        })
      })
    })
  })
})
