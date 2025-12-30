import { SKILL_GROUPS } from '../consts'
import { Player } from '../core/Player'
import { SKILL_LIST, SkillNameMap } from '../core/skill'
import { CommandFunction, SkillId } from '../types'

export const skillCommand: CommandFunction = (player, args, context) => {
  // 1. 인자가 없는 경우: 사용 가능한 스킬 목록 출력
  if (args.length === 0) {
    printSkillList(player)
    return false
  }

  // 2. 입력된 한글/영어 이름을 내부 SkillId로 변환
  const inputName = args[0]
  const skillId = SkillNameMap[inputName] as SkillId

  // 3. 유효성 검사 (존재 여부 및 해금 여부)
  if (!skillId || !SKILL_LIST[skillId]) {
    console.log(`\n[오류] '${inputName}'은(는) 존재하지 않는 기술입니다.`)
    return false
  }

  if (!player.hasSkill(skillId)) {
    console.log(`\n[오류] 아직 배우지 못한 기술입니다.`)
    return false
  }

  const targetSkill = SKILL_LIST[skillId]

  // 4. 자원(MP) 체크
  if (player.mp < targetSkill.cost) {
    console.log(`\n[오류] 마력이 부족합니다. (필요: ${targetSkill.cost} / 현재: ${player.mp})`)
    return false
  }

  // 5. 스킬 실행 및 마력 소모
  // 실행 성공 시에만 마력을 소모하도록 execute의 반환값을 활용할 수도 있습니다.
  targetSkill.execute(player, context, args.slice(1))
  player.mp -= targetSkill.cost

  return false // 이동이 아니므로 항상 false
}

function printSkillList(player: Player) {
  const unlocked = player.unlockedSkills; // SkillId[] (예: ['RAISE_SKELETON'])

  console.log(`\n==========================================`);
  console.log(` 🔮 사용 가능한 기술 (현재 MP: ${player.mp})`);
  console.log(`==========================================`);

  if (unlocked.length === 0) {
    console.log(`  아직 습득한 기술이 없습니다.`);
  } else {
    unlocked.forEach((id: SkillId) => {
      const skill = SKILL_LIST[id];
      const aliases = SKILL_GROUPS[id]; // 해당 스킬의 모든 에일리어스 가져오기

      if (skill && aliases) {
        // 첫 번째 에일리어스를 제외한 나머지를 단축어로 표시
        const mainName = aliases[0];
        const shortCuts = aliases.slice(1).join(', ');

        console.log(` ▶ ${skill.name} (소모: ${skill.cost})`);
        if (shortCuts) {
          console.log(`   └ 입력어: ${aliases.join(', ')}`);
        }
        console.log(`   - ${skill.description}`);
        console.log(''); // 가독성을 위한 한 줄 띄움
      }
    });
  }

  console.log(`==========================================`);
  console.log(` 사용법: 스킬 --[입력어] --[대상]`);
  console.log(` 예시: 스킬 --sk --고블린`);
  console.log(`==========================================`);
}