import { generateId, rollFromRange } from '../utils';
import { Item } from './Item';
import { IGenerationPolicy } from './types';

export class ItemGenerator<TRarity, TAffix, TDrop> {
  constructor(
    private readonly policy: IGenerationPolicy<TRarity, TAffix, TDrop>
  ) {}

  public createItem(baseItem: TDrop): Item {
    // 1. 장비 여부 판단
    if (!this.policy.isEquippable(baseItem)) {
      return new Item(baseItem as any);
    }

    // 2. 등급 결정 (Policy를 통해 baseItem 내부 값을 안전하게 가져옴)
    const rarity = this.policy.rollRarity(
      this.policy.getMinRarity(baseItem),
      this.policy.getMaxRarity(baseItem)
    );
    const setting = this.policy.getSetting(rarity);

    // 3. 스탯 범위 추출 및 계산
    const ranges = this.policy.getStatRanges(baseItem);
    const { finalStats, mainValue, mainRange } = this.calculateBaseStats(ranges, setting.multiplier);

    // 4. 어픽스 및 수식어 조립
    const affix = setting.hasAffix ? this.policy.pickAffix(rarity) : undefined;
    const perfPrefix = this.policy.getPerformancePrefix(mainValue, mainRange);
    const adjective = this.pickRandomAdjective(setting.adjectives);

    // 5. 최종 객체 조립
    return new Item({
      ...(baseItem as any), // 원본 데이터 복사
      ...finalStats,
      id: generateId(ranges.baseId),
      rarity: rarity as any,
      perfPrefix,
      adjective,
      affix: affix as any,
    });
  }

  /**
   * 이제 baseItem 전체가 아닌, 추출된 ranges 데이터만 받습니다.
   */
  private calculateBaseStats(ranges: ReturnType<IGenerationPolicy<TRarity, TAffix, TDrop>['getStatRanges']>, multiplier: number) {
    let finalStats: any = {};
    let mainValue = 0;
    let mainRange: [number, number] = [0, 0];

    if (ranges.atkRange) {
      mainRange = ranges.atkRange;
      mainValue = rollFromRange(mainRange, true);
      finalStats.atk = Math.floor(mainValue * multiplier);
      if (ranges.critRange) finalStats.crit = rollFromRange(ranges.critRange);
    } else if (ranges.defRange) {
      mainRange = ranges.defRange;
      mainValue = rollFromRange(mainRange);
      finalStats.def = Math.floor(mainValue * multiplier);
      if (ranges.evaRange) finalStats.eva = rollFromRange(ranges.evaRange);
    }

    if (ranges.maxSkeletonRange) {
      finalStats.maxSkeleton = rollFromRange(ranges.maxSkeletonRange, true);
    }

    return { finalStats, mainValue, mainRange };
  }

  private pickRandomAdjective(adjectives: string[]): string {
    return adjectives.length > 0 && adjectives[0] !== ''
      ? adjectives[Math.floor(Math.random() * adjectives.length)]
      : '';
  }
}