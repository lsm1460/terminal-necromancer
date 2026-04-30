import { MessageSource, Renderer } from '~/core'
import { AppContext } from './types'

export class I18nAdapter implements Renderer {
  constructor(
    private baseRenderer: Renderer,
    private translator: (key: string, args?: any) => string,
    private existsCheck: (key: string) => boolean
  ) {}

  private parse(source: MessageSource): string | null {
    if (typeof source === 'string') return source

    const { key, args, optional } = source

    if (optional && !this.existsCheck(key)) {
      return null
    }

    return this.translator(key, args)
  }

  print(content: MessageSource): void {
    const parsed = this.parse(content)
    if (parsed !== null) this.baseRenderer.print(parsed)
  }

  printStatus(context: AppContext): void {
    this.baseRenderer.printStatus(context)
  }

  async select<T extends string>(
    title: MessageSource,
    choices: { name: string; message: MessageSource; disabled?: boolean }[],
    defaultValue?: string
  ): Promise<T> {
    const parsedTitle = this.parse(title) ?? '' // 타이틀은 null일 수 없으므로 fallback
    const parsedChoices = choices
      .map((c) => ({ ...c, parsedMsg: this.parse(c.message) }))
      .filter((c) => c.parsedMsg !== null) // 메시지가 없는 선택지는 필터링
      .map((c) => ({ ...c, message: c.parsedMsg as string }))

    return (await this.baseRenderer.select(parsedTitle, parsedChoices, defaultValue)) as T
  }

  // --- 변환이 필요한 메서드들 ---

  look(message: MessageSource, name: string, type: string): void {
    const parsed = this.parse(message)
    if (parsed !== null) this.baseRenderer.look(parsed, name, type)
  }

  pick(name: string, message: MessageSource): void {
    const parsed = this.parse(message)
    if (parsed !== null) this.baseRenderer.pick(name, parsed)
  }

  attack(message: MessageSource, prefix?: string): void {
    const parsed = this.parse(message)
    if (parsed !== null) this.baseRenderer.attack(parsed, prefix)
  }

  skill(message: MessageSource, prefix?: string): void {
    const parsed = this.parse(message)
    if (parsed !== null) this.baseRenderer.skill(parsed, prefix)
  }

  // --- 변환 없이 위임하는 메서드들 ---

  availableTalks(list: { name: string; hasQuest: boolean }[]): void {
    this.baseRenderer.availableTalks(list)
  }

  update(message: string): void {
    this.baseRenderer.update(message)
  }

  clear(): void {
    this.baseRenderer.clear()
  }

  async confirm(message: string): Promise<boolean> {
    return await this.baseRenderer.confirm(message)
  }

  async prompt(message: string): Promise<void> {
    await this.baseRenderer.prompt(message)
  }

  async multiselect(message: string, choices: any[], options: any): Promise<string[]> {
    return await this.baseRenderer.multiselect(message, choices, options)
  }

  move(directions: string[]): void {
    this.baseRenderer.move(directions)
  }

  talk(name: string): void {
    this.baseRenderer.talk(name)
  }

  printNpcCard(npc: any): void {
    this.baseRenderer.printNpcCard(npc)
  }
}
