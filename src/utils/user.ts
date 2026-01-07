import { getItem, removeItem, saveItem } from './storage'

export interface StoredUser {
  id?: string
  name?: string
  email?: string
  avatarUrl?: string
}

type PersistedUserState = {
  state?: {
    user?: StoredUser
  }
}

const USER_KEYS = ['palmchef-user-profile', 'palmchef-user', 'palmchefUser', 'user']

const extractStoredUser = (
  value: StoredUser | PersistedUserState | null
): StoredUser | null => {
  if (!value) return null
  if (typeof value === 'object' && 'state' in value && value.state?.user) {
    return value.state.user
  }
  return value as StoredUser
}

export const getStoredUser = (): StoredUser | null => {
  for (const key of USER_KEYS) {
    const value = getItem<StoredUser | PersistedUserState>(key)
    const user = extractStoredUser(value)
    if (user) return user
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
