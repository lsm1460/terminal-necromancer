import { Terminal } from "~/core"
import i18n from "~/i18n"
import { AppContext } from "~/systems/types"
import { speak } from "~/utils"

const completeEvents = (context: AppContext, count: number) => {
  for (let i = 1; i <= count; i++) {
    context.events.completeEvent(`talk_echo_${i}`)
  }
}

export const EchoActions = {
  async handleFirst(context: AppContext) {
    await speak(i18n.t('npc.echo.talk1', { returnObjects: true }) as string[])
    completeEvents(context, 1)
    return true
  },
  async handleSecond(context: AppContext) {
    await speak(i18n.t('npc.echo.talk2', { returnObjects: true }) as string[])
    completeEvents(context, 2)
    return true
  },
  async handleThird(context: AppContext) {
    await speak(i18n.t('npc.echo.talk3', { returnObjects: true }) as string[])
    completeEvents(context, 3)
    return true
  },
  async handleFourth(context: AppContext) {
    await speak(i18n.t('npc.echo.talk4', { returnObjects: true }) as string[])
    completeEvents(context, 4)
    return true
  },
  async handleFifth(context: AppContext) {
    await speak(i18n.t('npc.echo.talk5', { returnObjects: true }) as string[])
    completeEvents(context, 5)
    return true
  },
  async handleSixth(context: AppContext) {
    const isVIPLost = context.events.isCompleted('vips_lost')
    await speak(i18n.t(`npc.echo.${isVIPLost?  'talk6_2' : 'talk6_1'}`, { returnObjects: true }) as string[])
    completeEvents(context, 6)
    return true
  },
  async handleSeventh(context: AppContext) {
    const join = context.events.isCompleted('join_resistance_battle')
    await speak(i18n.t(`npc.echo.${join?  'talk7_2' : 'talk7_1'}`, { returnObjects: true }) as string[])
    completeEvents(context, 7)
    return true
  },
}
