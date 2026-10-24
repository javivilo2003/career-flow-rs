import { type InputHTMLAttributes, useId } from 'react'

import { fieldDescription } from './fieldDescription'
import FieldMessage from './FieldMessage'
import Icon from './Icon'
export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  helperText?: string
  error?: string
  wrapperClassName?: string
}
export default function Input({
  label,
  helperText,
  error,
  id,
  className = '',
  wrapperClassName = '',
  disabled,
  'aria-describedby': describedBy,
  ...props
}: InputProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const message = error || helperText
  return (
    <div className={`flex min-w-0 flex-col gap-[9px] text-left ${wrapperClassName}`}>
      <label
        htmlFor={fieldId}
        className={`text-sm leading-[16px] font-medium ${disabled ? 'text-body' : 'text-heading'}`}
      >
        {label}
      </label>
      <div className="relative w-full">
        <input
          {...props}
          id={fieldId}
          disabled={disabled}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={fieldDescription(fieldId, describedBy, message)}
          className={`h-12 w-full min-w-0 rounded-[10px] border bg-page px-4 text-[15px] leading-[1.4] font-normal text-heading placeholder:text-body focus:outline-none disabled:cursor-not-allowed disabled:border-page disabled:text-disabled ${error ? 'border-danger pr-[45px] focus:border-danger' : 'border-border focus:border-2 focus:border-heading'} ${className}`}
        />
        {error && (
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
            <Icon name="input-circle-alert" />
          </span>
        )}
      </div>
      <FieldMessage fieldId={fieldId} error={error} helperText={helperText} />
    </div>
  )
}
