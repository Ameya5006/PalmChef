import React from 'react'

const gestures = [
  {
    icon: '✋',
    title: 'Next step',
    description: 'Move forward in the recipe with an open palm.'
  },
  {
    icon: '✊',
    title: 'Previous step',
    description: 'Go back one step to review details.'
  },
  {
    icon: '✌️',
    title: 'Repeat narration',
    description: 'Replays the current instruction hands-free.'
  },
  {
    icon: '👍',
    title: 'Timer control',
    description: 'Start or pause the smart timer when it appears.'
  }
]

const About: React.FC = () => (
  
  <div className="space-y-8">
    <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-3xl font-semibold">About PalmChef</h1>
      <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
        PalmChef is a gesture-controlled kitchen assistant built for effortless,
        confident cooking. It combines hand tracking, smart timers, and narrated
        guidance so you can stay focused on what matters: your dish.
      </p>
    </header>

    <section className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Why it works</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          PalmChef keeps your hands clean while your recipe stays organized.
          Every interaction is designed for the kitchen—no distractions, just
          clear guidance.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Built for flow</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          From timers to narration, every feature is optimized for smooth,
          uninterrupted cooking sessions.
        </p>
      </div>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="text-2xl font-semibold">Gesture controls</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Use simple, intuitive gestures to guide your cooking session without
        touching your device.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {gestures.map(gesture => (
          <div
            key={gesture.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="text-2xl">{gesture.icon}</div>
            <h3 className="mt-3 font-semibold">{gesture.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {gesture.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  </div>
)

export default About