import { type TextareaHTMLAttributes, useId } from 'react'

import { fieldDescription } from './fieldDescription'
import FieldMessage from './FieldMessage'
import Icon from './Icon'
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  helperText?: string
  error?: string
  wrapperClassName?: string
}
export default function Textarea({
  label,
  helperText,
  error,
  id,
  className = '',
  wrapperClassName = '',
  'aria-describedby': describedBy,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const message = error || helperText
  return (
    <div className={`flex min-w-0 flex-col gap-[9px] text-left ${wrapperClassName}`}>
      <label htmlFor={fieldId} className="text-sm leading-[16px] font-medium text-heading">
        {label}
      </label>
      <div className="relative w-full">
        <textarea
          {...props}
          id={fieldId}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={fieldDescription(fieldId, describedBy, message)}
          className={`block h-[108px] w-full resize-none rounded-[10px] border bg-page px-4 py-[14px] text-[15px] leading-[1.4] text-heading placeholder:text-body focus:outline-none disabled:cursor-not-allowed disabled:text-disabled ${error ? 'border-danger pr-[45px]' : 'border-border focus:border-2 focus:border-heading'} ${className}`}
        />
        {error && (
          <span className="pointer-events-none absolute top-[14px] right-4">
            <Icon name="input-circle-alert" />
          </span>
        )}
      </div>
      <FieldMessage fieldId={fieldId} error={error} helperText={helperText} />
    </div>
  )
}
