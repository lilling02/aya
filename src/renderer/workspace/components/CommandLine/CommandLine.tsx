import { useState, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { workspaceStore } from '../../store'
import mainStore from '../../../main/store'
import MiniPanel from '../MiniPanel/MiniPanel'
import CommandHistoryModal from '../CommandHistoryModal/CommandHistoryModal'
import Style from './CommandLine.module.scss'
import className from 'licia/className'
import {
  colorBgContainerDark,
  colorTextDark,
  colorBgContainer,
  colorText,
  colorTextSecondaryDark,
  colorTextSecondary,
} from 'common/theme'

interface DeviceShell {
  sessionId: string
}

export default observer(function CommandLine() {
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [command, setCommand] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [versionInput, setVersionInput] = useState('')
  const [deviceOutputs, setDeviceOutputs] = useState<Map<string, string>>(
    new Map(),
  )
  const [deviceShells, setDeviceShells] = useState<Map<string, DeviceShell>>(
    new Map(),
  )
  const activeSessions = useRef<Set<string>>(new Set())
  const outputRef = useRef<HTMLDivElement>(null)
  const deviceShellsRef = useRef(deviceShells)

  const devices = Array.from(workspaceStore.devices.values())
  const selectedCount = workspaceStore.selectedDeviceIds.size

  const activeDevice = activeDeviceId
    ? workspaceStore.devices.get(activeDeviceId)
    : null
  const activeOutput = activeDeviceId
    ? deviceOutputs.get(activeDeviceId) || ''
    : ''

  // Keep ref in sync with state
  useEffect(() => {
    deviceShellsRef.current = deviceShells
  }, [deviceShells])

  // Listen for shell data pushed from main process
  useEffect(() => {
    function onShellData(sessionId: string, data: string) {
      // Find which device this session belongs to using ref
      for (const [deviceId, shell] of deviceShellsRef.current) {
        if (shell.sessionId === sessionId) {
          setDeviceOutputs((prev) => {
            const newMap = new Map(prev)
            const existing = newMap.get(deviceId) || ''
            newMap.set(deviceId, existing + data)
            return newMap
          })
          break
        }
      }
    }
    const offShellData = main.on('shellData', onShellData)
    return () => {
      offShellData()
    }
  }, [])

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight)
  }, [activeOutput])

  // Create shell for a device when needed
  const ensureShell = async (deviceId: string) => {
    if (deviceShells.has(deviceId)) {
      return deviceShells.get(deviceId)!.sessionId
    }

    try {
      const sessionId = await main.createShell(deviceId)
      activeSessions.current.add(sessionId)
      setDeviceShells((prev) => new Map(prev).set(deviceId, { sessionId }))
      return sessionId
    } catch (err) {
      console.error(`Failed to create shell for device ${deviceId}:`, err)
      return null
    }
  }

  // Cleanup shells on unmount
  useEffect(() => {
    return () => {
      for (const sessionId of activeSessions.current) {
        main.killShell(sessionId).catch(() => {
          // Ignore errors during cleanup
        })
      }
    }
  }, [])

  const handleMiniPanelClick = (deviceId: string) => {
    setActiveDeviceId(deviceId)
  }

  const handleSelectAll = () => {
    workspaceStore.selectAll()
  }

  const handleDeselectAll = () => {
    workspaceStore.deselectAll()
  }

  const handleToggleDevice = (deviceId: string) => {
    if (workspaceStore.selectedDeviceIds.has(deviceId)) {
      workspaceStore.deselectDevice(deviceId)
    } else {
      workspaceStore.selectDevice(deviceId)
    }
  }

  const handleCommandSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!command.trim() || selectedCount === 0) return

    workspaceStore.addCommandHistory(command)

    const selectedIds = Array.from(workspaceStore.selectedDeviceIds)
    for (const deviceId of selectedIds) {
      const sessionId = await ensureShell(deviceId)
      if (!sessionId) continue

      try {
        await main.writeShell(sessionId, command + '\n')
      } catch (err) {
        console.error(`Failed to write to shell for device ${deviceId}:`, err)
      }
    }

    setCommand('')
  }

  const handleHistorySelect = (selectedCommand: string) => {
    setCommand(selectedCommand)
    setShowHistory(false)
  }

  // 根据版本号补全完整命令
  const completedCommand = versionInput.trim()
    ? `adb shell am broadcast -a com.lkm.app_ados.ConfigReceiver -n com.lkm.ad_cross/com.lkm.app_ados.ConfigReceiver --es cmd installmini --es url "http://f.satrace.cn/upload/ados/dist/${versionInput.trim()}.zip" --es force "force"`
    : ''

  const handleCopyCommand = () => {
    if (completedCommand) {
      navigator.clipboard.writeText(completedCommand).then(() => {
        // 可选：提示复制成功
      })
    }
  }

  const handleFillCommand = () => {
    if (completedCommand) {
      setCommand(completedCommand)
    }
  }

  const isDark = mainStore.settings.theme === 'dark'
  const terminalBg = isDark ? colorBgContainerDark : colorBgContainer
  const terminalFg = isDark ? colorTextDark : colorText
  const sidebarBg = isDark ? colorBgContainerDark : colorBgContainer
  const sidebarText = isDark ? colorTextDark : colorText
  const sidebarTextSecondary = isDark
    ? colorTextSecondaryDark
    : colorTextSecondary

  return (
    <div className={Style.commandLine}>
      <div className={Style.contentArea}>
        <div className={Style.mainPanel}>
          <div
            className={Style.mainHeader}
            style={{ backgroundColor: terminalBg, color: sidebarText }}
          >
            {activeDevice ? (
              <>
                <span
                  className={className(
                    Style.statusDot,
                    activeDevice.isOnline ? Style.online : Style.offline,
                  )}
                />
                <span className={Style.deviceName}>{activeDevice.name}</span>
              </>
            ) : (
              <span className={Style.noDevice}>未选择设备</span>
            )}
          </div>
          <div
            className={Style.terminalOutput}
            ref={outputRef}
            style={{ backgroundColor: terminalBg, color: terminalFg }}
          >
            {activeDevice ? (
              activeOutput ? (
                <pre className={Style.outputLine} style={{ color: terminalFg }}>
                  {activeOutput}
                </pre>
              ) : (
                <div
                  className={Style.emptyTerminal}
                  style={{ color: sidebarTextSecondary }}
                >
                  终端输出将显示在这里
                </div>
              )
            ) : (
              <div className={Style.emptyState}>
                <div className={Style.emptyIcon}>+</div>
                <div
                  className={Style.emptyText}
                  style={{ color: sidebarTextSecondary }}
                >
                  从右侧列表选择一个设备
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={Style.sidebar}
          style={{ backgroundColor: sidebarBg, color: sidebarText }}
        >
          <div className={Style.sidebarHeader}>
            <div className={Style.headerLeft}>
              <span>设备列表</span>
              <span className={Style.deviceCount}>{devices.length}</span>
            </div>
            <div className={Style.headerActions}>
              <label className={Style.selectorItem}>
                <input
                  type="checkbox"
                  checked={
                    selectedCount === devices.length && devices.length > 0
                  }
                  onChange={(e) =>
                    e.target.checked ? handleSelectAll() : handleDeselectAll()
                  }
                />
                <span>全选</span>
              </label>
              <label className={Style.selectorItem}>
                <input
                  type="checkbox"
                  checked={selectedCount === 0}
                  onChange={handleDeselectAll}
                />
                <span>全不选</span>
              </label>
            </div>
          </div>
          <div className={Style.deviceList}>
            {devices.length > 0 ? (
              devices.map((device) => (
                <MiniPanel
                  key={device.id}
                  device={device}
                  output={(deviceOutputs.get(device.id) || '').split('\n')}
                  selected={workspaceStore.selectedDeviceIds.has(device.id)}
                  onClick={handleMiniPanelClick}
                  onSelect={handleToggleDevice}
                />
              ))
            ) : (
              <div className={Style.emptyDeviceList}>暂无设备</div>
            )}
          </div>
        </div>
      </div>

      <div
        className={Style.broadcastBar}
        style={{ backgroundColor: terminalBg, color: sidebarText }}
      >
        <div className={Style.deviceSelector}>
          <span className={Style.selectedInfo}>
            已选 {selectedCount} 个设备
          </span>
        </div>

        <form className={Style.commandForm} onSubmit={handleCommandSubmit}>
          <input
            type="text"
            className={Style.commandInput}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="输入命令..."
          />
          <button
            type="button"
            className={Style.historyBtn}
            onClick={() => setShowHistory(true)}
            title="历史命令"
          >
            H
          </button>
          <button
            type="submit"
            className={Style.broadcastBtn}
            disabled={selectedCount === 0 || !command.trim()}
          >
            广播 ({selectedCount})
          </button>
        </form>

        {/* 版本号补全区域 */}
        <div className={Style.versionSection}>
          <div className={Style.versionInputRow}>
            <input
              type="text"
              className={Style.versionInput}
              value={versionInput}
              onChange={(e) => setVersionInput(e.target.value)}
              placeholder="输入版本号，如 wl-touch_2024120302"
            />
          </div>
          {completedCommand && (
            <div className={Style.versionResult}>
              <div className={Style.versionCommand}>{completedCommand}</div>
              <div className={Style.versionActions}>
                <button
                  type="button"
                  className={Style.copyBtn}
                  onClick={handleCopyCommand}
                  title="复制命令"
                >
                  复制
                </button>
                <button
                  type="button"
                  className={Style.fillBtn}
                  onClick={handleFillCommand}
                  title="填充到命令输入框"
                >
                  填充
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <CommandHistoryModal
          onClose={() => setShowHistory(false)}
          onSelect={handleHistorySelect}
        />
      )}
    </div>
  )
})
