import { type FocusEvent, type KeyboardEvent, useId, useRef, useState } from 'react'

import Icon from './Icon'

export type SelectOption = { value: string; label: string }

export type SelectProps = {
  label: string
  options: readonly SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  defaultOpen?: boolean
}

type SelectBehaviorOptions = Pick<
  SelectProps,
  'defaultOpen' | 'defaultValue' | 'disabled' | 'onChange' | 'options' | 'value'
>

function clampOption(index: number, optionCount: number) {
  return Math.max(0, Math.min(optionCount - 1, index))
}

function useSelectBehavior({
  defaultOpen = false,
  defaultValue = '',
  disabled = false,
  onChange,
  options,
  value,
}: SelectBehaviorOptions) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [open, setOpen] = useState(defaultOpen)
  const current = value ?? internalValue
  const selected = options.findIndex((option) => option.value === current)
  const [active, setActive] = useState(Math.max(0, selected))
  const trigger = useRef<HTMLButtonElement>(null)
  const expanded = open && !disabled

  function choose(index: number) {
    const option = options[index]

    if (!option) {
      return
    }

    setInternalValue(option.value)
    onChange?.(option.value)
    setOpen(false)
    trigger.current?.focus()
  }

  function moveActive(delta: number) {
    const nextIndex = expanded ? clampOption(active + delta, options.length) : Math.max(0, selected)

    setActive(nextIndex)
    setOpen(true)
  }

  function openAtBoundary(index: number) {
    setActive(clampOption(index, options.length))
    setOpen(true)
  }

  function toggleSelectedOption() {
    if (expanded) {
      choose(active)
      return
    }

    setActive(Math.max(0, selected))
    setOpen(true)
  }

  function findByTypedCharacter(key: string) {
    const match = options.findIndex((option) =>
      option.label.toLowerCase().startsWith(key.toLowerCase()),
    )

    if (match >= 0) {
      setActive(match)
      setOpen(true)
    }
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    const actions: Partial<Record<string, () => void>> = {
      ArrowDown: () => moveActive(1),
      ArrowUp: () => moveActive(-1),
      Home: () => openAtBoundary(0),
      End: () => openAtBoundary(options.length - 1),
      Enter: toggleSelectedOption,
      ' ': toggleSelectedOption,
    }
    const action = actions[event.key]

    if (action) {
      event.preventDefault()
      action()
      return
    }

    if (event.key === 'Escape') {
      event.stopPropagation()
      setOpen(false)
      return
    }

    if (event.key === 'Tab') {
      setOpen(false)
      return
    }

    if (event.key.length === 1) {
      findByTypedCharacter(event.key)
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false)
    }
  }

  function toggleOpen() {
    setActive(Math.max(0, selected))
    setOpen((isOpen) => !isOpen)
  }

  return {
    active,
    choose,
    current,
    expanded,
    handleBlur,
    handleKey,
    selected,
    setActive,
    toggleOpen,
    trigger,
  }
}

function triggerStateClasses(disabled: boolean, expanded: boolean, hasSelection: boolean) {
  if (disabled) {
    return 'border-page text-disabled'
  }

  if (expanded) {
    return 'border-heading text-heading'
  }

  return `border-border ${hasSelection ? 'text-heading' : 'text-body'}`
}

function chevronName(disabled: boolean, expanded: boolean) {
  if (disabled) {
    return 'select-chevron-down1' as const
  }

  return expanded ? ('select-chevron-up' as const) : ('select-chevron-down' as const)
}

function activeOptionId(fieldId: string, expanded: boolean, active: number) {
  return expanded ? `${fieldId}-option-${active}` : undefined
}

function selectedOptionLabel(
  options: readonly SelectOption[],
  selected: number,
  placeholder: string,
) {
  return options[selected]?.label ?? placeholder
}

function HiddenSelectInput({
  name,
  value,
  disabled,
}: {
  name?: string
  value: string
  disabled: boolean
}) {
  if (!name) {
    return null
  }

  return <input type="hidden" name={name} value={value} disabled={disabled} />
}

function SelectOptions({
  active,
  choose,
  current,
  expanded,
  fieldId,
  options,
  setActive,
}: {
  active: number
  choose: (index: number) => void
  current: string
  expanded: boolean
  fieldId: string
  options: readonly SelectOption[]
  setActive: (index: number) => void
}) {
  if (!expanded) {
    return null
  }

  return (
    <ul
      id={`${fieldId}-options`}
      role="listbox"
      aria-labelledby={`${fieldId}-label`}
      className="absolute top-full z-20 mt-2 flex w-full list-none flex-col gap-[2px] rounded-[10px] border border-border bg-page p-[6px]"
    >
      {options.map((option, index) => {
        const isSelected = current === option.value
        const isHighlighted = index === active || isSelected

        return (
          <li
            key={option.value}
            id={`${fieldId}-option-${index}`}
            role="option"
            aria-selected={isSelected}
            onMouseDown={(event) => event.preventDefault()}
            onMouseMove={() => setActive(index)}
            onClick={() => choose(index)}
            className={`flex h-9 cursor-pointer items-center justify-between rounded-[6px] px-[10px] text-sm leading-normal text-heading ${isHighlighted ? 'bg-surface' : 'bg-page'}`}
          >
            {option.label}
            {isSelected && <Icon name="select-check" />}
          </li>
        )
      })}
    </ul>
  )
}

export default function Select({
  label,
  options,
  value,
  defaultValue = '',
  onChange,
  placeholder = 'Choose a status',
  disabled = false,
  name,
  id,
  className = '',
  defaultOpen = false,
}: SelectProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const behavior = useSelectBehavior({
    defaultOpen,
    defaultValue,
    disabled,
    onChange,
    options,
    value,
  })
  const {
    active,
    choose,
    current,
    expanded,
    handleBlur,
    handleKey,
    selected,
    setActive,
    toggleOpen,
    trigger,
  } = behavior
  const activeDescendant = activeOptionId(fieldId, expanded, active)
  const triggerClasses = triggerStateClasses(disabled, expanded, selected >= 0)

  return (
    <div
      className={`relative flex min-w-0 flex-col gap-[9px] text-left ${className}`}
      onBlur={handleBlur}
    >
      <label
        id={`${fieldId}-label`}
        htmlFor={fieldId}
        className={`text-sm leading-[16px] font-medium ${disabled ? 'text-body' : 'text-heading'}`}
      >
        {label}
      </label>
      <HiddenSelectInput name={name} value={current} disabled={disabled} />
      <button
        ref={trigger}
        id={fieldId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={`${fieldId}-options`}
        aria-labelledby={`${fieldId}-label`}
        aria-activedescendant={activeDescendant}
        disabled={disabled}
        onKeyDown={handleKey}
        onClick={toggleOpen}
        className={`flex h-12 w-full items-center gap-3 rounded-[10px] border bg-page px-4 text-left text-[15px] leading-[1.4] focus-visible:outline-2 focus-visible:outline-heading disabled:cursor-not-allowed ${triggerClasses}`}
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOptionLabel(options, selected, placeholder)}
        </span>
        <Icon name={chevronName(disabled, expanded)} />
      </button>
      <SelectOptions
        active={active}
        choose={choose}
        current={current}
        expanded={expanded}
        fieldId={fieldId}
        options={options}
        setActive={setActive}
      />
    </div>
  )
}
