import { create } from 'zustand'
import { AppScreen } from '~/components/lib/types'
import { UIState } from '~/renderers/ReactRenderer'

const MAX_LOGS = 100

interface GameState {
  currentScreen: AppScreen
  logs: string[]
  uiState: UIState
  isLoading: boolean
  isOpenButtonMenu: boolean

  // Actions
  setLogs: (updater: (prev: string[]) => string[]) => void
  setIsLoading: (isLoading: boolean) => void
  addLog: (log: string) => void
  updateLastLog: (log: string) => void
  clearLogs: () => void
  setUI: (uiState: UIState) => void
  resolveUI: (value: any, message?: string) => void
  toggleButtonMenu: () => void
  setScreen: (screen: AppScreen) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  currentScreen: 'GAME',
  logs: [],
  uiState: {
    type: 'NONE',
    message: '',
    resolve: () => {},
  },
  isLoading: false,
  isOpenButtonMenu: false,

  setLogs: (updater) => set((state) => ({ logs: updater(state.logs) })),
  setIsLoading: (isLoading) => set((state) => ({ isLoading })),
  addLog: (log) =>
    set((state) => {
      const updatedLogs = [...state.logs, log]

      if (updatedLogs.length > MAX_LOGS) {
        return { logs: updatedLogs.slice(updatedLogs.length - MAX_LOGS) }
      }

      return { logs: updatedLogs }
    }),
  updateLastLog: (newLog: string) =>
    set((state) => {
      if (state.logs.length === 0) return { logs: [newLog] }
      const newLogs = [...state.logs]
      newLogs[newLogs.length - 1] = newLog // 마지막 요소 교체
      return { logs: newLogs }
    }),
  clearLogs: () => set({ logs: [] }),
  setUI: (uiState) => set({ uiState }),

  resolveUI: (value: any, message?: string) => {
    const { uiState, addLog } = get()

    if (message) {
      addLog(message)
    }

    uiState.resolve(value)

    set({
      uiState: {
        type: 'NONE',
        message: '',
        resolve: () => {},
      },
    })
  },
  toggleButtonMenu: () => set((state) => ({ isOpenButtonMenu: !state.isOpenButtonMenu })),
  setScreen: (screen: AppScreen) => set({ currentScreen: screen }),
}))
