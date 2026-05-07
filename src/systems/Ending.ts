import { Terminal } from "~/core"
import i18n from "~/i18n"
import { NPCManager } from "~/systems/NpcManager"
import { AppContext } from "~/systems/types"

export class Ending {
  static async run(context: AppContext): Promise<void> {
    const { player, events, npcs } = context

    // 주요 변수 추출
    const deathIsAlive = npcs.getNPC('death')?.isAlive
    const caronIsDead = events.isCompleted('caron_is_dead')
    const caronIsMine = events.isCompleted('caron_is_mine')
    const fightWithResistance = events.isCompleted('join_resistance_battle')
    const killAll = events.isCompleted('third_boss_kill_all')
    const vipIsSafe = events.isCompleted('third_boss_vip')
    
    const contribution = (npcs as NPCManager).getFactionContribution('resistance')
    const isHostility = (npcs as NPCManager).isFactionHostility('resistance')

    // 1. 진정한 안식 (True Ending)
    // 조건: 카론을 살려 동료로 만들었고, 레지스탕스와 최고 우호도이며, 무고한 살생(karma)이 없어야 함.
    if (caronIsMine && !caronIsDead && !isHostility && fightWithResistance && contribution >= 100 && player.karma <= 1) {
      if(player.hasItem('true_ending_key')) {
        // Terminal.confirm('저장을 지우고 윤회를 끊어낸다.')

        return
      }

      console.log('ENDING 1:: 새로운 관리자 - 혁명')
      return
    }

    // 2. 차원의 붕괴 (Bad Ending: Annihilation)
    // 조건: b4에서 카론을 구하지 않음, 지하 5층 vip 라운지에서 모두를 학살함
    // 모든 시스템이 정지하고 체제가 붕괴함
    if (caronIsDead && killAll) {
      console.log('ENDING 2:: 모두를 죽였다.')
      // await this.playCollapseEnding()
      await Terminal.prompt(i18n.t('web.continue'))
      return
    }

    // 3. 영겁의 충복 (Normal Ending: Subjugation)
    // 조건: 레지스탕스의 편을 들지 않았고(kill all or with vip), 카론이 죽어 체제에 굴복함.
    if (!fightWithResistance && caronIsDead && deathIsAlive) {
      console.log('ENDING 3:: 사신의 수하')
      // await this.playServantEnding()
      await Terminal.prompt(i18n.t('web.continue'))
      return
    }

    // 4. 찬탈자의 시대 (Bad Ending: Tyrant)
    // 조건: 지하 5층 vip 레지스탕스를 학살함, 진행하면서 죽인 npc 수 10명 이상
    if (isHostility && player.karma >= 8) {
      console.log('ENDING 4:: 새로운 관리자 - 폭정')
      return
    }

    

    // 5. 새로운 신의 탄생 (Neutral Ending: Ascendance)
    // 조건: VIP를 구출(질서 유지)했으나 기존 시스템에 속하지 않고 자신만의 세력을 구축함.
    if (vipIsSafe && contribution < 100) {
      // await this.playNewGodEnding()
      console.log('ENDING 5:: 새로운 관리자 - 질서')
      return
    }

    // 기본 엔딩: 방관자 (조건에 해당하지 않을 경우)
    // 카론을 살리고 레지스탕스에게 협력했으나 기여는 하지 않았다.
    // await this.playBystanderEnding()
    console.log('노멀 엔딩')
    
    await Terminal.prompt(i18n.t('web.continue'))
  }

}
