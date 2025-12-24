import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import GestureCanvas from '@/components/GestureCanvas'
import { Hands } from '@mediapipe/hands'

describe('GestureCanvas', () => {
  it('initializes webcam and MediaPipe Hands', async () => {
    const onGesture = vi.fn()
    render(<GestureCanvas onGesture={onGesture} throttleMs={9999} />)

    // video element should exist
    const video = await screen.findByRole('video', {}, { timeout: 100 }).catch(() => null)
    // JSDOM doesn't support role=video; just query by tag
    expect(document.querySelector('video')).toBeInTheDocument()

    // hands instance should be created and configured
    await waitFor(() => {
      const instance = (Hands as unknown as vi.Mock).mock?.instances?.[0]
      expect(instance?.setOptions).toBeDefined()
    })
  })
})
