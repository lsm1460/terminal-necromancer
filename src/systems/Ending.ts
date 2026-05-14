import { GameEventType, Terminal } from '~/core'
import i18n from '~/i18n'
import { NPCManager } from '~/systems/NpcManager'
import { AppContext } from '~/systems/types'
import { delay, speak } from '~/utils'

export class Ending {
  static async run(context: AppContext): Promise<void> {
    Terminal.clear()
    
    const { player, events, npcs, eventBus, save } = context

    // 주요 변수 추출
    const death = npcs.getNPC('death')
    const deathIsAlive = death?.isAlive
    const caronIsDead = events.isCompleted('caron_is_dead')
    const caronIsMine = events.isCompleted('caron_is_mine')
    const fightWithResistance = events.isCompleted('join_resistance_battle')
    const killAll = events.isCompleted('third_boss_kill_all')
    const vipIsSafe = events.isCompleted('third_boss_vip')

    const contribution = (npcs as NPCManager).getFactionContribution('resistance')
    const isHostility = (npcs as NPCManager).isFactionHostility('resistance')

    // 1. 진정한 안식 (True Ending)
    // 조건: 카론을 살려 동료로 만들었고, 레지스탕스와 최고 우호도이며, 무고한 살생(karma)이 없어야 함.
    if (
      caronIsMine &&
      !caronIsDead &&
      !isHostility &&
      fightWithResistance &&
      contribution >= 100 &&
      player.karma <= 1
    ) {
      if (player.hasItem('true_ending_key')) {
        await speak(i18n.t(`ending.ending0.dialogue`, { returnObjects: true }) as string[])
        const _res = await Terminal.confirm(i18n.t('ending.ending0.confirm'))

        if (_res) {
          // 떠난다
          await speak(i18n.t(`ending.ending0.leave`, { returnObjects: true }) as string[])

          save && save?.remove?.()
        } else {
          // 남는다.
          await speak(i18n.t(`ending.ending0.stay`, { returnObjects: true }) as string[])
        }
        await delay()
        eventBus.emitAsync(GameEventType.COMPLETE_EVENT, 'ENDING_0')
        Terminal.log(i18n.t('ending.ending0.title'))
      } else {
        events.completeEvent('true_ending_flag')
        await speak(i18n.t(`ending.ending1.dialogue`, { returnObjects: true }) as string[])
        await delay()
        eventBus.emitAsync(GameEventType.COMPLETE_EVENT, 'ENDING_1')
        Terminal.log(i18n.t('ending.ending1.title'))
      }
    } else if (caronIsDead && killAll && player.karma >= 10) {
      // 2. 붕괴
      // 조건: b4에서 카론을 구하지 않음, 지하 5층 vip 라운지에서 모두를 학살함
      await speak(i18n.t(`ending.ending2.dialogue`, { returnObjects: true }) as string[])
      await delay()
      eventBus.emitAsync(GameEventType.COMPLETE_EVENT, 'ENDING_2')
      Terminal.log(i18n.t('ending.ending2.title'))
    } else if (!fightWithResistance && caronIsDead && deathIsAlive) {
      // 3. 죽음의 개
      // 조건: 레지스탕스의 편을 들지 않았고(kill all or with vip), 카론이 죽어 체제에 굴복함.
      await speak(i18n.t(`ending.ending3.dialogue`, { returnObjects: true }) as string[])
      await delay()
      eventBus.emitAsync(GameEventType.COMPLETE_EVENT, 'ENDING_3')
      Terminal.log(i18n.t('ending.ending3.title'))
    } else if (isHostility && player.karma >= 10) {
      // 4. 폭정
      // 조건: 레지스탕스를 학살함, 진행하면서 죽인 npc 수 10명 이상
      await speak(i18n.t(`ending.ending4.dialogue`, { returnObjects: true }) as string[])
      await delay()
      eventBus.emitAsync(GameEventType.COMPLETE_EVENT, 'ENDING_4')
      Terminal.log(i18n.t('ending.ending4.title'))
    } else if (vipIsSafe && contribution < 100) {
      // 5. 새로운 질서
      // 조건: VIP를 구출(질서 유지)했으나 기존 시스템에 속하지 않고 자신만의 세력을 구축함.
      await speak(i18n.t(`ending.ending5.dialogue`, { returnObjects: true }) as string[])
      await delay()
      eventBus.emitAsync(GameEventType.COMPLETE_EVENT, 'ENDING_5')
      Terminal.log(i18n.t('ending.ending5.title'))
    } else {
      // 기본 엔딩: 방관자 (조건에 해당하지 않을 경우)
      // 카론을 살리고 레지스탕스에게 협력했으나 기여는 하지 않았다.
      await speak(i18n.t(`ending.ending6.dialogue`, { returnObjects: true }) as string[])
      await delay()
      eventBus.emitAsync(GameEventType.COMPLETE_EVENT, 'ENDING_6')
      Terminal.log(i18n.t('ending.ending6.title'))
    }

    await delay()
    npcs.setAlive('death')
    save && save.save(context)
    await Terminal.prompt(i18n.t('ending.back_to_title'))
    await eventBus.emitAsync(GameEventType.SYSTEM_EXIT)
  }
}
