import { create } from 'zustand'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'

export type UnitActionType = 'ATTACK' | 'HIT' | 'DIE' | 'ESCAPE' | 'IDLE'

interface UnitAction {
  type: UnitActionType
  options?: { damage?: number; skillId?: string; isCritical?: boolean }
  onComplete?: () => void
}

interface BattleState {
  inBattle: Boolean
  playerSide: CombatUnit[]
  enemiesSide: CombatUnit[]

  unitActions: Record<string, UnitAction>

  clear: () => void
  setBattleUnits: (units: { playerSide: CombatUnit[]; enemiesSide: CombatUnit[] }) => void
  updateBattleUnits: (units: { playerSide?: CombatUnit[]; enemiesSide?: CombatUnit[] }) => void
  removeUnit: (id: string) => void

  triggerAction: (id: string, type: UnitActionType, options?: UnitAction['options']) => Promise<void>
}

export const useBattleStore = create<BattleState>((set, get) => ({
  inBattle: false,
  playerSide: [],
  enemiesSide: [],
  unitActions: {},

  setBattleUnits: (units) =>
    set({
      inBattle: true,
      playerSide: units.playerSide,
      enemiesSide: units.enemiesSide,
      unitActions: {},
    }),

  updateBattleUnits: (units) =>
    set((state) => ({
      playerSide: units.playerSide ?? state.playerSide,
      enemiesSide: units.enemiesSide ?? state.enemiesSide,
    })),

  clear: () =>
    set({
      inBattle: false,
      playerSide: [],
      enemiesSide: [],
      unitActions: {},
    }),

  removeUnit: (id) =>
    set((state) => ({
      playerSide: state.playerSide.filter((u) => u.id !== id),
      enemiesSide: state.enemiesSide.filter((u) => u.id !== id),
    })),

  triggerAction: (id, type, options) => {
    return new Promise((resolve) => {
      set((state) => ({
        unitActions: {
          ...state.unitActions,
          [id]: {
            type,
            options,
            onComplete: () => {
              set((s) => {
                const nextActions = { ...s.unitActions }
                delete nextActions[id]
                return { unitActions: nextActions }
              })

              resolve()
            },
          },
        },
      }))
    })
  },
  //
}))
