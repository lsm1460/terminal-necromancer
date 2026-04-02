import { invoke } from '@tauri-apps/api/core'

export const openWindow = async () => {
  try {
    //@ts-ignore
    if (window.__TAURI_INTERNALS__) {
      await invoke('show_main_window')
    } else {
      console.log('브라우저 환경: 타우리 시작 생략')
    }
  } catch (error) {
    console.error('타우리 시작 중 오류 발생:', error)
  }
}
