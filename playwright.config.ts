// playwright.config.ts
import type { PlaywrightTestConfig } from '@playwright/test'
import * as dotenv from 'dotenv'

dotenv.config({
  path: './.env'
})
const config: PlaywrightTestConfig = {
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    headless: false
  }
}
export default config
