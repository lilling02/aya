import { observer } from 'mobx-react-lite'
import getUrlParam from 'licia/getUrlParam'
import styles from './Workspace.module.scss'
import ScreenshotOverview from '../../components/ScreenshotOverview/ScreenshotOverview'
import CommandLine from '../../components/CommandLine/CommandLine'

export default observer(function Workspace() {
  const type = getUrlParam('type') as 'screenshot' | 'cmd'

  const handleOpenPreview = (deviceId: string) => {
    console.log('Open preview for device:', deviceId)
  }

  return (
    <div className={styles.workspace}>
      {type === 'screenshot' ? (
        <ScreenshotOverview onOpenPreview={handleOpenPreview} />
      ) : (
        <CommandLine />
      )}
    </div>
  )
})
