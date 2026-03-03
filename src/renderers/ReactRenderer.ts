import { Player } from '~/core/player/Player'
import { GameContext, Renderer } from '~/types'

/**
 * 리액트 컴포넌트에서 UI 대기 상태를 관리하기 위한 인터페이스
 */
export interface UIState {
  type: 'SELECT' | 'CONFIRM' | 'PROMPT' | 'NONE';
  message: string;
  choices?: { name: string; message: string }[];
  resolve: (value: any) => void; // 유저가 클릭했을 때 Promise를 해결할 함수
}

export class ReactRenderer implements Renderer {
  /**
   * @param setLogs - 로그 배열을 업데이트하는 리액트 Dispatch
   * @param setStatus - 플레이어 상태(HP, 골드 등)를 업데이트하는 리액트 Dispatch
   * @param setUI - 현재 대기 중인 입력(질문/선택지) 상태를 제어하는 리액트 Dispatch
   */
  constructor(
    private setLogs: React.Dispatch<React.SetStateAction<string[]>>,
    private setStatus: React.Dispatch<React.SetStateAction<any>>,
    private setUI: React.Dispatch<React.SetStateAction<UIState>>
  ) {}

  // --- 기본 출력 메서드 ---

  print(message: string): void {
    // 이전 로그 목록에 새로운 메시지를 한 줄 추가합니다.
    this.setLogs((prev) => [...prev, message]);
  }

  clear(): void {
    // 로그 창을 비웁니다.
    this.setLogs([]);
    // 진행 중인 입력 UI도 초기화합니다.
    this.setUI({ type: 'NONE', message: '', resolve: () => {} });
  }

  printStatus(player: Player, context: GameContext): void {
    // UI 컴포넌트에서 필요한 데이터만 객체로 묶어 전달합니다.
    this.setStatus({
      hp: player.hp,
      maxHp: player.maxHp,
      level: player.level,
      exp: player.exp,
      gold: player.gold,
      location: context.map.currentSceneId,
      // 필요한 다른 상태값들을 추가하세요 (예: 공격력, 방어력 등)
    });
  }

  // --- 비동기 입력 메서드 (Logger.ts와 연결됨) ---

  /**
   * 리액트 로그 창 하단에 선택 버튼들을 띄우고 유저가 클릭할 때까지 대기합니다.
   */
  async select(message: string, choices: { name: string; message: string }[]): Promise<string> {
    return new Promise((resolve) => {
      this.setUI({
        type: 'SELECT',
        message,
        choices,
        resolve, // 유저가 리액트 버튼을 클릭하면 이 resolve가 실행되면서 await가 해제됩니다.
      });
    });
  }

  /**
   * 예/아니오 선택지를 띄우고 결과를 기다립니다.
   */
  async confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.setUI({
        type: 'CONFIRM',
        message,
        resolve,
      });
    });
  }

  /**
   * 메시지를 보여주고 "계속" 버튼을 누를 때까지 엔진 흐름을 일시 중단합니다. (인트로/대화용)
   */
  async prompt(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.setUI({
        type: 'PROMPT',
        message,
        resolve,
      });
    });
  }
}