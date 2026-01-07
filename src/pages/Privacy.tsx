import React from 'react'

const Privacy: React.FC = () => (
  <div className="space-y-8">
    <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
        PalmChef runs entirely in your browser. Your recipes, webcam feed, and
        gesture data never leave your device.
      </p>
    </header>

    <section className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          PalmChef does not collect personal data. Recipes are stored locally in
          your browser so you can resume a session without creating an account.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">How your data is used</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Hand tracking and gesture recognition happen on-device. No video or
          telemetry is transmitted or stored remotely.
        </p>
      </div>
    </section>

    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="text-2xl font-semibold">Your control</h2>
      <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
        <li>Delete recipes at any time by removing them from your browser.</li>
        <li>Disable camera access by revoking permission in your browser.</li>
        <li>Use PalmChef offline to keep your data fully local.</li>
      </ul>
    </section>
  </div>
)

export default Privacy