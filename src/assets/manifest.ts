export interface AssetSource {
  id: string
  src: string
}

export interface AssetManifest {
  images: AssetSource[]
  audios: AssetSource[]
}

export const commonManifest: AssetManifest = {
  images: [
    //player
    { id: 'player_idle_0', src: '/images/player/player_idle_0.png' },
    { id: 'player_idle_1', src: '/images/player/player_idle_1.png' },
    { id: 'player_attack', src: '/images/player/player_attack.png' },
    // skeleton
    { id: 'skeleton_idle_0', src: '/images/skeleton/skeleton_idle_0.png' },
    { id: 'skeleton_idle_1', src: '/images/skeleton/skeleton_idle_1.png' },
    { id: 'skeleton_attack', src: '/images/skeleton/skeleton_attack.png' },

    // skeleton_swordsman
    { id: 'skeleton_swordsman_idle_0', src: '/images/skeleton_swordsman/skeleton_swordsman_idle_0.png' },
    { id: 'skeleton_swordsman_idle_1', src: '/images/skeleton_swordsman/skeleton_swordsman_idle_1.png' },
    { id: 'skeleton_swordsman_attack', src: '/images/skeleton_swordsman/skeleton_swordsman_attack.png' },

    // skeleton_shield_bearer
    { id: 'skeleton_shield_bearer_idle_0', src: '/images/skeleton_shield_bearer/skeleton_shield_bearer_idle_0.png' },
    { id: 'skeleton_shield_bearer_idle_1', src: '/images/skeleton_shield_bearer/skeleton_shield_bearer_idle_1.png' },
    { id: 'skeleton_shield_bearer_attack', src: '/images/skeleton_shield_bearer/skeleton_shield_bearer_attack.png' },

    // skeleton_pyromancer
    { id: 'skeleton_pyromancer_idle_0', src: '/images/skeleton_pyromancer/skeleton_pyromancer_idle_0.png' },
    { id: 'skeleton_pyromancer_idle_1', src: '/images/skeleton_pyromancer/skeleton_pyromancer_idle_1.png' },
    { id: 'skeleton_pyromancer_attack', src: '/images/skeleton_pyromancer/skeleton_pyromancer_attack.png' },

    // skeleton_healer
    { id: 'skeleton_healer_idle_0', src: '/images/skeleton_healer/skeleton_healer_idle_0.png' },
    { id: 'skeleton_healer_idle_1', src: '/images/skeleton_healer/skeleton_healer_idle_1.png' },
    { id: 'skeleton_healer_attack', src: '/images/skeleton_healer/skeleton_healer_attack.png' },

    // skeleton_great_shield_bearer
    {
      id: 'skeleton_great_shield_bearer_idle_0',
      src: '/images/skeleton_great_shield_bearer/skeleton_great_shield_bearer_idle_0.png',
    },
    {
      id: 'skeleton_great_shield_bearer_idle_1',
      src: '/images/skeleton_great_shield_bearer/skeleton_great_shield_bearer_idle_1.png',
    },
    {
      id: 'skeleton_great_shield_bearer_attack',
      src: '/images/skeleton_great_shield_bearer/skeleton_great_shield_bearer_attack.png',
    },

    // golem
    { id: 'golem_idle_0', src: '/images/golem/golem_idle_0.png' },
    { id: 'golem_idle_1', src: '/images/golem/golem_idle_1.png' },
    { id: 'golem_attack', src: '/images/golem/golem_attack.png' },

    // soul_only_golem
    { id: 'soul_only_golem_idle_0', src: '/images/soul_only_golem/soul_only_golem_idle_0.png' },
    { id: 'soul_only_golem_idle_1', src: '/images/soul_only_golem/soul_only_golem_idle_1.png' },
    { id: 'soul_only_golem_attack', src: '/images/soul_only_golem/soul_only_golem_attack.png' },

    // soul_3_golem
    { id: 'soul_3_golem_idle_0', src: '/images/soul_3_golem/soul_3_golem_idle_0.png' },
    { id: 'soul_3_golem_idle_1', src: '/images/soul_3_golem/soul_3_golem_idle_1.png' },
    { id: 'soul_3_golem_attack', src: '/images/soul_3_golem/soul_3_golem_attack.png' },

    // machine_only_golem
    { id: 'machine_only_golem_idle_0', src: '/images/machine_only_golem/machine_only_golem_idle_0.png' },
    { id: 'machine_only_golem_idle_1', src: '/images/machine_only_golem/machine_only_golem_idle_1.png' },
    { id: 'machine_only_golem_attack', src: '/images/machine_only_golem/machine_only_golem_attack.png' },

    // machine_3_golem
    { id: 'machine_3_golem_idle_0', src: '/images/machine_3_golem/machine_3_golem_idle_0.png' },
    { id: 'machine_3_golem_idle_1', src: '/images/machine_3_golem/machine_3_golem_idle_1.png' },
    { id: 'machine_3_golem_attack', src: '/images/machine_3_golem/machine_3_golem_attack.png' },

    // soul_3_machine_3_golem
    { id: 'soul_3_machine_3_golem_idle_0', src: '/images/soul_3_machine_3_golem/soul_3_machine_3_golem_idle_0.png' },
    { id: 'soul_3_machine_3_golem_idle_1', src: '/images/soul_3_machine_3_golem/soul_3_machine_3_golem_idle_1.png' },
    { id: 'soul_3_machine_3_golem_attack', src: '/images/soul_3_machine_3_golem/soul_3_machine_3_golem_attack.png' },

    // soul_machine_mixed_golem
    {
      id: 'soul_machine_mixed_golem_idle_0',
      src: '/images/soul_machine_mixed_golem/soul_machine_mixed_golem_idle_0.png',
    },
    {
      id: 'soul_machine_mixed_golem_idle_1',
      src: '/images/soul_machine_mixed_golem/soul_machine_mixed_golem_idle_1.png',
    },
    {
      id: 'soul_machine_mixed_golem_attack',
      src: '/images/soul_machine_mixed_golem/soul_machine_mixed_golem_attack.png',
    },

    // 에셋이 없을 때를 대비한 기본 이미지
    { id: 'default_idle_0', src: '/images/default_idle_0.png' },
    { id: 'default_idle_1', src: '/images/default_idle_1.png' },
    { id: 'default_attack', src: '/images/default_attack.png' },
  ],
  audios: [
    { id: 'sfx_hit', src: '/audio/sfx/hit.wav' },
    { id: 'sfx_die', src: '/audio/sfx/die.wav' },
  ],
}
