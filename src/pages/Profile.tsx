import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredUser, getStoredUser, saveStoredUser } from '@/utils/user'

const Profile: React.FC = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      navigate('/', { replace: true })
      return
    }
    setName(user.name ?? 'PalmChef User')
    setEmail(user.email ?? '')
    setAvatarUrl(user.avatarUrl ?? '')
  }, [navigate])

  const initials = useMemo(() => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return 'PC'
    return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('')
  }, [name])

  const handleSave = () => {
    saveStoredUser({ name, email, avatarUrl })
  }

  const handleLogout = () => {
    clearStoredUser()
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <h1 className="text-3xl font-semibold">Your Profile</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Manage your account details and keep your PalmChef identity fresh.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,340px),1fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-3xl font-semibold text-white shadow-lg shadow-slate-300/40">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <h2 className="mt-4 text-xl font-semibold">{name}</h2>
          {email && <p className="mt-1 text-sm text-slate-500">{email}</p>}
          <button
            onClick={handleLogout}
            className="mt-5 w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Log out
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold">Profile settings</h2>
          <div className="mt-4 grid gap-4">
            <label className="text-sm text-slate-600 dark:text-slate-300">
              Display name
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              Email
              <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              Avatar URL
              <input
                value={avatarUrl}
                onChange={event => setAvatarUrl(event.target.value)}
                placeholder="https://"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>
          <button
            onClick={handleSave}
            className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Save changes
          </button>
        </div>
      </section>
    </div>
  )
}

export default Profile