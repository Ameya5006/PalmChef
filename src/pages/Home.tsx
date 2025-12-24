import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Home: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="text-center mt-12"
  >
    <h1 className="text-4xl font-bold mb-4">Welcome to PalmChef</h1>
    <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
      Cook hands-free with gesture control, voice guidance, and timers.
    </p>
    <Link
      to="/recipes"
      className="bg-sky-500 text-white px-6 py-3 rounded-md text-lg hover:bg-sky-600"
    >
      Get Started
    </Link>
  </motion.div>
)

export default Home
