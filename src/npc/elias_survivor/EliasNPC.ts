import { GameContext, INpcManager, NPCState } from "~/core/types"
import i18n from "~/i18n"
import { GameNPC } from "~/systems/npc/GameNPC"
import { EliasActions } from "./action"
import { EliasService } from "./service"


export class EliasNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const alreadyTalk = EliasService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    // 미조우 상태일 때만 퀘스트 마크 표시
    return !EliasService.isMet(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC에서 제공하는 기본 대화 기능
        break
      case 'event':
        await EliasActions.handleEncounter(context)
        break
      default:
        break
    }
    return true
  }
}