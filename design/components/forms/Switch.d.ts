import { ChangeEventHandler } from 'react'

/**
 * Boolean toggle switch. Use for settings (тёмная тема, проактивные уведомления,
 * консолидированный вид) — anything with an immediate on/off effect.
 */
export interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** Inline label to the right of the track. */
  label?: string
  /** @default "md" */
  size?: 'md' | 'lg'
  disabled?: boolean
  id?: string
  className?: string
}

export declare function Switch(props: SwitchProps): JSX.Element
