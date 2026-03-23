import { observer } from 'mobx-react-lite'
import { IWorkspaceDevice } from '../../store'
import './MiniPanel.module.scss'

interface Props {
  device: IWorkspaceDevice
  output: string[]
  onClick: (deviceId: string) => void
}

export default observer(function MiniPanel({ device, output, onClick }: Props) {
  const handleClick = () => {
    onClick(device.id)
  }

  const last50Lines = output.slice(-50)

  return (
    <div className="mini-panel" onClick={handleClick}>
      <div className="mini-header">
        <span className={`status-dot ${device.online ? 'online' : 'offline'}`} />
        <span className="device-name">{device.name}</span>
      </div>
      <div className="mini-output">
        {last50Lines.map((line, index) => (
          <div key={index} className="output-line">{line}</div>
        ))}
      </div>
    </div>
  )
})