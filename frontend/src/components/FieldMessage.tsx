type FieldMessageProps = { fieldId: string; error?: string; helperText?: string }

export default function FieldMessage({ fieldId, error, helperText }: FieldMessageProps) {
  const message = error || helperText
  if (!message) {
    return null
  }
  return (
    <p
      id={`${fieldId}-help`}
      className={`m-0 text-xs leading-[17px] ${error ? 'text-danger' : 'text-body'}`}
    >
      {message}
    </p>
  )
}
