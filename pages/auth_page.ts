import { Locator, Page } from '@playwright/test'
import { BasePage } from './base_page'

export class AuthPage extends BasePage {
  readonly loginInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly loginLabel: Locator
  readonly passwordLabel: Locator
  readonly confirmPasswordInput: Locator
  readonly confirmPasswordLabel: Locator
  readonly navigationButton: Locator
  readonly loginErrorText: Locator

  constructor (page: Page) {
    super(page)
    this.loginInput = page.getByLabel('Login')
    this.loginLabel = page.locator('label', { hasText: 'Login' })
    this.passwordInput = page.getByLabel('Password', { exact: true })
    this.passwordLabel = page.locator('label[for="Password"]', { hasText: 'Password' })
    this.confirmPasswordInput = page.getByLabel('Confirm Password')
    this.confirmPasswordLabel = page.locator('label', { hasText: 'Confirm Password' })
    this.submitButton = page.getByRole('button')
    this.navigationButton = page.locator('.home-navigation >> div')
    this.loginErrorText = page.locator('form').nth(0).locator('.v_form_error')
  }

  passwordErrorText () {
    return this.page.locator('form').nth(1).locator('.v_form_error') as Locator
  }

  confirmPasswordErrortext () {
    return this.page.locator('form').nth(2).locator('.v_form_error') as Locator
  }

  async changePageTo (page: 'Authorization' | 'Registration') {
    await this.navigationButton.filter({ hasText: page }).click()
    await this.page.locator('.v-enter-active').waitFor()
  }
}
