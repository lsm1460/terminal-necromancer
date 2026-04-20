import { StatModifier } from '~/core/player/StatsCalculator';
import { Necromancer } from './Necromancer';

export const necromancerModifiers: StatModifier[] = [
  {
    key: 'maxHp',
    value: (current, p) => {
      if (p.hasAffix('BLOOD')) {
        const potentialMp = p._maxMp + (p.equipped.weapon?.mp || 0) + (p.equipped.armor?.mp || 0);
        return Math.floor((current + potentialMp) * 1.3);
      }
      return current;
    }
  },
  
  {
    key: 'maxMp',
    value: (current, p) => (p.hasAffix('BLOOD') ? 0 : current)
  },

  {
    key: 'atk',
    value: (current, p) => {
      const n = p as Necromancer; // 타입 캐스팅
      if (p.hasAffix('ALONE') && n.minionManager.skeleton.length < 1) {
        return current + (n.minionManager.maxSkeleton * 10);
      }
      return current;
    }
  }
];