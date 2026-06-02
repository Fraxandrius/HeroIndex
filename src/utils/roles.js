export function isOraculoUser(userProfile) {
  return userProfile?.role === 'oraculo'
}

export function isPlayerUser(userProfile) {
  return (userProfile?.role ?? 'player') === 'player'
}

export function canSeeOraculoTools(userProfile) {
  return isOraculoUser(userProfile) || import.meta.env.VITE_ORACULO_MODE === 'true'
}
