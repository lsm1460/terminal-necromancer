import { HOSTILITY_LIMIT } from '~/consts'
import { EventBus } from '~/core/EventBus'
import { BaseNPCManager } from '~/core/npc/BaseNPCManager'
import { NPCData } from '~/core/npc/NPCData'
import { GameEventType, INpcManager, Tile } from '~/core/types'
import i18n from '~/i18n'
import { getNPCClass } from '~/npc'
import { Terminal } from '../core/Terminal'
import { GameNPC } from './npc/GameNPC'

type EventCallback = (npcId: string, params?: { karma?: number; hostile?: number }) => void

export class NPCManager extends BaseNPCManager implements INpcManager<GameNPC> {
  private factionHostility: Record<string, number> = {}
  private factionContribution: Record<string, number> = {}

  constructor(
    data: NPCData, 
    private eventBus: EventBus, 
    savedData?: any
  ) {
    super(data);
    
    // 게임 특화 데이터 복구
    if (savedData) {
      this.factionHostility = savedData.factionHostility || {};
      this.factionContribution = savedData.factionContribution || {};
    }

    this.eventBus.subscribe(GameEventType.SKILL_RAISE_SKELETON_SUCCESS, this.reborn);
  }

  public override getNPC(id: string): any {
    const base = this.data.getBase(id);
    const state = this.data.getState(id);

    if (!base || !state || state.reborn) return null;

    // 프로젝트 특화 클래스(예: Merchant, Guard 등)를 가져옴
    const NpcClass = getNPCClass(id); 
    
    // 만약 특화 클래스가 없다면 기본 BaseNPC라도 생성
    return NpcClass 
      ? new NpcClass(id, base, state, this)
      : super.getNPC(id);
  }

  public override getAliveNPCInTile(
    { tile, hasKnight }: { tile: Tile, hasKnight: boolean; },
    options?: { withoutFaction?: string[] }
  ) {
    const ids = [...(tile.npcIds || [])]

    if (hasKnight) {
      ids.push('_knight')
    }

    let _list = ids.map((_id) => this.getNPC(_id)).filter((_npc) => _npc !== null)

    if (options?.withoutFaction) {
      _list = _list.filter((_npc) => !(options.withoutFaction || []).includes(_npc.faction))
    }

    return _list
  }

  reborn = ({ corpseId }: { corpseId: string }) => {
    this.data.setReborn(corpseId, true)
  }

  public updateFactionContribution(faction: string, delta: number) {
    const nextTotal = (this.factionContribution[faction] || 0) + delta

    this.eventBus.emitAsync(GameEventType.UPDATE_FACTION_CONTRIBUTION, { faction, amount: nextTotal })

    this.factionContribution[faction] = nextTotal
  }

  public updateFactionHostility(faction: string, amount: number) {
    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      return
    }

    this.factionHostility[faction] = (this.factionHostility[faction] || 0) + amount

    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      this.factionHostility[faction] = HOSTILITY_LIMIT

      const limitMessages = i18n.t('npc.faction.hostility_limit_reached', {
        returnObjects: true,
        faction,
      }) as string[]

      limitMessages.forEach((msg) => Terminal.log(msg))
      return
    }

    if (this.factionHostility[faction] > 0 && amount > 0) {
      Terminal.log(
        i18n.t('npc.faction.hostility_warning', {
          faction,
          current: this.factionHostility[faction],
          limit: HOSTILITY_LIMIT,
        })
      )
    }
  }

  public getFactionContribution(faction: string) {
    return this.factionContribution[faction] || 0
  }

  public getFactionHostility(faction: string) {
    return this.factionHostility[faction] || 0
  }

  public isFactionHostility(faction: string) {
    return (this.factionHostility[faction] || 0) >= HOSTILITY_LIMIT
  }

  public setFactionHostility(faction: string, amount: number) {
    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      return
    }

    this.factionHostility[faction] = amount
    this.updateFactionHostility(faction, 0)
  }

  isHostile(id: string): boolean {
    const npc = this.data.getBase(id)
    if (!npc) return false

    if (npc.isBoss) {
      return true
    }

    if (npc.faction && this.factionHostility[npc.faction]) {
      return this.factionHostility[npc.faction] >= HOSTILITY_LIMIT
    }

    return false
  }

  triggerDeathHandler(npc: GameNPC, params?: Parameters<EventCallback>[1]) {
    const { hostile = 100, karma } = params || {}

    this.setAlive(npc.id, false)

    if (npc.faction) {
      this.setFactionHostility(npc.faction, hostile)
    }

    this.eventBus.emitAsync(GameEventType.NPC_IS_DEAD, { npcId: npc.id, karma })
  }

  getSaveData() {
    return {
      ...this.data.getSaveData(),
      factionHostility: this.factionHostility,
      factionContribution: this.factionContribution,
    }
  }
}
