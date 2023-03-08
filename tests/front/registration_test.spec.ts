import { ObjectId } from 'mongodb'
import { DBUsers } from '../../db/db_users'
import { generator } from '../../helpers/generator'
import { User } from '../../models/user'
import { AuthPage } from '../../pages/auth_page'
import { PAGES } from '../../pages/pages_enum'
import { test, expect } from '../main_fixtures'

const { randomString } = generator()
const usersToBeDeleted: ObjectId[] = []

test.describe('SUITE: Registration', async () => {
  test.afterAll(async () => {
    await new DBUsers().deleteUsers(usersToBeDeleted)
  })

  test('TEST: sign_up validation', async ({ page }) => {
    const regPage = new AuthPage(page)

    await test.step('DO: open the sign_up page', async () => {
      await regPage.openPage(PAGES.AUTH_PAGE)
      await regPage.changePageTo('Registration')
      await test.step('EXPECT: registration form to be visible', async () => {
        await expect(regPage.loginInput).toBeVisible()
        await expect(regPage.loginLabel).toHaveText('Login')
        await expect(regPage.passwordInput).toBeVisible()
        await expect(regPage.passwordLabel).toHaveText('Password')
        await expect(regPage.confirmPasswordInput).toBeVisible()
        await expect(regPage.confirmPasswordLabel).toHaveText('Confirm password')
        await expect(regPage.submitButton).toBeVisible()
        await expect(regPage.submitButton).toHaveText('Create an account')
      })
      await test.step('EXPECT: button to be disabled by default', async () => {
        await expect(regPage.submitButton).toBeDisabled()
      })
    })

    await test.step('DO: fill in the login input with less than 6 symbols', async () => {
      const randomPassword = randomString(8)
      await regPage.loginInput.fill(randomString(5))
      await regPage.passwordInput.fill(randomPassword)
      await regPage.confirmPasswordInput.fill(randomPassword)
      await test.step('EXPECT: button to be disabled', async () => {
        await expect(regPage.submitButton).toBeDisabled()
      })
    })

    await test.step('DO: fill in the password inputs with less than 8 symbols', async () => {
      await regPage.loginInput.fill(randomString(6))
      const smallPassword = randomString(7)
      await regPage.passwordInput.fill(smallPassword)
      await regPage.confirmPasswordInput.fill(smallPassword)
      await test.step('EXPECT: button to be disabled', async () => {
        await expect(regPage.submitButton).toBeDisabled()
      })
    })

    await test.step('DO: fill in the inputs with value longer than a 20 symbols', async () => {
      const largeValue = randomString(25)
      for (const input of [regPage.loginInput, regPage.passwordInput, regPage.confirmPasswordInput]) {
        await input.fill(largeValue)
        await test.step('EXPECT: max valid length to be 20', async () => {
          await expect(input).toHaveValue(largeValue.slice(0, 20))
        })
      }
    })

    await test.step('DO: fill in password inputs with different values', async () => {
      const passwordValue = randomString(10)
      const confirmPasswordValue = passwordValue + '1'
      await regPage.passwordInput.fill(passwordValue)
      await regPage.confirmPasswordInput.fill(confirmPasswordValue)
      await test.step('EXPECT: button to be disabled, error to be shown', async () => {
        await expect(regPage.submitButton).toBeDisabled()
        await expect(regPage.confirmPasswordErrortext()).toHaveText('Passwords are different')
      })
      await test.step('DO: make values the same', async () => {
        await regPage.confirmPasswordInput.fill(await regPage.passwordInput.inputValue())
        await test.step('EXPECT: error to be hidden, button to be enabled', async () => {
          await expect(regPage.confirmPasswordErrortext()).toBeHidden()
          await expect(regPage.submitButton).toBeEnabled()
        })
      })
    })

    await test.step('DO: clear one of inputs', async () => {
      await regPage.loginInput.clear()
      await test.step('EXPECT: input\'s value to be cleared and submit button to be disabled', async () => {
        await expect(regPage.submitButton).toBeDisabled()
        await expect(regPage.loginInput).toHaveValue('')
      })
    })
  })

  test('TEST: redirecting from "sign_up" route', async ({ page }) => {
    const authPage = new AuthPage(page)
    await test.step('DO: go to sign_up route', async () => {
      await authPage.openPage(PAGES.SIGN_UP_PAGE)
      await test.step('EXPECT: redirecting to sign_in route', async () => {
        await expect(page).toHaveURL(`${process.env.BASE_WEB_URL}${PAGES.AUTH_PAGE}`)
      })
    })
  })

  test('TEST: sign_up with existing credentials', async ({ page, userCreation }) => {
    const [existingUser] = userCreation
    const regPage = new AuthPage(page)
    await test.step('DO: open sign_up page', async () => {
      await regPage.openPage(PAGES.AUTH_PAGE)
      await regPage.changePageTo('Registration')
    })
    await test.step('DO: fill in the inputs with existing credentials', async () => {
      await regPage.loginInput.fill(String(existingUser.login))
      await regPage.passwordInput.fill(String(existingUser.password))
      await regPage.confirmPasswordInput.fill(String(existingUser.password))
    })
    await test.step('DO: Click submit button', async () => {
      await regPage.submitButton.click()
      await test.step('EXPECT: error to be shown', async () => {
        await expect(regPage.loginErrorText).toHaveText('This login is already in use')
      })
    })
    await test.step('DO: change value in login input', async () => {
      await regPage.loginInput.type('!')
      await test.step('EXPECT: error to be hidden', async () => {
        await expect(regPage.loginErrorText).toBeHidden()
      })
    })
  })

  test('TEST: successfull sign_up', async ({ page }) => {
    const usersToBeCreated = new User()
    const regPage = new AuthPage(page)
    await test.step('DO: open sign_up page', async () => {
      await regPage.openPage(PAGES.AUTH_PAGE)
      await regPage.changePageTo('Registration')
    })
    await test.step('DO: fill in the inputs with existing credentials', async () => {
      await regPage.loginInput.fill(String(usersToBeCreated.login))
      await regPage.passwordInput.fill(String(usersToBeCreated.password))
      await regPage.confirmPasswordInput.fill(String(usersToBeCreated.password))
    })
    await test.step('DO: Click submit button', async () => {
      const responsePromise = page.waitForResponse(resp => resp.url().includes('/sign_up') && resp.status() === 200)
      await regPage.submitButton.click()
      const signUpResponse = await responsePromise
      const userToBeDeleted = (await signUpResponse.json()).user
      usersToBeDeleted.push(new ObjectId(userToBeDeleted))

      await test.step('EXPECT: main page to be opened, user to be created in db', async () => {
        await page.waitForURL((url) => url.pathname.includes('profile/games'))
        expect(await new DBUsers().getUsersInfo([new ObjectId(userToBeDeleted)])).toHaveLength(1)
      })
    })
  })
})
