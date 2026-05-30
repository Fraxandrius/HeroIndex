const memoryStore = new Map()

export function getStoredValue(key, fallbackValue = null) {
  return memoryStore.has(key) ? memoryStore.get(key) : fallbackValue
}

export function setStoredValue(key, value) {
  memoryStore.set(key, value)
  return value
}
