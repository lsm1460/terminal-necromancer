import { Player } from '~/core/player/Player'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const OliverHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_oliver')

    if (alreadyTalk) {
      return [{ name: 'talk', message: '💬 잡담' }]
    } else {
      return [{ name: 'event', message: '🔍 살펴보기' }]
    }
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'event':
        await handleEvent(npc, player, context)
        break
      default:
        break
    }
  },
}

async function handleEvent(npc: NPC, player: Player, context: GameContext) {
  const { events, world } = context
  const dialogues = [
    '올리버: (복부에 깊은 상처를 입은 채, 주방 조리대에 기대어 거칠게 숨을 몰아쉽니다.)',
    '올리버: 크윽... 결국 그들이 왔군요. 이 화려한 지옥을 무너뜨릴 불꽃들이...',
    '올리버: 매일 밤 이 냄새나는 은식기들을 닦으며 기도했습니다. 이 오만한 성벽이 무너지기를!',
    '올리버: 저 위층 인간들... 우리가 흘린 땀을 와인처럼 마시며 웃더군요.\n그 웃음소리가 주방까지 들릴 때마다 심장이 타들어 가는 것 같았습니다.',
    '올리버: 레지스탕스는... 우리 같은 쥐새끼들에게도 빛이 있다는 걸 보여줄 겁니다.\n이 피는... 그들을 위한 제물일 뿐이에요.',
    '올리버: 내가 죽어도 상관없어. 곧 저 잘난 VIP 놈들도 우리와 같은 바닥에서 뒹굴게 될 테니까!',
    '올리버: (핏기 가신 입술로 비릿한 웃음을 지으며) 어서 가서 구경하세요... 저들의 세상이 잿더미가 되는 그 장관을...',
  ]

  await speak(dialogues)

  events.completeEvent('b5_oliver')
  npc.dead(0)

  world.addCorpse({
    ...npc,
    ...player.pos,
  })
}

export default OliverHandler
