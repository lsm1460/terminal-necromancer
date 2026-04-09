import { LevelUpActions } from './LevelUpAction'
import { SkillActions } from './SkillAction'
import { StoryActions } from './StoryAction'

export const DeathAction = {
  ...LevelUpActions,
  ...SkillActions,
  ...StoryActions,
}
