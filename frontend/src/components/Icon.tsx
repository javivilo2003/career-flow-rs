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
/** Intrinsic SVG dimensions and colors come directly from Figma. */
export default function Icon({ name }: { name: IconName }) {
  return (
    <img src={`/ui/${name}.svg`} alt="" aria-hidden="true" className="block max-w-none shrink-0" />
  )
}
