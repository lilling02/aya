import { observer } from 'mobx-react-lite'
import { IWorkspaceDevice } from '../../store'
import Style from './MiniPanel.module.scss'
import className from 'licia/className'

interface Props {
  device: IWorkspaceDevice
  output: string[]
  selected: boolean
  onClick: (deviceId: string) => void
  onSelect: (deviceId: string) => void
}

export default observer(function MiniPanel({ device, output, selected, onClick, onSelect }: Props) {
  const handleClick = () => {
    onClick(device.id)
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect(device.id)
  }

  const last50Lines = output.slice(-50)

  return (
    <div className={className(Style.miniPanel, selected ? Style.selected : '')} onClick={handleClick}>
      <div className={Style.miniHeader}>
        <input
          type="checkbox"
          className={Style.checkbox}
          checked={selected}
          onChange={handleCheckboxChange}
          onClick={e => e.stopPropagation()}
        />
        <span className={className(Style.statusDot, device.online ? Style.online : Style.offline)} />
        <span className={Style.deviceName} style={device.color ? { color: device.color } : undefined}>
          {device.name}
        </span>
      </div>
      <div className={Style.miniOutput}>
        {last50Lines.map((line, index) => (
          <div key={index} className={Style.outputLine}>{line}</div>
        ))}
      </div>
    </div>
  )
})
