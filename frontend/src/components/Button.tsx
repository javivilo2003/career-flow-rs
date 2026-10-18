import type { ButtonHTMLAttributes, ReactNode } from 'react'

type FigmaButtonVariant =
  | 'Variante2'
  | 'Variante3'
  | 'Variante4'
  | 'Variante5'
  | 'Variante6'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  figmaVariant?: FigmaButtonVariant
  children: ReactNode
}

const variantClasses: Record<FigmaButtonVariant, string> = {
  Variante2: 'bg-accent text-page',
  Variante3: 'bg-surface text-body',
  Variante4: 'bg-accent-muted text-surface',
  Variante5: 'bg-transparent text-page underline',
  Variante6: 'bg-transparent text-accent underline',
}

function Button({
  children,
  className = '',
  disabled,
  figmaVariant = 'Variante2',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-[35px] w-[100px] items-center justify-center rounded-[10px] border-0 text-center text-[12px] font-bold leading-normal ${
        variantClasses[figmaVariant]
      } ${disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'} ${className}`}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
