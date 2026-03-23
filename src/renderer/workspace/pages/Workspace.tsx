import { observer } from 'mobx-react-lite'
import styles from './Workspace.module.scss'

interface Props {
  type: 'screenshot' | 'cmd'
}

export default observer(function Workspace({ type }: Props) {
  return (
    <div className={styles.workspace}>
      {type === 'screenshot' ? 'Screenshot Overview' : 'Command Line'}
    </div>
  )
})
