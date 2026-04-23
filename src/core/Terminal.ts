import { BaseNPC } from './npc/BaseNPC'
import { Renderer, Translatable } from './types'

export class Terminal {
  private static renderer: Renderer | null = null
  private static translate: (info: Translatable) => string = (m) => (typeof m === 'string' ? m : m.key)

  public static setRenderer(renderer: Renderer): void {
    this.renderer = renderer
  }

  public static setTranslator(translator: (info: Translatable) => string): void {
    this.translate = translator
  }

  private static t(message: Translatable): string {
    return this.translate(message)
  }

  public static log(message: Translatable): void {
    const translated = this.t(message)
    this.renderer ? this.renderer.print(translated) : console.log(translated)
  }

  public static async select<T extends string>(
    message: Translatable, // 수정됨
    choices: { name: string; message: Translatable; disabled?: boolean }[], // message 수정됨
    defaultValue?: string
  ): Promise<T> {
    if (!this.renderer) throw new Error('Renderer not initialized')

    const translatedTitle = this.t(message)

    const translatedChoices = choices.map((choice) => ({
      ...choice,
      message: this.t(choice.message),
    }))

    return (await this.renderer.select(translatedTitle, translatedChoices, defaultValue)) as T
  }

  public static availableTalks(list: { name: string; hasQuest: boolean }[]): void {
    if (!this.renderer) throw new Error('Renderer not initialized')

    this.renderer.availableTalks(list)
  }

  public static update(message: string) {
    this.renderer ? this.renderer.update(message) : process.stdout.write(`\rmessage`)
  }

  public static clear(): void {
    this.renderer ? this.renderer.clear() : console.clear()
  }

  public static async confirm(message: string): Promise<boolean> {
    if (!this.renderer) throw new Error('Renderer not initialized')
    return await this.renderer.confirm(message)
  }

  public static async prompt(message: string): Promise<void> {
    if (!this.renderer) throw new Error('Renderer not initialized')
    await this.renderer.prompt(message)
  }

  public static async multiselect(
    message: string,
    choices: { name: string; message: string }[],
    options?: { initial?: string[]; maxChoices?: number; validate?: (value: string[]) => string | true }
  ): Promise<string[]> {
    if (!this.renderer) throw new Error('Renderer not initialized')
    return await this.renderer.multiselect(message, choices, options)
  }

  public static move(directions: string[]) {
    if (!this.renderer) throw new Error('Renderer not initialized')

    this.renderer.move(directions)
  }

  public static look(message: string, name: string, type: string) {
    if (!this.renderer) throw new Error('Renderer not initialized')

    this.renderer.look(message, name, type)
  }

  public static pick(name: string, message: string) {
    if (!this.renderer) throw new Error('Renderer not initialized')

    this.renderer.pick(name, message)
  }

  public static attack(message: string, prefix?: string) {
    if (!this.renderer) throw new Error('Renderer not initialized')

    this.renderer.attack(message, prefix)
  }

  public static skill(message: string, prefix?: string) {
    if (!this.renderer) throw new Error('Renderer not initialized')

    this.renderer.skill(message, prefix)
  }

  public static talk(name: string) {
    if (!this.renderer) throw new Error('Renderer not initialized')

    this.renderer.talk(name)
  }

  public static printNpcCard(npc: BaseNPC) {
    if (!this.renderer) throw new Error('Renderer not initialized')

    this.renderer.printNpcCard(npc)
  }
}
