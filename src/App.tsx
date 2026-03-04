import React, { useEffect, useMemo, useRef, useState } from 'react'
import { assets, initState } from './assets'
import { Logger } from './core/Logger'
import { Title } from './core/Title'
import { GameEngine } from './gameEngine'
import { ReactRenderer, UIState } from './renderers/ReactRenderer'
import { SaveSystem } from './systems/SaveSystem'

export const App = () => {
  // --- 상태 관리 ---
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<any>(null)
  const [uiState, setUI] = useState<UIState>({
    type: 'NONE',
    message: '',
    resolve: () => {},
  })

  // --- 참조(Ref) 관리 ---
  const engineRef = useRef<GameEngine | null>(null)
  const saveSystemRef = useRef(new SaveSystem(assets.state))
  const scrollRef = useRef<HTMLDivElement>(null)

  // --- 자동 스크롤 효과 ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, uiState])

  // --- 게임 초기화 및 실행 ---
  useEffect(() => {
    const initGame = async () => {
      // 1. 렌더러 및 로거 설정
      const renderer = new ReactRenderer(setLogs, setStatus, setUI)
      Logger.setRenderer(renderer)

      // 2. 엔진 생성
      const engine = new GameEngine(assets, renderer, saveSystemRef.current)
      engineRef.current = engine

      // 3. 타이틀 시퀀스 시작 (Logger를 통해 UIState와 연결됨)
      const playData = await Title.gameStart(saveSystemRef.current, initState)
      
      if (playData) {
        await engine.init(playData)
        await engine.start()
      }
    }

    initGame()
  }, [])

  const disabledInput = useMemo(() => uiState.type !== 'NONE' && uiState.type !== 'PROMPT', [uiState])

  // --- 명령어 입력 처리 ---
  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const cmd = e.currentTarget.value
      setLogs((prev) => [...prev, `> ${cmd}`]) // 유저가 입력한 명령어를 로그에 표시
      e.currentTarget.value = ''
      await engineRef.current?.processCommand(cmd)
    }
  }

  // --- 공통 UI 선택 처리 함수 ---
  const handleUIResolve = (value: any, displayValue?: string) => {
    if (displayValue) {
      setLogs((prev) => [...prev, displayValue])
    }
    const resolveFunc = uiState.resolve
    setUI({ type: 'NONE', message: '', resolve: () => {} }) // UI 닫기
    resolveFunc(value) // 엔진의 await 해제
  }

  return (
    <div className="terminal-container">
      {/* 상단 상태 바 (Status Board) */}
      {status && (
        <div className="status-bar">
          <span>LV. {status.level}</span> |
          <span>
            HP: {status.hp}/{status.maxHp}
          </span>{' '}
          |<span>GOLD: {status.gold}</span> |<span>LOC: {status.location}</span>
        </div>
      )}

      {/* 중앙 로그 출력창 */}
      <div className="log-window" ref={scrollRef}>
        {logs.map((log, i) => (
          <div key={i} className="log-line">
            {log}
          </div>
        ))}

        {/* 인터랙티브 요소 (질문 및 선택 버튼) */}
        {uiState.type !== 'NONE' && (
          <div className="interactive-area">
            <div className="question">▶ {uiState.message}</div>
            <div className="button-group">
              {uiState.type === 'SELECT' &&
                uiState.choices?.map((c) => (
                  <button key={c.name} onClick={() => handleUIResolve(c.name, c.message)}>
                    [{c.message}]
                  </button>
                ))}

              {uiState.type === 'CONFIRM' && (
                <>
                  <button onClick={() => handleUIResolve(true, '예')}>[예]</button>
                  <button onClick={() => handleUIResolve(false, '아니오')}>[아니오]</button>
                </>
              )}

              {uiState.type === 'PROMPT' && (
                <button onClick={() => handleUIResolve(undefined, uiState.message)}>
                  [계속하려면 클릭 또는 Enter]
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 하단 입력창 (게임 플레이 중일 때만 활성화 권장) */}
      <div className="input-area">
        <span className="prompt-char">{'>'}</span>
        <input
          autoFocus
          onKeyDown={handleCommand}
          placeholder={disabledInput ? '선택지를 클릭하세요...' : '명령어를 입력하세요...'}
          disabled={disabledInput}
        />
      </div>
    </div>
  )
}
