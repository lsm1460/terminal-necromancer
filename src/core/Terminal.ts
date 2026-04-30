import { BaseNPC } from './npc/BaseNPC'
import { MessageSource, Renderer } from './types'

export class Terminal {
  private static renderer: Renderer | null = null

  public static setRenderer(renderer: Renderer): void {
    this.renderer = renderer
  }

  private static get activeRenderer(): Renderer {
    if (!this.renderer) throw new Error('Renderer not initialized')
    return this.renderer
  }

  public static log(content: MessageSource): void {
    if (!this.renderer) {
      console.log(typeof content === 'string' ? content : content.key)
      return
    }
    this.renderer.print(content)
  }

  public static async select<T extends string>(
    title: MessageSource,
    choices: { name: string; message: MessageSource; disabled?: boolean }[],
    defaultValue?: string
  ): Promise<T> {
    return (await this.activeRenderer.select(title, choices, defaultValue)) as T
  }

  public static availableTalks(list: { name: string; hasQuest: boolean }[]): void {
    this.activeRenderer.availableTalks(list)
  }

  public static update(message: string) {
    this.activeRenderer.update(message)
  }

  public static clear(): void {
    this.activeRenderer.clear()
  }

  public static async confirm(message: string): Promise<boolean> {
    return await this.activeRenderer.confirm(message)
  }

  public static async prompt(message: string): Promise<void> {
    await this.activeRenderer.prompt(message)
  }

  public static async multiselect(
    message: string,
    choices: { name: string; message: string }[],
    options?: { initial?: string[]; maxChoices?: number; validate?: (value: string[]) => string | true }
  ): Promise<string[]> {
    return await this.activeRenderer.multiselect(message, choices, options)
  }

  public static move(directions: string[]) {
    this.activeRenderer.move(directions)
  }

  public static look(message: MessageSource, name: string, type: string) {
    this.activeRenderer.look(message, name, type)
  }

  public static pick(name: string, message: MessageSource) {
    this.activeRenderer.pick(name, message)
  }

  public static attack(message: MessageSource, prefix?: string) {
    this.activeRenderer.attack(message, prefix)
  }

  public static skill(message: MessageSource, prefix?: string) {
    this.activeRenderer.skill(message, prefix)
  }

  public static talk(name: string) {
    this.activeRenderer.talk(name)
  }

  public static printNpcCard(npc: BaseNPC) {
    this.activeRenderer.printNpcCard(npc)
  }
}
