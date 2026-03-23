import { useEffect, useRef, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { workspaceStore } from '../../store'
import ScreenshotCard from '../ScreenshotCard/ScreenshotCard'
import './ScreenshotOverview.module.scss'

interface Props {
  onOpenPreview: (deviceId: string) => void
}

const REFRESH_OPTIONS = [
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '手动', value: 0 },
]

export default observer(function ScreenshotOverview({ onOpenPreview }: Props) {
  const intervalRef = useRef<number | undefined>(undefined)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; deviceId: string } | null>(null)
  const devices = [...workspaceStore.devices.values()]
  const onlineCount = devices.filter(d => d.isOnline).length
  const totalCount = devices.length

  const handleRefresh = useCallback((deviceId: string) => {
    // TODO: Implement actual screenshot refresh via IPC
    console.log('Refresh screenshot for device:', deviceId)
  }, [])

  const handleContextMenu = useCallback((device: typeof devices[0], e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, deviceId: device.id })
  }, [])

  const handleIntervalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value)
    workspaceStore.refreshInterval = value
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Set up refresh interval
  useEffect(() => {
    const interval = workspaceStore.refreshInterval

    if (interval > 0) {
      intervalRef.current = window.setInterval(() => {
        // TODO: Trigger screenshot refresh for all online devices via IPC
        console.log('Auto-refresh screenshots')
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }
  }, [workspaceStore.refreshInterval])

  if (totalCount === 0) {
    return (
      <div className="screenshot-overview">
        <div className="empty-state">
          未发现设备，请确保 ADB 已连接
        </div>
      </div>
    )
  }

  return (
    <div className="screenshot-overview">
      <div className="toolbar">
        <div className="device-count">
          {onlineCount} / {totalCount} 在线
        </div>
        <div className="refresh-selector">
          <select
            value={workspaceStore.refreshInterval}
            onChange={handleIntervalChange}
          >
            {REFRESH_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-container">
        <div className="device-grid">
          {devices.map(device => (
            <ScreenshotCard
              key={device.id}
              device={device}
              onRefresh={handleRefresh}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="menu-item" onClick={() => onOpenPreview(contextMenu.deviceId)}>
            打开设备预览
          </div>
        </div>
      )}
    </div>
  )
})
