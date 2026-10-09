import React from 'react'
import { Link } from 'react-router-dom'

const NotFound: React.FC = () => (
  <div className="text-center py-24">
    <h1 className="text-5xl font-bold mb-4">404</h1>
    <p className="text-slate-500 mb-6">Page not found.</p>
    <Link to="/" className="text-sky-500 hover:underline">
      Go Home
    </Link>
  </div>
)

export default NotFound
