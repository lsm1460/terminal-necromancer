import React, { useEffect, useRef, useState } from 'react';
import { assets } from './assets';
import { Logger } from './core/Logger';
import { Title } from './core/Title';
import { GameEngine } from './gameEngine';
import { ReactRenderer, UIState } from './renderers/ReactRenderer';
import { SaveSystem } from './systems/SaveSystem';

export const App = () => {
  // --- 상태 관리 ---
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [uiState, setUI] = useState<UIState>({ 
    type: 'NONE', message: '', resolve: () => {} 
  });

  // --- 참조(Ref) 관리 ---
  const engineRef = useRef<GameEngine | null>(null);
  const saveSystemRef = useRef(new SaveSystem(assets.state));
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 자동 스크롤 효과 ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, uiState]);

  // --- 게임 초기화 및 실행 ---
  useEffect(() => {
    const initGame = async () => {
      // 1. 렌더러 및 로거 설정
      const renderer = new ReactRenderer(setLogs, setStatus, setUI);
      Logger.setRenderer(renderer);

      // 2. 엔진 생성
      const engine = new GameEngine(assets, renderer, saveSystemRef.current);
      engineRef.current = engine;

      // 3. 타이틀 시퀀스 시작 (Logger를 통해 UIState와 연결됨)
      // CLI와 동일한 Title.gameStart 로직을 그대로 사용합니다.
      const playData = await Title.gameStart(saveSystemRef.current, assets.state);

      if (playData) {
        await engine.init(playData);
        await engine.start();
      }
    };

    initGame();
  }, []);

  // --- 명령어 입력 처리 ---
  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const cmd = e.currentTarget.value;
      setLogs(prev => [...prev, `> ${cmd}`]); // 유저가 입력한 명령어를 로그에 표시
      engineRef.current?.processCommand(cmd);
      e.currentTarget.value = '';
    }
  };

  // --- 공통 UI 선택 처리 함수 ---
  const handleUIResolve = (value: any, displayValue?: string) => {
    if (displayValue) {
      setLogs(prev => [...prev, `> ${displayValue}`]);
    }
    const resolveFunc = uiState.resolve;
    setUI({ type: 'NONE', message: '', resolve: () => {} }); // UI 닫기
    resolveFunc(value); // 엔진의 await 해제
  };

  return (
    <div className="terminal-container">
      {/* 상단 상태 바 (Status Board) */}
      {status && (
        <div className="status-bar">
          <span>LV. {status.level}</span> | 
          <span>HP: {status.hp}/{status.maxHp}</span> | 
          <span>GOLD: {status.gold}</span> | 
          <span>LOC: {status.location}</span>
        </div>
      )}

      {/* 중앙 로그 출력창 */}
      <div className="log-window" ref={scrollRef}>
        {logs.map((log, i) => (
          <div key={i} className="log-line">{log}</div>
        ))}

        {/* 인터랙티브 요소 (질문 및 선택 버튼) */}
        {uiState.type !== 'NONE' && (
          <div className="interactive-area">
            <div className="question">▶ {uiState.message}</div>
            <div className="button-group">
              {uiState.type === 'SELECT' && uiState.choices?.map(c => (
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
                <button onClick={() => handleUIResolve(undefined)}>
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
          placeholder={uiState.type !== 'NONE' ? "선택지를 클릭하세요..." : "명령어를 입력하세요..."}
          disabled={uiState.type !== 'NONE'}
        />
      </div>

      <style>{`
        .terminal-container { background: #000; color: #00ff00; height: 100vh; display: flex; flex-direction: column; font-family: 'Courier New', monospace; }
        .status-bar { padding: 10px; border-bottom: 1px solid #00ff00; display: flex; gap: 20px; font-weight: bold; }
        .log-window { flex: 1; overflow-y: auto; padding: 20px; white-space: pre-wrap; line-height: 1.6; }
        .log-line { margin-bottom: 4px; }
        .interactive-area { margin-top: 20px; padding: 15px; border: 1px dashed #00ff00; background: #0a0a0a; }
        .question { margin-bottom: 10px; color: #ffff00; }
        .button-group { display: flex; gap: 15px; flex-wrap: wrap; }
        button { background: none; border: none; color: #00ff00; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 5px 10px; border: 1px solid transparent; }
        button:hover { background: #00ff00; color: #000; }
        .input-area { padding: 15px; border-top: 1px solid #00ff00; display: flex; align-items: center; }
        .prompt-char { margin-right: 10px; }
        input { background: none; border: none; color: #00ff00; flex: 1; outline: none; font-family: inherit; font-size: 1rem; }
      `}</style>
    </div>
  );
};