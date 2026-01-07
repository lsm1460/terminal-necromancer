import enquirer from 'enquirer';
import { ItemType, ConsumableItem } from '../types';
import { CommandFunction } from '../types';

export const useCommand: CommandFunction = async (player, args, context) => {
  // 1. 소비 아이템만 필터링
  const consumables = player.inventory.filter(
    (item): item is ConsumableItem => item.type === ItemType.CONSUMABLE
  );

  if (consumables.length === 0) {
    console.log('\n🎒 사용할 수 있는 소비 아이템이 없습니다.');
    return false;
  }

  let targetItem: ConsumableItem | undefined;

  // 2. 인자(args) 처리 (예: use 포션)
  if (args.length > 0) {
    const itemName = args[0];
    targetItem = consumables.find((item) => item.label === itemName);

    if (!targetItem) {
      console.log(`\n❓ 인벤토리에 "${itemName}" 아이템이 없습니다.`);
      return false;
    }
  } 
  // 3. 인자가 없으면 선택 메뉴 표시
  else {
    const { itemId } = (await enquirer.prompt({
      type: 'select',
      name: 'itemId',
      message: '어떤 아이템을 사용하시겠습니까?',
      choices: [
        ...consumables.map((item) => ({
          name: item.id,
          message: `${item.label} (x${item.quantity || 1}) ${
            item.hpHeal ? ` [HP +${item.hpHeal}]` : ''
          }${item.mpHeal ? ` [MP +${item.mpHeal}]` : ''}`,
        })),
        { name: 'cancel', message: '🔙 취소' }
      ],
      format(value) {
        if (value === 'cancel') return '취소';
        const item = consumables.find(i => i.id === value);

        return item ? item.label : value;
      }
    })) as { itemId: string };

    if (itemId === 'cancel') return false;
    targetItem = consumables.find(i => i.id === itemId);
  }

  // 4. 아이템 사용 효과 적용
  if (targetItem) {
    console.log(`\n🧪 [${targetItem.label}]을(를) 사용합니다...`);

    // 체력 회복
    if (targetItem.hpHeal) {
      const beforeHp = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + targetItem.hpHeal);
      const recovered = player.hp - beforeHp;
      console.log(`❤️ 체력이 ${recovered} 회복되었습니다. (현재: ${player.hp}/${player.maxHp})`);
    }

    // 마나 회복
    if (targetItem.mpHeal) {
      const beforeMp = player.mp;
      player.mp = Math.min(player.maxMp, player.mp + targetItem.mpHeal);
      const recovered = player.mp - beforeMp;
      console.log(`🧪 마나가 ${recovered} 회복되었습니다. (현재: ${player.mp}/${player.maxMp})`);
    }

    // 5. 인벤토리에서 수량 차감 (앞서 만든 removeItem 활용)
    player.removeItem(targetItem.id, 1);
  }

  return false;
};