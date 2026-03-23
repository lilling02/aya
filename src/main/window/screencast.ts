import { BrowserWindow } from 'electron'
import * as window from 'share/main/lib/window'
import { getScreencastStore } from '../lib/store'
import { handleEvent } from 'share/main/lib/util'
import { IpcGetStore, IpcSetStore } from 'share/common/types'
import { IpcSetScreencastAlwaysOnTop } from 'common/types'

const store = getScreencastStore()

let win: BrowserWindow | null = null

// 注册 screencast IPC handlers（全局，只注册一次）
handleEvent('setScreencastStore', <IpcSetStore>(
  ((name, val) => store.set(name, val))
))
handleEvent('getScreencastStore', <IpcGetStore>((name) => store.get(name)))
handleEvent('setScreencastAlwaysOnTop', <IpcSetScreencastAlwaysOnTop>((
  alwaysOnTop
) => {
  if (win) {
    win.setAlwaysOnTop(alwaysOnTop)
  }
}))

export function showWin() {
  if (win) {
    win.focus()
    return
  }

  win = window.create({
    name: 'screencast',
    minWidth: 430,
    minHeight: 640,
    width: 430,
    height: 640,
  })

  win.on('close', () => {
    win?.destroy()
    win = null
    const mainWin = window.getWin('main')
    if (mainWin) {
      mainWin.show()
    }
  })

  window.loadPage(win, { page: 'screencast' })
}

export function closeWin() {
  if (win) {
    win.close()
  }
}
