import { create } from 'zustand'
import { UIState } from '~/renderers/ReactRenderer'

interface GameState {
  logs: string[]
  status: any
  uiState: UIState

  // Actions
  setLogs: (updater: (prev: string[]) => string[]) => void
  addLog: (log: string) => void
  clearLogs: () => void
  setStatus: (status: any) => void
  setUI: (uiState: UIState) => void
  resolveUI: (value: any, message?: string) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  logs: [],
  status: null,
  uiState: {
    type: 'NONE',
    message: '',
    resolve: () => {},
  },

  setLogs: (updater) => set((state) => ({ logs: updater(state.logs) })),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setStatus: (status) => set({ status }),
  setUI: (uiState) => set({ uiState }),

  resolveUI: (value: any, message?: string) => {
    const { uiState, addLog } = get()

    if (message) {
      console.log('DEBUG::', message)
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
}))
