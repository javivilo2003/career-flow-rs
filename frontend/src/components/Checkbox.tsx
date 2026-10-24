import type { InputHTMLAttributes, ReactNode } from 'react'

import Icon from './Icon'
export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
}
export default function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-[10px] py-[6px] text-sm leading-normal text-heading ${className}`}
    >
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        <input
          {...props}
          type="checkbox"
          className="peer m-0 size-5 cursor-pointer appearance-none rounded-[4px] border border-body bg-page checked:border-heading checked:bg-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading disabled:cursor-not-allowed"
        />
        <span className="pointer-events-none absolute hidden peer-checked:block">
          <Icon name="checkbox-check" />
        </span>
      </span>
      {label}
    </label>
  )
}
