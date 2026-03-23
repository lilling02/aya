import { makeAutoObservable, runInAction } from 'mobx'
import { invoke } from '../../preload/main'

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
  }

  async loadHistory() {
    try {
      const history = await invoke<string>('getMainStore', 'commandHistory')
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
    await invoke('setMainStore', 'commandHistory', JSON.stringify(this.commandHistory))
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