import Workspace from './Workspace'
import styles from './Workspace.module.scss'

export default function WorkspaceScreenshot() {
  return (
    <div className={styles.workspace}>
      <Workspace type="screenshot" />
    </div>
  )
}
