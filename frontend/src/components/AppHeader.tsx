import { Link, NavLink } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Applications', to: '/applications' },
  { label: 'Companies', to: '/companies' },
  { label: 'Contacts', to: '/contacts' },
  { label: 'Interviews', to: '/interviews' },
] as const

function navigationClassName({ isActive }: { isActive: boolean }) {
  return `inline-flex h-10 shrink-0 items-center rounded-[10px] px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading ${isActive ? 'bg-surface text-heading' : 'text-body hover:bg-surface hover:text-heading'}`
}

export default function AppHeader() {
  return (
    <header className="border-b border-border bg-page">
      <div className="mx-auto flex max-w-[1840px] flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-12">
        <Link
          to="/applications"
          className="self-start text-xl font-bold text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading"
        >
          CareerFlow
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0"
        >
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navigationClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
