import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 text-center py-6 mt-8 border-t border-slate-200 dark:border-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        © {new Date().getFullYear()} PalmChef — The Hands-Free Kitchen Assistant
      </p>
      <div className="mt-2 space-x-3">
        <Link to="/privacy" className="text-sky-500 hover:underline">
          Privacy Policy
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-500 hover:underline"
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}

export default Footer
