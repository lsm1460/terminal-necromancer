import { Terminal } from "~/core"
import i18n from "~/i18n"
import { NPCManager } from "~/systems/NpcManager"
import { AppContext } from "~/systems/types"

export class Ending {
  static async run(context: AppContext): Promise<void> {
    const { player, events, npcs } = context

    // 주요 변수 추출
    const caronIsDead = events.isCompleted('caron_is_dead')
    const caronIsMine = events.isCompleted('caron_is_mine')
    const fightWithResistance = events.isCompleted('join_resistance_battle')
    const killAll = events.isCompleted('third_boss_kill_all')
    const vipIsSafe = events.isCompleted('third_boss_vip')
    
    const contribution = (npcs as NPCManager).getFactionContribution('resistance')
    const isHostility = (npcs as NPCManager).isFactionHostility('resistance')

    // 1. 진정한 안식 (True Ending)
    // 조건: 카론을 살려 동료로 만들었고, 레지스탕스와 최고 우호도이며, 무고한 살생(karma)이 없어야 함.
    if (caronIsMine && !caronIsDead && !isHostility && contribution >= 100 && player.karma <= 0) {
      if(player.hasItem('true_ending_key')) {
        // Terminal.confirm('저장을 지우고 윤회를 끊어낸다.')

        return
      }

      console.log('ENDING 1:: 이 곳의 관리자가 된다.')
      return
    }

    // 2. 차원의 붕괴 (Bad Ending: Annihilation)
    // 조건: b4에서 카론을 구하지 않음, 지하 5층 vip 라운지에서 모두를 학살함
    // 모든 시스템이 정지하고 체제가 붕괴함
    console.log(caronIsDead , killAll)
    if (caronIsDead && killAll) {
      console.log('ENDING 2:: 모두를 죽였다.')
      // await this.playCollapseEnding()
      await Terminal.prompt(i18n.t('web.continue'))
      return
    }

    // 3. 찬탈자의 시대 (Bad Ending: Tyrant)
    // 조건: 지하 5층 vip 레지스탕스를 학살함, 진행하면서 죽인 npc 수 10명 이상
    if (isHostility && player.karma >= 8) {
      console.log('레지스탕스의 적대 후 사신 살해')
      return
    }

    // 4. 영겁의 충복 (Normal Ending: Subjugation)
    // 조건: vip의 편을 들었고, 카론이 죽어 체제에 굴복함.
    if (!fightWithResistance && caronIsDead) {
      console.log('ENDING 4:: 사신의 수하')
      // await this.playServantEnding()
      await Terminal.prompt(i18n.t('web.continue'))
      return
    }

    // 기본 엔딩: 방관자 (조건에 해당하지 않을 경우)
    // 카론을 살리고 레지스탕스에게 협력했으나 기여는 하지 않았다.
    // await this.playBystanderEnding()
    console.log('노멀 엔딩')
    
    await Terminal.prompt(i18n.t('web.continue'))
  }

}
