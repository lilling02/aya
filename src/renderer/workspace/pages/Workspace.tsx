import { observer } from 'mobx-react-lite'

interface Props {
  type: 'screenshot' | 'cmd'
}

export default observer(function Workspace({ type }: Props) {
  return (
    <div className="workspace">
      {type === 'screenshot' ? 'Screenshot Overview' : 'Command Line'}
    </div>
  )
})
