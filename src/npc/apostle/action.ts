import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { delay } from '~/utils'

export const ApostleActions = {
  async handleEvent(context: AppContext) {
    const script = i18n.t('npc.apostle.event.script', { returnObjects: true }) as { text: string; delay: number }[]

    // 인트로 로그 출력 (회색)
    Terminal.log(`\x1b[90m${i18n.t('npc.apostle.event.intro_log')}\x1b[0m`)

    // 스크립트 순차 출력
    for (const line of script) {
      await delay(line.delay)
      Terminal.log(line.text)
    }

    // 이벤트 완료 처리
    context.events.completeEvent('b3_apostle')
    return true
  }
}