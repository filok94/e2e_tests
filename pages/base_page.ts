import { Locator, Page } from '@playwright/test'
import { Tokens } from '../models/tokens'
import { PAGES } from './pages_enum'

export class BasePage {
  readonly page: Page
  readonly logo: Locator
  constructor (page: Page) {
    this.page = page
    this.logo = page.locator('#logo')
  }

  async openPage (pageToGo: PAGES, tokens: Tokens | null = null) {
    if (tokens !== null) {
      await this.page.addInitScript("localStorage.setItem('access_token','" + tokens.access_token + "')")
      await this.page.addInitScript("localStorage.setItem('refresh_token','" + tokens.refresh_token + "')")
    }
    await this.page.goto(`${process.env.BASE_WEB_URL}${pageToGo}`, { waitUntil: 'networkidle' })
  }
}
