import React from 'react'

const About: React.FC = () => (
  <div className="prose dark:prose-invert max-w-none">
    <h1>About PalmChef</h1>
    <p>
      PalmChef is a gesture-controlled, AI-powered kitchen assistant. It lets
      you cook without touching your device by using hand-tracking and voice
      narration to follow recipes.
    </p>
    <ul>
      <li>✋ Open Palm → Next Step</li>
      <li>✊ Fist → Previous Step</li>
      <li>✌️ Victory → Repeat Step</li>
      <li>👍 Thumbs Up → Start/Pause Timer</li>
    </ul>
  </div>
)

export default About
