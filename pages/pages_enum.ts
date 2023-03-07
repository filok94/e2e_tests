export const PAGES = {
  AUTH_PAGE: 'login/sign_in',
  SIGN_UP_PAGE: 'login/sign_up'
} as const
// eslint-disable-next-line no-redeclare
export type PAGES = typeof PAGES[keyof typeof PAGES];
