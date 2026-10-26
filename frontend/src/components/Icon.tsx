import Add01Icon from '@hugeicons/core-free-icons/Add01Icon'
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon'
import Bookmark02Icon from '@hugeicons/core-free-icons/Bookmark02Icon'
import ChevronDownIcon from '@hugeicons/core-free-icons/ChevronDownIcon'
import ChevronUpIcon from '@hugeicons/core-free-icons/ChevronUpIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import Location01Icon from '@hugeicons/core-free-icons/Location01Icon'
import MessagesSquareIcon from '@hugeicons/core-free-icons/MessagesSquareIcon'
import MultiplicationSignIcon from '@hugeicons/core-free-icons/MultiplicationSignIcon'
import PencilEdit02Icon from '@hugeicons/core-free-icons/PencilEdit02Icon'
import SentIcon from '@hugeicons/core-free-icons/SentIcon'
import Tick02Icon from '@hugeicons/core-free-icons/Tick02Icon'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'

export type IconName =
  | 'badge-bookmark'
  | 'badge-send'
  | 'badge-messages-square'
  | 'badge-check'
  | 'badge-x'
  | 'card-map-pin'
  | 'card-pencil'
  | 'card-trash2'
  | 'input-circle-alert'
  | 'select-chevron-down'
  | 'select-chevron-down1'
  | 'select-chevron-up'
  | 'select-check'
  | 'modal-x'
  | 'modal-trash2'
  | 'checkbox-check'
  | 'button-add'

type IconDefinition = {
  icon: IconSvgElement
  size: number
  className: string
}

const iconDefinitions: Record<IconName, IconDefinition> = {
  'badge-bookmark': { icon: Bookmark02Icon, size: 14, className: '' },
  'badge-send': { icon: SentIcon, size: 14, className: '' },
  'badge-messages-square': { icon: MessagesSquareIcon, size: 14, className: '' },
  'badge-check': { icon: Tick02Icon, size: 14, className: '' },
  'badge-x': { icon: MultiplicationSignIcon, size: 14, className: '' },
  'card-map-pin': { icon: Location01Icon, size: 15, className: 'text-body' },
  'card-pencil': { icon: PencilEdit02Icon, size: 17, className: 'text-heading' },
  'card-trash2': { icon: Delete02Icon, size: 17, className: 'text-body' },
  'input-circle-alert': { icon: AlertCircleIcon, size: 17, className: 'text-danger' },
  'select-chevron-down': { icon: ChevronDownIcon, size: 16, className: 'text-body' },
  'select-chevron-down1': { icon: ChevronDownIcon, size: 16, className: 'text-disabled' },
  'select-chevron-up': { icon: ChevronUpIcon, size: 16, className: 'text-body' },
  'select-check': { icon: Tick02Icon, size: 16, className: 'text-heading' },
  'modal-x': { icon: MultiplicationSignIcon, size: 20, className: 'text-body' },
  'modal-trash2': { icon: Delete02Icon, size: 22, className: 'text-danger' },
  'checkbox-check': { icon: Tick02Icon, size: 14, className: 'text-page' },
  'button-add': { icon: Add01Icon, size: 18, className: 'text-heading' },
}

export default function Icon({ name }: { name: IconName }) {
  const definition = iconDefinitions[name]

  return (
    <HugeiconsIcon
      icon={definition.icon}
      size={definition.size}
      strokeWidth={1.7}
      aria-hidden="true"
      className={`block shrink-0 ${definition.className}`}
    />
  )
}
