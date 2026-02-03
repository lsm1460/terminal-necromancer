import { CombatUnit } from './CombatUnit'

export class TargetSelector {
  private choices: { name: string; message: string; disabled: boolean; unit: CombatUnit }[]

  constructor(private units: CombatUnit[]) {
    // 초기화: 기본 유닛 정보를 매핑해둠
    this.choices = this.units.map((u) => ({
      name: u.id,
      message: `${u.name} (HP: ${u.ref.hp})`,
      disabled: false,
      unit: u, // 내부 로직용 참조
    }))
  }

  // 1. 공통: 은신 체크 (기본으로 적용하거나 선택적으로 호출)
  excludeStealth() {
    this.choices.forEach((c) => {
      if (c.unit.deBuff.some((d) => d.type === 'stealth')) {
        c.disabled = true
        c.message += ' \x1b[90m(은신)\x1b[0m'
      }
    })
    return this // 체이닝을 위해 자신을 반환
  }

  // 2. 특정 조건 체크 (이름과 이유를 받음)
  excludeIf(predicate: (u: CombatUnit) => boolean, reason: string) {
    this.choices.forEach((c) => {
      if (!c.disabled && predicate(c.unit)) {
        c.disabled = true
        c.message += ` \x1b[90m${reason}\x1b[0m`
      }
    })
    return this
  }

  labelIf(predicate: (u: CombatUnit) => boolean, label: string) {
    this.choices.forEach(c => {
      if (predicate(c.unit)) {
        // 이미 라벨이 붙어있을 수 있으니 뒤에 추가
        c.message += ` \x1b[36m${label}\x1b[0m`; // 상태는 청록색(Cyan) 등으로 강조
      }
    });
    return this;
  }

  build() {
    return {
      units: this.choices.map(({unit}) => unit),
      choices: this.choices.map(({ unit, ...rest }) => rest)
    }
  }
}
