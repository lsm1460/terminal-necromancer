import { SaveSystem } from '~/systems/SaveSystem'
import { Terminal } from './Terminal'
import { speak } from '~/utils';

/**
 * UI 환경(CLI/Web)에 따라 다르게 구현될 인터페이스
 */
export interface TitleUI {
  select: (message: string, choices: { name: string; message: string }[]) => Promise<string>
  confirm: (message: string) => Promise<boolean>
  alert: (message: string) => Promise<void>
}

export const INTRO_DIALOGUES = [
  '지독한 악취와 함께 차가운 금속음이 고막을 파고든다.',
  '한때 산 자와 죽은 자의 경계를 허물고 세상을 통치했던 네크로맨서가,\n이제는 낡은 터미널의 차가운 바닥 위에 엎드려 있다.',
  '죽음을 초월했다고 믿었던 오만함은 깨진 유리 파편처럼 흩어졌고,\n군대를 호령하던 위엄은 대답 없는 어둠 속으로 흔적도 없이 침몰했다.',
  '??? : "아직도 그 멍청한 눈을 뜨지 못하는군.\n네놈이 지배하던 그 하찮은 세계의 기억은 이제 버려라."',
  "어둠 속에서 비웃음 섞인 목소리가 들려온다.\n그것은 네크로맨서가 그토록 부정했던 '죽음'의 명백한 현신이다.",
  '??? : "이곳 터미널에선 네놈도 그저 썩어가는 선로를 치우고 시체를 나르는 노역자에 불과하다.\n운이 좋다면... 다음 열차가 오기 전까지는 숨이 붙어 있겠지."',
  '굴욕적인 조롱이 쏟아지지만,\n네크로맨서의 육신은 기괴할 정도로 무거워 대항할 힘조차 느껴지지 않는다.',
  '바닥을 움켜쥔 손등 위로 핏줄이 돋아난다.\n짓밟힌 자존심 너머로, 오직 억눌린 살의만이 차갑게 식어갈 뿐이다.',
  '??? : "가라. 가서 네놈에게 어울리는 쓰레기들과 함께 뒹굴며\n네가 그토록 싫어하던 그 죽음을 위해 봉사해라."',
  '거대한 철문이 비명을 지르며 열리자,\n영원한 안식 혹은 끔찍한 형벌을 기다리는 수만 명의 망자가 뒤섞인 광경이 펼쳐진다.',
  '최종적인 심판을 받기 위해 늘어선 영혼들의 처절한 비명과,\n그들의 죄를 도려내는 거대한 기계 장치들이 굉음을 내뿜는 곳.',
  "질서와 광기가 공존하는 '심판의 층',\n지하 1층의 서늘한 공기가 사령술사였던 자를 맞이한다.",
]

export class Title {
  /**
   * CLI와 Web에서 공통으로 사용하는 게임 시작 흐름 제어 로직
   * @param ui - 각 환경에 맞는 UI 구현체
   * @param save - 세이브 시스템 인스턴스
   * @param initState - 새 게임 시작 시 사용할 초기 데이터
   */
  static async gameStart(save: SaveSystem, initState: any): Promise<any> {
    try {
      let hasSave = save.load()

      while (true) {
        const choices = [
          ...(hasSave ? [{ name: 'load', message: '이어하기' }] : []),
          { name: 'new', message: '새 게임 시작' },
          { name: 'exit', message: '종료' },
        ]

        const menu = await Terminal.select('시작하시겠습니까?', choices)

        if (menu === 'exit') {
          return null
        }

        if (menu === 'load') {
          Terminal.log('\n데이터를 동기화합니다...\n')
          return hasSave
        }

        if (menu === 'new') {
          if (hasSave) {
            const overwrite = await Terminal.confirm(
              '이미 존재하는 저장 데이터가 있습니다. 덮어씌우시겠습니까?'
            )
            if (!overwrite) continue
          }

          // 인트로 시퀀스 진행
          await speak(INTRO_DIALOGUES)

          // 초기 데이터로 저장소 갱신
          save.save(initState)
          Terminal.log('새로운 운명이 시작됩니다.\n')
          return initState
        }
        break
      }
    } catch (e: any) {
      if (e.message === 'EXIT') return null
      throw e
    }
  }
}