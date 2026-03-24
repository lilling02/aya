import { makeAutoObservable, runInAction, toJS } from 'mobx'
import dataUrl from 'licia/dataUrl'

interface IpcGetDevices {
  id: string
  serialno: string
  name: string
  type: 'emulator' | 'device' | 'offline' | 'unauthorized' | 'unknown'
  androidVersion: string
  sdkVersion: string
}

export interface IWorkspaceDevice {
  id: string
  name: string
  serialno: string
  androidVersion: string
  sdkVersion: string
  type: 'emulator' | 'device' | 'offline' | 'unauthorized' | 'unknown'
  screenshot?: string
  lastScreenshotTime?: number
  isOnline: boolean
  offlineTime?: number
}

export interface ICommandHistory {
  id: string
  command: string
  timestamp: number
  isFavorite: boolean
  alias?: string
}

const MAX_HISTORY = 100

export default class WorkspaceStore {
  devices: Map<string, IWorkspaceDevice> = new Map()
  selectedDeviceIds: Set<string> = new Set()
  commandHistory: ICommandHistory[] = []
  refreshInterval: number = 10000 // 10s default

  constructor() {
    makeAutoObservable(this)
    this.loadHistory()
    this.syncDevices()
    this.registerDeviceChangeListener()
  }

  async loadHistory() {
    try {
      const history = await main.getMainStore('commandHistory')
      if (history) {
        runInAction(() => {
          this.commandHistory = JSON.parse(history)
        })
      }
    } catch (e) {
      console.error('Failed to load history:', e)
    }
  }

  async saveHistory() {
    await main.setMainStore('commandHistory', JSON.stringify(this.commandHistory))
  }

  async syncDevices() {
    try {
      const devices = await main.getDevices()
      runInAction(() => {
        devices.forEach(device => {
          const existing = this.devices.get(device.id)
          this.updateDevice({
            ...device,
            isOnline: device.type !== 'offline',
            screenshot: existing?.screenshot,
            lastScreenshotTime: existing?.lastScreenshotTime,
          })
        })
      })
    } catch (e) {
      console.error('Failed to sync devices:', e)
    }
  }

  async captureScreenshot(deviceId: string) {
    try {
      const data = await main.screencap(deviceId)
      const url = dataUrl.stringify(data, 'image/png')
      const device = this.devices.get(deviceId)
      if (device) {
        runInAction(() => {
          device.screenshot = url
          device.lastScreenshotTime = Date.now()
          device.isOnline = true
        })
      }
    } catch (e) {
      console.error('Failed to capture screenshot:', e)
    }
  }

  registerDeviceChangeListener() {
    main.on('changeMemStore', (key: string, value: any) => {
      if (key === 'devices') {
        runInAction(() => {
          const devices = JSON.parse(value)
          devices.forEach((device: IpcGetDevices) => {
            const existing = this.devices.get(device.id)
            this.updateDevice({
              ...device,
              isOnline: device.type !== 'offline',
              screenshot: existing?.screenshot,
              lastScreenshotTime: existing?.lastScreenshotTime,
            })
          })
        })
      }
    })
  }

  updateDevice(device: IWorkspaceDevice) {
    this.devices.set(device.id, device)
  }

  removeDevice(deviceId: string) {
    this.devices.delete(deviceId)
    this.selectedDeviceIds.delete(deviceId)
  }

  selectDevice(deviceId: string) {
    this.selectedDeviceIds.add(deviceId)
  }

  deselectDevice(deviceId: string) {
    this.selectedDeviceIds.delete(deviceId)
  }

  selectAll() {
    this.devices.forEach((_, id) => this.selectedDeviceIds.add(id))
  }

  deselectAll() {
    this.selectedDeviceIds.clear()
  }

  addCommandHistory(command: string) {
    const entry: ICommandHistory = {
      id: Date.now().toString(),
      command,
      timestamp: Date.now(),
      isFavorite: false,
    }
    this.commandHistory.unshift(entry)
    if (this.commandHistory.length > MAX_HISTORY) {
      this.commandHistory = this.commandHistory.slice(0, MAX_HISTORY)
    }
    this.saveHistory()
  }

  toggleFavorite(id: string) {
    const item = this.commandHistory.find(h => h.id === id)
    if (item) {
      item.isFavorite = !item.isFavorite
      this.saveHistory()
    }
  }

  updateCommandAlias(id: string, alias: string) {
    const item = this.commandHistory.find(h => h.id === id)
    if (item) {
      item.alias = alias
      this.saveHistory()
    }
  }
}

export const workspaceStore = new WorkspaceStore()