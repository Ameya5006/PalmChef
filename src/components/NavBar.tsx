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
    <header className="bg-slate-100 dark:bg-slate-900 shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold">
          <img src="/logo.svg" alt="PalmChef" className="h-8 w-8" />
          <span>PalmChef</span>
        </Link>
        <div className="flex items-center gap-2">
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
          <button
            onClick={toggleTheme}
            className="ml-3 rounded-full p-2 hover:bg-slate-200 dark:hover:bg-slate-800"
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
