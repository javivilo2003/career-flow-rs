import type { ButtonHTMLAttributes } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive'
  /** Compatibility for existing screens; new code should use variant. */
  figmaVariant?: 'Variante2' | 'Variante3' | 'Variante4' | 'Variante5' | 'Variante6'
}
const variants = {
  primary: 'border-page bg-page text-heading',
  secondary: 'border-body bg-surface text-heading',
  destructive: 'border-danger bg-danger-surface text-danger',
}
export default function Button({
  variant,
  figmaVariant,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const style = variant ?? (figmaVariant && figmaVariant !== 'Variante2' ? 'secondary' : 'primary')
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex h-12 shrink-0 items-center justify-center rounded-[10px] border px-5 text-center text-sm leading-normal font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading ${disabled ? 'cursor-not-allowed border-border bg-surface text-disabled' : `cursor-pointer ${variants[style]}`} ${className}`}
      {...props}
    />
  )
}
