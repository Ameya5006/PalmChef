import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import TTSControls from '@/components/TTSControls'
import { useSettingsStore } from '@/store/settings'

describe('TTSControls', () => {
  it('invokes speechSynthesis on Speak/Stop', async () => {
    // ensure default settings exist
    useSettingsStore.setState({ voiceRate: 1, voicePitch: 1, theme: 'light' })

    render(<TTSControls currentText="Hello PalmChef" />)

    const speakBtn = screen.getByRole('button', { name: /speak/i })
    fireEvent.click(speakBtn)
    expect(window.speechSynthesis.speak).toHaveBeenCalled()

    // Switch to Stop button
    const stopBtn = await screen.findByRole('button', { name: /stop/i })
    fireEvent.click(stopBtn)
    expect(window.speechSynthesis.cancel).toHaveBeenCalled()
  })
})
