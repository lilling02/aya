import { workspaceStore } from '../WorkspaceStore'

// Mock the invoke function
jest.mock('../../preload/main', () => ({
  invoke: jest.fn().mockResolvedValue(undefined),
}))

describe('WorkspaceStore', () => {
  beforeEach(() => {
    // Clear state before each test
    workspaceStore.devices.clear()
    workspaceStore.selectedDeviceIds.clear()
    workspaceStore.commandHistory = []
  })

  describe('device management', () => {
    it('should add a device', () => {
      const device = {
        id: 'device-1',
        name: 'Test Device',
        serialno: '123456',
        androidVersion: '11',
        sdkVersion: '30',
        type: 'device' as const,
        isOnline: true,
      }

      workspaceStore.updateDevice(device)

      expect(workspaceStore.devices.size).toBe(1)
      expect(workspaceStore.devices.get('device-1')).toEqual(device)
    })

    it('should remove a device', () => {
      const device = {
        id: 'device-1',
        name: 'Test Device',
        serialno: '123456',
        androidVersion: '11',
        sdkVersion: '30',
        type: 'device' as const,
        isOnline: true,
      }

      workspaceStore.updateDevice(device)
      expect(workspaceStore.devices.size).toBe(1)

      workspaceStore.removeDevice('device-1')
      expect(workspaceStore.devices.size).toBe(0)
    })

    it('should remove device from selectedDeviceIds when removed', () => {
      const device = {
        id: 'device-1',
        name: 'Test Device',
        serialno: '123456',
        androidVersion: '11',
        sdkVersion: '30',
        type: 'device' as const,
        isOnline: true,
      }

      workspaceStore.updateDevice(device)
      workspaceStore.selectDevice('device-1')
      expect(workspaceStore.selectedDeviceIds.size).toBe(1)

      workspaceStore.removeDevice('device-1')
      expect(workspaceStore.selectedDeviceIds.size).toBe(0)
    })
  })

  describe('selection', () => {
    it('should select and deselect devices', () => {
      const device = {
        id: 'device-1',
        name: 'Test Device',
        serialno: '123456',
        androidVersion: '11',
        sdkVersion: '30',
        type: 'device' as const,
        isOnline: true,
      }

      workspaceStore.updateDevice(device)

      workspaceStore.selectDevice('device-1')
      expect(workspaceStore.selectedDeviceIds.has('device-1')).toBe(true)

      workspaceStore.deselectDevice('device-1')
      expect(workspaceStore.selectedDeviceIds.has('device-1')).toBe(false)
    })

    it('should select all devices', () => {
      const device1 = {
        id: 'device-1',
        name: 'Test Device 1',
        serialno: '123456',
        androidVersion: '11',
        sdkVersion: '30',
        type: 'device' as const,
        isOnline: true,
      }
      const device2 = {
        id: 'device-2',
        name: 'Test Device 2',
        serialno: '789012',
        androidVersion: '12',
        sdkVersion: '31',
        type: 'device' as const,
        isOnline: true,
      }

      workspaceStore.updateDevice(device1)
      workspaceStore.updateDevice(device2)

      workspaceStore.selectAll()
      expect(workspaceStore.selectedDeviceIds.size).toBe(2)
      expect(workspaceStore.selectedDeviceIds.has('device-1')).toBe(true)
      expect(workspaceStore.selectedDeviceIds.has('device-2')).toBe(true)
    })

    it('should deselect all devices', () => {
      const device = {
        id: 'device-1',
        name: 'Test Device',
        serialno: '123456',
        androidVersion: '11',
        sdkVersion: '30',
        type: 'device' as const,
        isOnline: true,
      }

      workspaceStore.updateDevice(device)
      workspaceStore.selectAll()
      expect(workspaceStore.selectedDeviceIds.size).toBe(1)

      workspaceStore.deselectAll()
      expect(workspaceStore.selectedDeviceIds.size).toBe(0)
    })
  })

  describe('command history', () => {
    it('should add command to history', () => {
      workspaceStore.addCommandHistory('adb devices')
      expect(workspaceStore.commandHistory.length).toBe(1)
      expect(workspaceStore.commandHistory[0].command).toBe('adb devices')
      expect(workspaceStore.commandHistory[0].isFavorite).toBe(false)
    })

    it('should limit history to 100 entries', () => {
      // Add 105 commands
      for (let i = 0; i < 105; i++) {
        workspaceStore.addCommandHistory(`command-${i}`)
      }

      expect(workspaceStore.commandHistory.length).toBe(100)
      expect(workspaceStore.commandHistory[0].command).toBe('command-104')
      expect(workspaceStore.commandHistory[99].command).toBe('command-5')
    })

    it('should toggle favorite', () => {
      workspaceStore.addCommandHistory('adb devices')
      const historyId = workspaceStore.commandHistory[0].id

      expect(workspaceStore.commandHistory[0].isFavorite).toBe(false)

      workspaceStore.toggleFavorite(historyId)
      expect(workspaceStore.commandHistory[0].isFavorite).toBe(true)

      workspaceStore.toggleFavorite(historyId)
      expect(workspaceStore.commandHistory[0].isFavorite).toBe(false)
    })

    it('should update alias', () => {
      workspaceStore.addCommandHistory('adb devices')
      const historyId = workspaceStore.commandHistory[0].id

      workspaceStore.updateCommandAlias(historyId, 'List devices')
      expect(workspaceStore.commandHistory[0].alias).toBe('List devices')
    })
  })
})
