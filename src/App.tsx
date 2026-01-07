import React, { useEffect, useRef } from 'react'
import { useLocation,useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import RoutesConfig from './routes'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { useSettingsStore } from '@/store/settings'
import { useUserStore } from '@/store/user'

const App: React.FC = () => {
  const { theme } = useSettingsStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const previousAuth = useRef(user.isAuthenticated)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (!previousAuth.current && user.isAuthenticated) {
      if (location.pathname === '/signin' || location.pathname === '/login') {
        navigate('/', { replace: true })
      }
    }
    previousAuth.current = user.isAuthenticated
  }, [location.pathname, navigate, user.isAuthenticated])


  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">      
    <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <RoutesConfig key={location.pathname} />
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}

export default App
