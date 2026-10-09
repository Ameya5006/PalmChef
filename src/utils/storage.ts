export function saveItem<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage save failed', e)
  }
}

export function getItem<T>(key: string): T | null {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

export function removeItem(key: string) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error('Storage remove failed', e)
  }
}
