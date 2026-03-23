import { useState, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { workspaceStore } from '../../store'
import { invoke } from '../../../preload/main'
import MiniPanel from '../MiniPanel/MiniPanel'
import CommandHistoryModal from '../CommandHistoryModal/CommandHistoryModal'
import './CommandLine.module.scss'

interface DeviceShell {
  sessionId: string
  output: string[]
}

export default observer(function CommandLine() {
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [command, setCommand] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [deviceOutputs, setDeviceOutputs] = useState<Map<string, string[]>>(new Map())
  const [deviceShells, setDeviceShells] = useState<Map<string, DeviceShell>>(new Map())
  const activeSessions = useRef<Set<string>>(new Set())
  const outputRef = useRef<HTMLDivElement>(null)

  const devices = Array.from(workspaceStore.devices.values())
  const selectedCount = workspaceStore.selectedDeviceIds.size

  const activeDevice = activeDeviceId ? workspaceStore.devices.get(activeDeviceId) : null
  const activeOutput = activeDeviceId ? deviceOutputs.get(activeDeviceId) || [] : []

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight)
  }, [activeOutput])

  // Poll for shell output
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      for (const [deviceId, shell] of deviceShells) {
        try {
          const output = await invoke<string>('readShell', shell.sessionId)
          if (output) {
            setDeviceOutputs(prev => {
              const newMap = new Map(prev)
              const existing = newMap.get(deviceId) || []
              newMap.set(deviceId, [...existing, output])
              return newMap
            })
          }
        } catch (err) {
          // Shell may have been destroyed or not ready
        }
      }
    }, 500)

    return () => clearInterval(pollInterval)
  }, [deviceShells])

  // Cleanup shells on unmount
  useEffect(() => {
    return () => {
      for (const sessionId of activeSessions.current) {
        invoke('destroyShell', sessionId).catch(() => {
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

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || selectedCount === 0) return

    workspaceStore.addCommandHistory(command)

    const selectedIds = Array.from(workspaceStore.selectedDeviceIds)
    for (const deviceId of selectedIds) {
      let shell = deviceShells.get(deviceId)
      if (!shell) {
        try {
          const sessionId = await invoke<string>('createShell', deviceId)
          shell = { sessionId, output: [] }
          activeSessions.current.add(sessionId)
          setDeviceShells(prev => new Map(prev).set(deviceId, shell!))
        } catch (err) {
          console.error(`Failed to create shell for device ${deviceId}:`, err)
          continue
        }
      }

      try {
        await invoke('writeShell', shell.sessionId, command + '\n')
        const newOutput = [...shell.output, `$ ${command}`]
        setDeviceOutputs(prev => new Map(prev).set(deviceId, newOutput))
      } catch (err) {
        console.error(`Failed to write to shell ${shell.sessionId}:`, err)
      }
    }

    setCommand('')
  }

  const handleHistorySelect = (selectedCommand: string) => {
    setCommand(selectedCommand)
    setShowHistory(false)
  }

  return (
    <div className="command-line">
      <div className="content-area">
        <div className="main-panel">
          <div className="main-header">
            {activeDevice ? (
              <>
                <span className={`status-dot ${activeDevice.online ? 'online' : 'offline'}`} />
                <span className="device-name">{activeDevice.name}</span>
              </>
            ) : (
              <span className="no-device">未选择设备</span>
            )}
          </div>
          <div className="terminal-output" ref={outputRef}>
            {activeDevice ? (
              activeOutput.length > 0 ? (
                activeOutput.map((line, index) => (
                  <div key={index} className="output-line">{line}</div>
                ))
              ) : (
                <div className="empty-terminal">
                  终端输出将显示在这里
                </div>
              )
            ) : (
              <div className="empty-state">
                <div className="empty-icon">+</div>
                <div className="empty-text">从右侧列表选择一个设备</div>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar">
          <div className="sidebar-header">
            <span>设备列表</span>
            <span className="device-count">{devices.length}</span>
          </div>
          <div className="device-list">
            {devices.length > 0 ? (
              devices.map(device => (
                <MiniPanel
                  key={device.id}
                  device={device}
                  output={deviceOutputs.get(device.id) || []}
                  onClick={handleMiniPanelClick}
                />
              ))
            ) : (
              <div className="empty-device-list">
                暂无设备
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="broadcast-bar">
        <div className="device-selector">
          <label className="selector-item">
            <input
              type="checkbox"
              checked={selectedCount === devices.length && devices.length > 0}
              onChange={e => e.target.checked ? handleSelectAll() : handleDeselectAll()}
            />
            <span>全选</span>
          </label>
          <label className="selector-item">
            <input
              type="checkbox"
              checked={selectedCount === 0}
              onChange={handleDeselectAll}
            />
            <span>全不选</span>
          </label>
          <div className="selector-divider" />
          {devices.slice(0, 3).map(device => (
            <label key={device.id} className="selector-item device-checkbox">
              <input
                type="checkbox"
                checked={workspaceStore.selectedDeviceIds.has(device.id)}
                onChange={() => handleToggleDevice(device.id)}
              />
              <span className={`status-dot ${device.online ? 'online' : 'offline'}`} />
              <span className="device-name">{device.name}</span>
            </label>
          ))}
          {devices.length > 3 && (
            <span className="more-devices">+{devices.length - 3}</span>
          )}
        </div>

        <form className="command-form" onSubmit={handleCommandSubmit}>
          <input
            type="text"
            className="command-input"
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder="输入命令..."
          />
          <button
            type="button"
            className="history-btn"
            onClick={() => setShowHistory(true)}
            title="历史命令"
          >
            H
          </button>
          <button
            type="submit"
            className="broadcast-btn"
            disabled={selectedCount === 0 || !command.trim()}
          >
            广播 ({selectedCount})
          </button>
        </form>
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
