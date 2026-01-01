import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSettingsStore } from '@/store/settings'
import { MoonIcon, SunIcon } from 'lucide-react'

const NavBar: React.FC = () => {
  const { theme, toggleTheme } = useSettingsStore()

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-sky-500 text-white'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
    }`

  return (
        <header className="bg-slate-100/80 dark:bg-slate-900/80 shadow-sm sticky top-0 z-50 backdrop-blur">
      <nav className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold">
          <img src="/logo.png" alt="PalmChef logo" className="h-12 w-auto" />

          <span>PalmChef</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <NavLink to="/" className={linkClasses}>
            Home
          </NavLink>
          <NavLink to="/recipes" className={linkClasses}>
            Recipes
          </NavLink>
          <NavLink to="/about" className={linkClasses}>
            About
          </NavLink>
          <NavLink to="/privacy" className={linkClasses}>
            Privacy
          </NavLink>
                    <NavLink to="/auth" className={linkClasses}>
            Sign in
          </NavLink>
          <Link
            to="/recipes"
            className="ml-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Launch Assistant
          </Link>
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <SunIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>
    </header>
  )
}

export default NavBar
