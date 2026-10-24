export function fieldDescription(fieldId: string, describedBy?: string, message?: string) {
  return [describedBy, message ? `${fieldId}-help` : ''].filter(Boolean).join(' ') || undefined
}
