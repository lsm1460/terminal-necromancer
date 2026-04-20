import { Player } from './Player';

export type StatModifier = {
  key: 'maxHp' | 'maxMp' | 'atk' | 'def' | 'crit' | 'eva';
  value: (current: number, player: Player) => number;
};

export class StatsCalculator {
  static getMaxHp(player: Player): number {
    let maxHp = player._maxHp;
    maxHp += player.equipped.weapon?.hp || 0;
    maxHp += player.equipped.armor?.hp || 0;

    // 외부 수정자 적용 (예: BLOOD 어픽스 로직이 여기서 실행됨)
    return this.applyModifiers(maxHp, 'maxHp', player);
  }

  static getMaxMp(player: Player): number {
    let maxMp = player._maxMp;
    maxMp += player.equipped.weapon?.mp || 0;
    maxMp += player.equipped.armor?.mp || 0;

    // 외부 수정자 적용
    return this.applyModifiers(maxMp, 'maxMp', player);
  }

  static getComputed(player: Player) {
    let atk = player.atk + (player.equipped.weapon?.atk || 0);
    let def = player.def + (player.equipped.armor?.def || 0);
    let crit = player.crit + (player.equipped.weapon?.crit || 0);
    let eva = player.eva + (player.equipped.armor?.eva || 0);
    const attackType = player.equipped.weapon?.attackType || 'melee';

    return {
      maxHp: this.getMaxHp(player),
      maxMp: this.getMaxMp(player),
      atk: this.applyModifiers(atk, 'atk', player),
      def: this.applyModifiers(def, 'def', player),
      crit: this.applyModifiers(crit, 'crit', player),
      eva: this.applyModifiers(eva, 'eva', player),
      attackType,
    };
  }

  private static applyModifiers(base: number, key: StatModifier['key'], player: Player): number {
    return player.modifiers
      .filter((mod) => mod.key === key)
      .reduce((val, mod) => mod.value(val, player), base);
  }
}