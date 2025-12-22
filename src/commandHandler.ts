import * as Commands from './commands'
import { COMMAND_GROUPS } from './consts'
import { Player } from './core/Player'
import { printStatus } from './statusPrinter'
import { GameContext, GameMode } from './types'

type CommandFunction = (player: Player, args: string[], context: GameContext) => boolean | string

const mapInput = (cmd: string) => {
  const trimmed = cmd.trim()
  return Object.entries(COMMAND_GROUPS).find(([_, arr]) => arr.includes(trimmed))?.[0] ?? trimmed
}

const parseCommand = (rawCmd: string) => {
  const trimmed = rawCmd.trim();
  
  const firstSeparatorIndex = trimmed.search(/\s+|--/);
  
  // 구분자가 없으면 인자가 없는 단일 명령어로 처리
  if (firstSeparatorIndex === -1) {
    return { cmd: trimmed, args: [] };
  }

  const cmd = trimmed.slice(0, firstSeparatorIndex);
  const remaining = trimmed.slice(firstSeparatorIndex);

  // 2. 나머지 부분을 '--'를 기준으로 나눔
  const args = remaining
    .split('--')
    .map(arg => arg.trim())
    .filter(arg => arg.length > 0);

  return { cmd, args };
}

// --- COMMANDS 객체 ---
const COMMANDS: Record<string, CommandFunction> = {
  up: Commands.moveCommand('up'),
  down: Commands.moveCommand('down'),
  left: Commands.moveCommand('left'),
  right: Commands.moveCommand('right'),
  attack: Commands.attackCommand,
  equip: Commands.equipCommand,
  respawn: Commands.respawnCommand,
  exit: Commands.exitCommand,
  pick: Commands.pickCommand,
  help: Commands.helpCommand,
  inventory: Commands.inventoryCommand,
  status: Commands.statusCommand,
  look: Commands.lookCommand,
  clear: Commands.clearCommand,
}

// --- handleCommand ---
export function handleCommand(rawCmd: string, player: Player, context: GameContext) {
  const trimmed = rawCmd.trim();
  if (!trimmed) return context.rl.prompt();

  // --- [1] DIALOGUE 모드 우선 처리 ---
  // 대화 모드일 때는 COMMAND_GROUPS를 거치지 않고 pendingAction에 모든 입력을 넘깁니다.
  if (context.mode === GameMode.DIALOGUE && context.pendingAction) {
    context.pendingAction(trimmed);
    return;
  }

  // --- [2] 명령어 파싱 및 유효성 검사 ---
  const { cmd: rawCmdName, args } = parseCommand(trimmed);
  console.log('args',args)
  const cmd = mapInput(rawCmdName)
  
  // 허용되지 않은 명령이거나 존재하지 않는 명령인 경우
  if (!cmd || !COMMANDS[cmd]) {
    console.log(`\n[알림] 현재 '${context.mode}' 상태에서는 '${rawCmdName}' 명령을 사용할 수 없거나 존재하지 않습니다.`);
    context.rl.prompt();
    return;
  }

  // --- [3] 명령어 실행 ---
  const fn = COMMANDS[cmd];
  const result = fn(player, args, context);

  if (result === 'exit') return; // 종료 커맨드인 경우

  // --- [4] 후속 처리 (이벤트 및 상태 저장) ---
  if (result) {
    const { map, world, events } = context;
    const currentTile = map.getTile(player.pos.x, player.pos.y);

    // 상태창 출력 (대화 모드가 아닐 때만 시각적 편의를 위해 출력)
    if (context.mode !== GameMode.DIALOGUE) {
      printStatus(player, context);
    }

    // 타일 이벤트 핸들링 (전투 돌입, NPC 대화 시작 등 모드 변경이 여기서 발생)
    events.handle(currentTile, player, context);
  }

  // 자동 세이브 (NPC 상태 및 플레이어 데이터)
  context.save.save({
    player,
    sceneId: context.map.currentSceneId,
    npcs: context.npcs.getSaveData(),
    drop: context.world.lootBags,
  });

  context.rl.prompt();
}