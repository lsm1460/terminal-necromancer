import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventBus } from '~/core/EventBus'
import { NPCManager } from '../../systems/NpcManager'
import { Player } from '../player/Player'

// Mock i18n
vi.mock('~/i18n', () => ({
  default: {
    t: vi.fn((key) => key),
    exists: vi.fn(() => true),
  },
}))

// Mock Terminal
vi.mock('../Terminal', () => ({
  Terminal: {
    log: vi.fn(),
  },
}))

describe('NPCManager (Legacy Behavior)', () => {
  let eventBus: EventBus
  let npcManager: NPCManager
  let player: Player
  
  const mockNpcData = {
    test_npc: {
      id: 'test_npc',
      hp: 100,
      maxHp: 100,
      faction: 'test_faction',
      isAlive: true,
    },
    boss_npc: {
      id: 'boss_npc',
      isBoss: true,
      faction: 'boss_faction',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    eventBus = new EventBus()
    player = new Player([], eventBus)
    npcManager = new NPCManager(mockNpcData, eventBus)
  })

  it('should return an NPC object with correct properties', () => {
    const npc = npcManager.getNPC('test_npc')
    expect(npc).not.toBeNull()
    expect(npc?.id).toBe('test_npc')
    expect(npc?.hp).toBe(100)
    expect(npc?.isNpc).toBe(true)
  })

  it('should return null for non-existent NPC', () => {
    const npc = npcManager.getNPC('non_existent')
    expect(npc).toBeNull()
  })

  it('should handle NPC death correctly', () => {
    const npc = npcManager.getNPC('test_npc')
    const initialKarma = player.karma

    npc?.dead({ karma: 5, hostile: 50 })

    expect(player.karma).toBe(initialKarma + 5)
    expect(npcManager.getSaveData().states['test_npc'].isAlive).toBe(false)
    // Check if faction hostility is updated
    expect(npcManager.getSaveData().factionHostility['test_faction']).toBe(50)
  })

  it('should correctly determine hostility', () => {
    // Regular NPC not hostile by default
    expect(npcManager.isHostile('test_npc')).toBe(false)

    // Boss NPC always hostile
    expect(npcManager.isHostile('boss_npc')).toBe(true)

    // Faction hostility reach limit
    npcManager.setFactionHostility('test_faction', 100) // Assuming HOSTILITY_LIMIT is 100
    expect(npcManager.isHostile('test_npc')).toBe(true)
  })

  it('should provide translated properties via getters', () => {
    const npc = npcManager.getNPC('test_npc')
    expect(npc?.name).toBe('npc.test_npc.name')
    expect(npc?.description).toBe('npc.test_npc.description')
  })

  it('should update contribution and hostility via NPC methods', () => {
    const npc = npcManager.getNPC('test_npc')
    npc?.updateContribution(10)
    npc?.updateHostility(5)

    const saveData = npcManager.getSaveData()
    expect(saveData.factionContribution['test_faction']).toBe(10)
    expect(saveData.factionHostility['test_faction']).toBe(5)
  })
})
