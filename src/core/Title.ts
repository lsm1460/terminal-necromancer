import enquirer from 'enquirer'
import fs from 'fs'
import path from 'path'
import { SaveSystem } from '../systems/SaveSystem'

export class Title {
  static async gameStart(save: SaveSystem) {
    console.clear()

    // 1. 심플한 타이틀 및 부제
    console.log(`
           [ TERMINAL ]
    "죽음이 너희를 자유케 하리라"
    ------------------------`)

    try {
      let hasSave = save.load()
      // 2. 메뉴 선택
      while (true) {
        const { menu } = await enquirer.prompt<{ menu: string }>({
          type: 'select',
          name: 'menu',
          message: '시작하시겠습니까?',
          choices: [
            ...(hasSave ? [{ name: 'load', message: '이어하기' }] : []),
            { name: 'new', message: '새 게임 시작' },
            { name: 'exit', message: '종료' },
          ],
        })

        if (menu === 'exit') throw new Error('EXIT')
        if (menu === 'load') console.log('\n게임을 시작합니다.\n')
        if (menu === 'new') {
          // new game..
          if (hasSave) {
            const { overwrite } = await enquirer.prompt<{ overwrite: boolean }>({
              type: 'confirm',
              name: 'overwrite',
              message: '이미 존재하는 저장 데이터가 있습니다. 덮어씌우시겠습니까?',
              initial: false, // 실수 방지를 위해 기본값을 No(false)로 설정
            })

            if (!overwrite) {
              // '아니오' 선택 시 다시 타이틀 시작 (재귀 호출)
              continue
            }
          }

          const assets = path.join(__dirname, '../assets')
          const initPath = path.join(assets, 'init_state.json')
          const initData = JSON.parse(fs.readFileSync(path.resolve(initPath), 'utf-8'))
    
          save.save(initData)
    
          hasSave = initData

          // 3. 간결한 도입 다이얼로그
          const dialogues = [
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
    
          for (const message of dialogues) {
            await enquirer.prompt({
              type: 'input',
              name: 'confirm',
              message,
              // 입력값은 필요 없고 진행을 위한 대기 용도
              result: () => '',
              format: () => ' (계속하려면 Enter)',
            })
          }
    
          console.log('진입 중...\n')
        }
        //
        break
      }

      return hasSave
    } catch (e: any) {
      console.log('터미널을 떠납니다..')
      process.exit()
    }
  }
}
