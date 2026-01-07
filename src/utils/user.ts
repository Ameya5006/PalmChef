import { getItem, removeItem, saveItem } from './storage'

export interface StoredUser {
  id?: string
  name?: string
  email?: string
  avatarUrl?: string
}

const USER_KEYS = ['palmchef-user', 'palmchefUser', 'user']

export const getStoredUser = (): StoredUser | null => {
  for (const key of USER_KEYS) {
    const value = getItem<StoredUser>(key)
    if (value) return value
  }
  return null
}

export const saveStoredUser = (user: StoredUser) => {
  saveItem(USER_KEYS[0], user)
  window.dispatchEvent(new Event('palmchef-user-updated'))
}

export const clearStoredUser = () => {
  USER_KEYS.forEach(removeItem)
  window.dispatchEvent(new Event('palmchef-user-updated'))
}