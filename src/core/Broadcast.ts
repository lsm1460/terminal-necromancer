import fs from 'fs'
import path from 'path'
import { EventSystem } from '~/systems/EventSystem'
import { BroadcastScript } from '~/types'
import { Logger } from './Logger'
import { NPCManager } from './NpcManager'

export class Broadcast {
  private scripts: Record<string, BroadcastScript>
  private pendingQueue: string[] = []
  private playProgress: Record<string, number> = {}
  private playedState: Record<string, boolean> = {}

  private justFinishedEvent = false

  private bridgeMemos = [
    '📢 이전 보고에 이어 추가 알림입니다...',
    '📢 다음 소식입니다...',
    '📢 치이익... 긴급 갱신된 정보입니다.',
    '📢 방금 들어온 추가 제보를 전해드립니다.',
  ]

  private terminalMessages = [
    // 시설 관리 및 공지
    '📢 "알립니다. 제3구역 냉각수 유출이 감지되었습니다. 인근 인부들은 즉시 대피하십시오."',
    '📢 "공지: 금일 하역 스케줄이 지연됨에 따라 배급량이 15% 삭감됩니다."',
    '📢 "치익... 현재 지하 3층 산소 농도 88%. 정상 범주입니다. 노역을 지속하십시오."',

    // 경고 및 보안
    '📢 "경고. 인가되지 않은 영령 에너지가 감지되었습니다. 보안 등급을 상향합니다."',
    '📢 "알립니다. 최근 적발된 내부 첩자는 하역장 압착기에서 즉각 처형되었습니다."',
    '📢 "보안 수칙 준수: 허가되지 않은 시체 점유는 엄격히 금지되어 있습니다."',

    // 세계관 선전 (Propaganda)
    '📢 "위대한 강철의 시대. 육신은 썩으나 기계는 영원합니다."',
    '📢 "사령술은 질병입니다. 이상 증세를 보이는 동료는 즉시 관리국에 신고하십시오."',
    '📢 "오늘의 구호: 더 높은 적재, 더 빠른 공정, 더 완벽한 통제."',

    // 사무적이고 무심한 보고
    "📢 \"미수습 사체 47구 확인. 폐기 공정으로 이송을 시작합니다.\"",
    "📢 \"치익... 금일 사망한 인부들의 유품은 정오에 일괄 소각됩니다.\"",
    "📢 \"하역 효율 4% 감소. 원인은 인적 자원의 노후화로 판단됩니다.\"",
    
    // 비정한 통제
    "📢 \"알립니다. 비명은 소음 공해입니다. 정숙을 유지하십시오.\"",
    "📢 \"탈출 시도는 자유이나, 사살 후 재활용 권한은 관리국에 있습니다.\"",
    "📢 \"보안팀 공지: 침입자 발견 시 생포하지 마십시오. 탄약이 아깝습니다.\"",

    // 건조한 세계관 묘사
    "📢 \"기계는 거짓말을 하지 않습니다. 당신의 근육보다 엔진을 믿으십시오.\"",
    "📢 \"사령술사 포착. 생체 반응 정지 후 다시 보고할 예정입니다. 이상.\"",
    "📢 \"하역장은 당신의 감정에 관심이 없습니다. 상자를 옮기십시오.\"",
    "📢 \"치직... 누출된 냉각수는 인체의 70%를 즉시 동결시킵니다. 참고하십시오.\"",

    // 미아/자산 분실 관련 (기괴하고 시크함)
    "📢 \"알립니다. 제2하역장에서 소형 인적 자원(미아)이 발견되었습니다. 소유주는 폐기 전 수거하십시오.\"",
    "📢 \"공지: 유실된 아동을 보관 중입니다. 6시간 내 미수거 시 하역장 자동 청소 시스템에 투입됩니다.\"",
    "📢 \"치익... 분실된 아이를 찾는 부모에게 알립니다. 감정적 동요는 작업 효율을 저해합니다. 즉시 복귀하십시오.\"",
    "📢 \"알립니다. 인지 능력이 미성숙한 개체가 궤도를 이탈했습니다. 발견 시 가까운 수거함에 넣어주십시오.\"",

      // 무심한 일상 보고
    "📢 \"오늘의 분실물: 의수 1개, 낡은 인형, 신원 미상의 손가락. 주인을 찾지 않습니다. 소각 예정입니다.\"",
    "📢 \"치직... 하역장 내에서 울음소리가 감지되었습니다. 보안팀은 소음 발생원을 즉각 제거하십시오.\"",
    "📢 \"공지: 자산 보호를 위해 아동의 발목에 인식표를 부착하십시오. 미부착 개체는 유기물로 분류됩니다.\"",

    // 냉소적인 통제
    "📢 \"알립니다. 가족을 찾는 행위는 인가되지 않은 개인 활동입니다. 할당량을 채운 뒤 사유하십시오.\"",
    "📢 \"치익... 분실된 개체 '에이미(7세)'의 인식표가 파손된 채 발견되었습니다. 그냥 그렇다고요.\"",
  ]

