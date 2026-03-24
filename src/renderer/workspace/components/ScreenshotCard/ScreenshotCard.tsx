import { observer } from 'mobx-react-lite'
import { IWorkspaceDevice } from '../../store'
import Style from './ScreenshotCard.module.scss'

interface Props {
  device: IWorkspaceDevice
  onRefresh: (deviceId: string) => void
  onPreview: (deviceId: string) => void
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

export default observer(function ScreenshotCard({ device, onRefresh, onPreview, onContextMenu }: Props) {
  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRefresh(device.id)
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPreview(device.id)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    onContextMenu(device, e)
  }

  const timestamp = device.isOnline ? device.lastScreenshotTime : device.offlineTime
  const timeDisplay = formatTimeSince(timestamp)

  return (
    <div
      className={`${Style.screenshotCard} ${!device.isOnline ? Style.offline : ''}`}
      onContextMenu={handleContextMenu}
    >
      <button className={Style.refreshBtn} onClick={handleRefresh} title="刷新截图" />

      <div
        className={Style.screenshotWrapper}
      >
        {device.screenshot ? (
          <img
            src={device.screenshot}
            alt={`${device.name} 截图`}
            onClick={handlePreview}
          />
        ) : (
          <div className={Style.noScreenshot}>无截图</div>
        )}
        {!device.isOnline && <div className={Style.offlineOverlay} />}
        <button className={Style.previewBtn} onClick={handlePreview} title="查看大图">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        </button>
      </div>

      <div className={Style.cardFooter}>
        <div className={Style.deviceInfo}>
          <span className={`${Style.statusDot} ${device.isOnline ? Style.online : Style.offline}`} />
          <span className={Style.deviceName}>{device.name}</span>
          <span className={Style.androidVersion}>Android {device.androidVersion}</span>
        </div>
        <div className={Style.timestamp}>{timeDisplay}</div>
      </div>
    </div>
  )
})
