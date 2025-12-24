import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import RoutesConfig from './routes'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { useSettingsStore } from '@/store/settings'

const App: React.FC = () => {
  const { theme } = useSettingsStore()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex min-h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <RoutesConfig key={location.pathname} />
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}

export default App
