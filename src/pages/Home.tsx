import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const featureHighlights = [
  {
    title: 'Gesture-first navigation',
    description: 'Move through steps with palm, fist, and victory gestures—no messy taps.'
  },
  {
    title: 'Smart timers',
    description: 'PalmChef recognizes cook times and launches the perfect timer on cue.'
  },
  {
    title: 'Voice-guided cooking',
    description: 'Hear every step, adjust rate or pitch, and repeat instructions on demand.'
  },
  {
    title: 'Works offline',
    description: 'Install the PWA and keep your kitchen workflow reliable without Wi-Fi.'
  }
]

const workflowSteps = [
  {
    title: 'Import any recipe',
    description: 'Paste a URL or upload a PDF to instantly build structured steps.'
  },
  {
    title: 'Start a guided session',
    description: 'PalmChef narrates each instruction while showing your current step.'
  },
  {
    title: 'Cook hands-free',
    description: 'Wave to move forward, pause timers, or repeat a detail anytime.'
  }
]

const Home: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-16"
  >

    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 px-6 py-16 text-slate-900 shadow-xl shadow-sky-200/60">
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-start gap-6">
        <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Hands-free cooking, elevated
        </span>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Welcome to PalmChef — your smart, gesture-powered kitchen assistant.
        </h1>
        <p className="max-w-2xl text-lg text-slate-700">
          Bring pro-level flow to your kitchen. PalmChef keeps recipes, timers,
          and step narration in sync so you can focus on the dish, not the
          screen.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/recipes"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Start cooking
          </Link>
          <Link
            to="/about"
            className="rounded-full border border-white/80 bg-white/60 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            See the gestures
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl" />
      </div>
    </section>

    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Trusted kitchen flow
        </p>
        <h2 className="mt-2 text-3xl font-semibold">
          Everything a modern cooking session needs.
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          PalmChef unifies guidance, timers, and hands-free controls into one
          beautiful workflow.
        </p>
        <Link
          to="/recipes"
          className="mt-5 inline-flex items-center text-sm font-semibold text-sky-600 hover:text-sky-500"
        >
          Explore the recipe dashboard →
        </Link>
      </div>
      <div className="grid gap-6 lg:col-span-2 lg:grid-cols-2">
        {featureHighlights.map(feature => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:shadow-none"
          >
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>

    <section className="grid gap-8 rounded-3xl border border-slate-200/70 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 lg:grid-cols-2">
      <div>
        <h2 className="text-3xl font-semibold">A guided experience from prep to plate.</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Whether you are simmering a sauce or baking a cake, PalmChef keeps
          every step front and center with accessible guidance and instant
          control.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur dark:bg-slate-900/70">
            <p className="text-sm uppercase tracking-wide text-slate-500">Step clarity</p>
            <p className="mt-2 text-2xl font-semibold">100%</p>
            <p className="text-sm text-slate-500">Always know what to do next.</p>
          </div>
          <div className="rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur dark:bg-slate-900/70">
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Hands-free time
            </p>
            <p className="mt-2 text-2xl font-semibold">+40%</p>
            <p className="text-sm text-slate-500">More focus on cooking.</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {workflowSteps.map(step => (
          <div
            key={step.title}
            className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
          >
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>

    <section className="grid gap-8 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold">Live kitchen HUD</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Keep gesture feedback, timers, and spoken guidance in view while you
          move around the kitchen.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold">Personalized settings</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Tune narration speed, pitch, and themes to match your cooking rhythm.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold">Private by design</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          All hand tracking and recipe parsing stays in your browser—no data
          leaves your device.
        </p>
      </div>
    </section>

    <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-12 text-white shadow-xl shadow-slate-300/30">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center gap-4">
        <h2 className="text-3xl font-semibold">Ready to cook with confidence?</h2>
        <p className="text-slate-200">
          Build your recipe library and let PalmChef guide every step with
          touch-free control.
        </p>
        <Link
          to="/recipes"
          className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Build your recipe library
        </Link>
      </div>
    </section>
  </motion.div>
)

export default Home