import React, { useState } from 'react'
import { motion } from 'framer-motion'

type AuthMode = 'login' | 'signup'

type AuthResponse = {
  token: string
  user: {
    id: string
    email: string
  }
}

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const resetMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleModeChange = (nextMode: AuthMode) => {
    if (mode !== nextMode) {
      setMode(nextMode)
      setPassword('')
      setConfirmPassword('')
      resetMessages()
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = (await response.json()) as AuthResponse | { error: string }

      if (!response.ok) {
        const message =
          'error' in data
            ? typeof data.error === 'string'
              ? data.error
              : 'Something went wrong.'
            : 'Something went wrong.'
        throw new Error(message)
      }

      if ('token' in data) {
        localStorage.setItem('palmchef_token', data.token)
        localStorage.setItem('palmchef_user', JSON.stringify(data.user))
      }

      setSuccess(
        mode === 'login'
          ? 'Welcome back! You are signed in.'
          : 'Account created! You are signed in.'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]"
    >
      <div className="rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">
          PalmChef Access
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          Cook smarter with personalized guidance.
        </h1>
        <p className="mt-4 text-base text-white/80">
          Create an account to save your favorite recipes, sync timers across
          devices, and pick up cooking sessions where you left off.
        </p>
        <div className="mt-8 space-y-4 text-sm text-white/80">
          <div className="rounded-2xl bg-white/15 p-4">
            <h2 className="font-semibold text-white">Hands-free setup</h2>
            <p className="mt-1">
              Access gesture control profiles and voice preferences.
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4">
            <h2 className="font-semibold text-white">Weekly inspiration</h2>
            <p className="mt-1">
              Get tailored meal ideas based on your pantry and schedule.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {mode === 'login'
                ? 'Sign in to keep cooking.'
                : 'Join PalmChef to save your progress.'}
            </p>
          </div>
          <div className="rounded-full bg-slate-100 p-1 text-sm dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`rounded-full px-3 py-1 transition ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`rounded-full px-3 py-1 transition ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
            >
              Sign up
            </button>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-900"
              placeholder="you@palmchef.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-900"
              placeholder="••••••••"
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-900"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>
      </div>
    </motion.section>
  )
}

export default Auth