import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  return (
     <footer className="bg-slate-100 dark:bg-slate-900 mt-10 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <img src="/logo.png" alt="PalmChef logo" className="h-8 w-auto" />
            <span>PalmChef</span>
          </Link>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The hands-free kitchen assistant built for effortless, guided cooking
            sessions at home.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Product
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/recipes" className="hover:text-sky-500">
                Recipe Library
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-sky-500">
                Gestures
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-sky-500">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Resources
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sky-500"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href="https://developers.google.com/mediapipe"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sky-500"
              >
                MediaPipe
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Get Started
          </h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Import a recipe, choose a step, and let PalmChef guide your
            hands-free cooking session.
          </p>
          <Link
            to="/recipes"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Try PalmChef
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PalmChef — The Hands-Free Kitchen Assistant
      
      </div>
    </footer>
  )
}

export default Footer