  constructor(
    scriptPath: string,
    private npcManager: NPCManager,
    eventSystem: EventSystem
  ) {
    this.scripts = JSON.parse(fs.readFileSync(path.resolve(scriptPath), 'utf-8'))

    eventSystem.subscribe((eventId) => this.onEventCleared(eventId))
  }

  private onEventCleared(eventId: string) {
    if (this.scripts[eventId] && !this.playedState[eventId]) {
      this.pendingQueue.push(eventId)
    }
  }

  async play() {
    // 0. 대기열이 없으면 랜덤 멘트 발송
    if (this.pendingQueue.length === 0) {
      const BROADCAST_CHANCE = 0.15

      if (Math.random() < BROADCAST_CHANCE) {
        const randomIndex = Math.floor(Math.random() * this.terminalMessages.length)
        const message = this.terminalMessages[randomIndex]

        Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        Logger.log(`📡 [터미널 브로드캐스팅: 에코]`)
        Logger.log(`  ${message}`)
        Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }

      return
    }

    const currentEventId = this.pendingQueue[0]
    const content = this.scripts[currentEventId]
    const currentIndex = this.playProgress[currentEventId] || 0

    // 2. 헤더 출력
    Logger.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    Logger.log(`📡 [터미널 브로드캐스팅: 에코]`)

    // 3. 브릿지 멘트 출력 조건 (새 이벤트 시작 + 이전 이벤트가 방금 끝났을 때)
    if (currentIndex === 0 && this.justFinishedEvent) {
      const randomBridge = this.bridgeMemos[Math.floor(Math.random() * this.bridgeMemos.length)]
      Logger.log(`  ${randomBridge}`)

      // 브릿지를 한 번 출력했으므로 플래그 초기화
      this.justFinishedEvent = false
    }

    // 4. 메인 대사 출력 (printNextLine 로직 통합)
    const isHostile = this.npcManager.getFactionContribution('resistance') >= 70
    const lines = isHostile ? content.hostile : content.normal

    if (currentIndex < lines.length) {
      Logger.log(`  📢 "${lines[currentIndex]}"`)

      // 진행도 업데이트
      this.playProgress[currentEventId] = currentIndex + 1

      // 해당 이벤트의 모든 줄을 다 읽었는지 확인
      if (this.playProgress[currentEventId] >= lines.length) {
        this.playedState[currentEventId] = true
      }
    }

    Logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    // 5. 이벤트가 완전히 종료되었다면 큐에서 제거하고 플래그 세우기
    if (this.playedState[currentEventId]) {
      this.pendingQueue.shift()
      this.justFinishedEvent = true // 다음 play() 호출 시 브릿지 출력 대상이 됨
    }
  }
}
