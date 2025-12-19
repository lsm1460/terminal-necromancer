import { Direction, Vector } from "./types"

export const COMMAND_GROUPS: Record<string, string[]> = {
  up: ['up', '위', 'u', 't', '위로', '올라가기', '북', '북쪽', 'north', 'n'],
  down: ['down', '아래', 'd', 'b', '아래로', '내려가기', '남', '남쪽', 'south'],
  left: ['left', '왼쪽', 'l', '좌', '좌측', '서', '서쪽', 'west', 'w'],
  right: ['right', '오른쪽', 'r', 'e', '우', '우측', '동', '동쪽', 'east'],
  attack: ['attack', '공격', 'a', 'hit', '때리기', '공격하기'],
  respawn: ['respawn', '부활', 'resp', '다시살아나기'],
  pick: ['pick', 'p', '줍기', '획득', '집기', '들기'],
  help: ['help', '도움말', '/?', '도움', '명령', '명령어'],
  inventory: ['inventory', 'inven', 'i', '인벤토리', '가방', '아이템', '소지품'],
  status: ['status', '스탯', '상태', 'stat', '정보', '정보창'],
  look: ['look', '보기', '보다', '확인', '조사', '관찰'],
  clear: ['clear', 'cls', '화면지우기'],
}

export const DIRECTIONS: Record<Direction, Vector> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}