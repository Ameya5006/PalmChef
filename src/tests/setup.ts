const items = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => items.get(key) ?? null,
  setItem: (key: string, value: string) => { items.set(key, value) },
  removeItem: (key: string) => { items.delete(key) },
  clear: () => { items.clear() }
} })
