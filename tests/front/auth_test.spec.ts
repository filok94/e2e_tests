import { generator } from '../../helpers/generator'
import { AuthPage } from '../../pages/auth_page'
import { PAGES } from '../../pages/pages_enum'
import { expect, test } from '../main_fixtures'

const { randomString } = generator()

test.describe('SUITE: Test sign_in', async () => {
  test('TEST: sign_in validation', async ({ page }) => {
    const authPage = new AuthPage(page)

    await test.step('DO: open the auth_page', async () => {
      await authPage.openPage(PAGES.AUTH_PAGE)
      await test.step('EXPECT: auth form to be visible', async () => {
        await expect(authPage.loginInput).toBeVisible()
        await expect(authPage.loginLabel).toHaveText('Login')
        await expect(authPage.passwordInput).toBeVisible()
        await expect(authPage.passwordLabel).toHaveText('Password')
        await expect(authPage.submitButton).toBeVisible()
        await expect(authPage.submitButton).toHaveText('Authorize')
      })
      await test.step('EXPECT: button to be disabled by default', async () => {
        await expect(authPage.submitButton).toBeDisabled()
      })
    })

    await test.step('DO: fill in the login input with less than 6 symbols', async () => {
      await authPage.loginInput.fill(randomString(5))
      await authPage.passwordInput.fill(randomString(8))
      await test.step('EXPECT: button to be disabled', async () => {
        await expect(authPage.submitButton).toBeDisabled()
      })
    })

    await test.step('DO: fill in the password input with less than 8 symbols', async () => {
      await authPage.loginInput.fill(randomString(6))
      await authPage.passwordInput.fill(randomString(7))
      await test.step('EXPECT: button to be disabled', async () => {
        await expect(authPage.submitButton).toBeDisabled()
      })
    })

    await test.step('DO: fill in the inputs with valid length values', async () => {
      await authPage.loginInput.fill(randomString(6))
      await authPage.passwordInput.fill(randomString(8))
      await test.step('EXPECT: button to be enabled', async () => {
        await expect(authPage.submitButton).toBeEnabled()
      })
    })

    await test.step('DO: fill in the inputs with value longer than a 20 symbols', async () => {
      const largeValue = randomString(25)
      for (const input of [authPage.loginInput, authPage.passwordInput]) {
        await input.fill(largeValue)
        await test.step('EXPECT: max valid length to be 20', async () => {
          await expect(authPage.submitButton).toBeEnabled()
          await expect(input).toHaveValue(largeValue.slice(0, 20))
        })
      }
    })

    await test.step('DO: clear one of inputs', async () => {
      await authPage.loginInput.clear()
      await test.step('EXPECT: input\'n value to be cleared and submit button to be disabled', async () => {
        await expect(authPage.submitButton).toBeDisabled()
        await expect(authPage.loginInput).toHaveValue('')
      })
    })
  })

  test('TEST: sign_in with bad credentials', async ({ page, userCreation }) => {
    const [mainUser] = userCreation
    const authPage = new AuthPage(page)
    await test.step('DO: open auth page', async () => {
      await authPage.openPage(PAGES.AUTH_PAGE)
    })

    await test.step('DO: fill in the inputs with not existing login and password pair', async () => {
      const randomValue = randomString(10)
      await authPage.loginInput.fill(randomValue)
      await authPage.passwordInput.fill(randomValue)
      await test.step('EXPECT: button to be enabled', async () => {
        await expect(authPage.submitButton).toBeEnabled()
      })

      await test.step('DO: click submit button', async () => {
        await authPage.submitButton.click()
        await test.step('EXPECT: error to be shown', async () => {
          await expect(authPage.passwordErrorText()).toHaveText('Login or password is incorrect')
        })
      })
    })

    await test.step('DO: fill in the login input with an existing login and wrong password pair', async () => {
      const randomValue = randomString(10)
      await authPage.loginInput.fill(String(mainUser.login))
      await authPage.passwordInput.fill(randomValue)
      await test.step('EXPECT: button is enabled', async () => {
        await expect(authPage.submitButton).toBeEnabled()
      })

      await test.step('DO: click the submit button', async () => {
        await authPage.submitButton.click()
        await test.step('EXPECT: error to be shown', async () => {
          await expect(authPage.passwordErrorText()).toHaveText('Login or password is incorrect')
        })
      })
    })
  })

  test('TEST: Succesfull authentication', async ({ page, userCreation }) => {
    const [mainUser] = userCreation
    const authPage = new AuthPage(page)
    await test.step('DO: open auth page', async () => {
      await authPage.openPage(PAGES.AUTH_PAGE)
    })

    await test.step('DO: fill in inputs with the existing login and password pair', async () => {
      await authPage.loginInput.fill(String(mainUser.login))
      await authPage.passwordInput.fill(String(mainUser.password))
      await test.step('EXPECT: button to be enabled', async () => {
        await expect(authPage.submitButton).toBeEnabled()
      })

      await test.step('DO: click submit button', async () => {
        await authPage.submitButton.click()
        await test.step('EXPECT: main page to be opened', async () => {
          await page.waitForURL((url) => url.pathname.includes('profile/games'))
        })
      })
    })
  })
})
