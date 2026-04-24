import i18n from "~/i18n";
import { getOriginId } from "../utils";
import { BattleTarget } from "./BattleTarget";

export class Monster extends BattleTarget {
  constructor(private base: any) {
    super(base)
  }

  get name() {
    return i18n.t(`npc.${getOriginId(this.base.id)}.name`)
  }
  
  get description() {
    return i18n.t(`npc.${getOriginId(this.base.id)}.description`)
  }

  getCorpse() {
    return {
      id: this.id,
      maxHp: this.maxHp,
      atk: this.atk,
      def: this.def,
      agi: this.agi,
      name: this.name,
      minRebornRarity: this.base.minRebornRarity
    }
  }
}