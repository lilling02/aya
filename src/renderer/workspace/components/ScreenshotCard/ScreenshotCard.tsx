import { observer } from 'mobx-react-lite'
import { IWorkspaceDevice } from '../../store'
import './ScreenshotCard.module.scss'

interface Props {
  device: IWorkspaceDevice
  onRefresh: (deviceId: string) => void
  onContextMenu: (device: IWorkspaceDevice, e: React.MouseEvent) => void
}

function formatTimeSince(timestamp?: number): string {
  if (!timestamp) return ''
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return '刚刚'
  if (seconds < 60) return `${seconds}s 前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m 前`
  const hours = Math.floor(minutes / 60)
  return `${hours}h 前`
}

export default observer(function ScreenshotCard({ device, onRefresh, onContextMenu }: Props) {
  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRefresh(device.id)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    onContextMenu(device, e)
  }

  const timestamp = device.isOnline ? device.lastScreenshotTime : device.offlineTime
  const timeDisplay = formatTimeSince(timestamp)

  return (
    <div
      className={`screenshot-card ${!device.isOnline ? 'offline' : ''}`}
      onContextMenu={handleContextMenu}
    >
      <button className="refresh-btn" onClick={handleRefresh} title="刷新截图" />

      <div className="screenshot-wrapper">
        {device.screenshot ? (
          <img src={device.screenshot} alt={`${device.name} 截图`} />
        ) : (
          <div className="no-screenshot">无截图</div>
        )}
        {!device.isOnline && <div className="offline-overlay" />}
      </div>

      <div className="card-footer">
        <div className="device-info">
          <span className={`status-dot ${device.isOnline ? 'online' : 'offline'}`} />
          <span className="device-name">{device.name}</span>
          <span className="android-version">Android {device.androidVersion}</span>
        </div>
        <div className="timestamp">{timeDisplay}</div>
      </div>
    </div>
  )
})
