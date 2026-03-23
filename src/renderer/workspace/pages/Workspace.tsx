import { observer } from 'mobx-react-lite'
import getUrlParam from 'licia/getUrlParam'
import styles from './Workspace.module.scss'

export default observer(function Workspace() {
  const type = getUrlParam('type') as 'screenshot' | 'cmd'

  return (
    <div className={styles.workspace}>
      {type === 'screenshot' ? 'Screenshot Overview' : 'Command Line'}
    </div>
  )
})
