import Workspace from './Workspace'
import styles from './Workspace.module.scss'

export default function WorkspaceCmd() {
  return (
    <div className={styles.workspace}>
      <Workspace type="cmd" />
    </div>
  )
}
