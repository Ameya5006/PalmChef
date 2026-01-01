import React from 'react'
import { Routes, Route,Navigate, useLocation } from 'react-router-dom'
import Home from '@/pages/Home'
import Recipes from '@/pages/Recipes'
import Assistant from '@/pages/Assistant'
import About from '@/pages/About'
import Privacy from '@/pages/Privacy'
import NotFound from '@/pages/NotFound'
import Auth from '@/pages/Auth'
import PageTransition from '@/components/PageTransition'

const RoutesConfig: React.FC = () => {
  const location = useLocation()
  return (
    <PageTransition>


<Routes location={location}>
  <Route path="/" element={<Home />} />
  <Route path="/recipes" element={<Recipes />} />
  <Route path="/assistant/:id" element={<Assistant />} />
  <Route path="/assistant" element={<Navigate to="/recipes" replace />} />
  <Route path="/about" element={<About />} />
  <Route path="/privacy" element={<Privacy />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="*" element={<NotFound />} />
</Routes>

    </PageTransition>
  )
}

export default RoutesConfig
