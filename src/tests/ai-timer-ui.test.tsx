// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import TimerDisplay from '@/components/TimerDisplay'
import { executeTool } from '@/ai/tools'
import { useRecipesStore } from '@/store/recipes'
import { useSessionStore } from '@/store/session'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('AI and cooking timer share state', () => {
  it('starts a prepared step timer from the cooking controls', () => {
    useSessionStore.getState().setStepTimer(15, 'step-preset')
    render(<TimerDisplay initialSeconds={15} />)
    expect(useSessionStore.getState().timerPaused).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(useSessionStore.getState()).toMatchObject({ timerActive: true, timerPaused: false, timerRemaining: 15 })
  })

  it('shows an AI five-second timer in the cooking UI until it expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    useRecipesStore.setState({ recipes: [{ id: 'timer-recipe', title: 'Soup', sourceType: 'manual', createdAt: 1, steps: [{ id: 'step', text: 'Cook soup.' }] }] })
    useSessionStore.getState().setRecipe('timer-recipe')
    await act(async () => { await executeTool({ id: 'start', name: 'start_timer', args: { duration_seconds: 5 } }) })
    render(<TimerDisplay />)
    expect(screen.getByRole('timer').textContent).toBe('00:05')
    act(() => { vi.advanceTimersByTime(4000) })
    expect(screen.getByRole('timer').textContent).toBe('00:01')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('timer').textContent).toBe('00:00')
    expect(useSessionStore.getState().timerActive).toBe(false)
  })

  it('reflects AI pause and resume, then stops through the cooking UI', async () => {
    useRecipesStore.setState({ recipes: [{ id: 'timer-recipe', title: 'Soup', sourceType: 'manual', createdAt: 1, steps: [{ id: 'step', text: 'Cook soup.' }] }] })
    useSessionStore.getState().setRecipe('timer-recipe')
    await act(async () => { await executeTool({ id: 'start', name: 'start_timer', args: { duration_seconds: 30, label: 'Rice' } }) })
    render(<TimerDisplay />)
    expect(screen.getByRole('timer').textContent).toBe('00:30')
    await act(async () => { await executeTool({ id: 'pause', name: 'pause_timer', args: {} }) })
    expect(useSessionStore.getState().timerActive).toBe(false)
    await act(async () => { await executeTool({ id: 'resume', name: 'resume_timer', args: {} }) })
    expect(useSessionStore.getState().timerActive).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(screen.getByRole('timer').textContent).toBe('00:00')
    expect(useSessionStore.getState()).toMatchObject({ timerActive: false, timerRemaining: 0, timerEndsAt: null })
  })
})
