import { observer } from 'mobx-react-lite'
import { IWorkspaceDevice } from '../../store'
import Style from './MiniPanel.module.scss'
import className from 'licia/className'

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
    <div className={Style.miniPanel} onClick={handleClick}>
      <div className={Style.miniHeader}>
        <span className={className(Style.statusDot, device.online ? Style.online : Style.offline)} />
        <span className={Style.deviceName}>{device.name}</span>
      </div>
      <div className={Style.miniOutput}>
        {last50Lines.map((line, index) => (
          <div key={index} className={Style.outputLine}>{line}</div>
        ))}
      </div>
    </div>
  )
})
