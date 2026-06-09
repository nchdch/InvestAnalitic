import { ReactNode, SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

/**
 * Native <select> wrapped in system field chrome with a custom chevron. Provide
 * `options` or pass <option> children. Common uses: счёт picker, период (день/
 * неделя/месяц/год), валюта, метод усреднения (FIFO/WAVG).
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg'
  /** Option list — alternative to passing <option> children. */
  options?: SelectOption[]
  /** Disabled leading placeholder option. */
  placeholder?: string
  children?: ReactNode
}

export declare function Select(props: SelectProps): JSX.Element
