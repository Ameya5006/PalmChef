import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settings'
import { MoonIcon, SunIcon } from 'lucide-react'
import { clearStoredUser, getStoredUser } from '@/utils/user'

const NavBar: React.FC = () => {
  const { theme, toggleTheme } = useSettingsStore()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateUser = () => {
      const user = getStoredUser()
      setUserName(user?.name ?? null)
      setUserAvatar(user?.avatarUrl ?? null)
    }
    updateUser()
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('storage', updateUser)
    window.addEventListener('focus', updateUser)
    window.addEventListener('palmchef-user-updated', updateUser)
    document.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('storage', updateUser)
      window.removeEventListener('focus', updateUser)
      window.removeEventListener('palmchef-user-updated', updateUser)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  const initials = useMemo(() => {
    if (!userName) return 'PC'
    return userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('')
  }, [userName])

  const handleLogout = () => {
    clearStoredUser()
    setIsMenuOpen(false)
    navigate('/', { replace: true })
  }

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-300/50 dark:bg-white dark:text-slate-900'
        : 'text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 hover:shadow-lg hover:shadow-slate-200/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:hover:shadow-none'
    }`

  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto mt-4 flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 shadow-lg shadow-slate-200/40 backdrop-blur transition duration-300 hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold">
        <img src="/logo.png" alt="PalmChef" className="h-12 w-12" />
          <span>PalmChef</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1.5">
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
          <Link
            to="/recipes"
            className="ml-1 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-300/50 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-300/60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:hover:shadow-none"
          >
            Launch Assistant
          </Link>
          {!userName && (
            <Link
              to="/auth"
              className="ml-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Sign in
            </Link>
          )}
          {userName && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:shadow-none"
                aria-label="Open profile menu"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-slate-200/70 bg-white/90 p-2 text-sm shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Signed in as
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {userName}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="block rounded-xl px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Change username
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-left font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-200/60 dark:hover:bg-slate-800 dark:hover:shadow-none"
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