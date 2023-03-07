import { Locator, Page } from '@playwright/test'
import { BasePage } from './base_page'

export class AuthPage extends BasePage {
  readonly loginInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly loginLabel: Locator
  readonly passwordLabel: Locator

  constructor (page: Page) {
    super(page)
    this.loginInput = page.getByLabel('Login')
    this.loginLabel = page.locator('label', { hasText: 'Login' })
    this.passwordInput = page.getByLabel('Password')
    this.passwordLabel = page.locator('label', { hasText: 'Password' })
    this.submitButton = page.getByRole('button', { name: 'Authorize' })
  }

  passwordErrorText () {
    return this.page.locator('form').nth(1).locator('.v_form_error') as Locator
  }
}
