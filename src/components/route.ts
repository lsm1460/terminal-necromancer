import { ScreenConfig } from './lib/types'

export const SCREEN_ROUTE: ScreenConfig = {
  id: 'GAME',
  children: [
    {
      id: 'CONFIG',
      children: [{ id: 'CREDIT' }],
    },
  ],
}
