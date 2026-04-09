import React, { useEffect, useState } from 'react'

interface Props {
  message: string
  duration?: number
}

const Toast: React.FC<Props> = ({ message, duration = 2000 }) => {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), duration)
    return () => clearTimeout(t)
  }, [duration])
  if (!open) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 shadow-lg">
        {message}
      </div>
    </div>
  )
}

export default Toast
