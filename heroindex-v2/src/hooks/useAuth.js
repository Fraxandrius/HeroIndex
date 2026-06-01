import { useEffect, useState } from 'react'
import { logout as logoutSession, subscribeToAuth, subscribeToUserProfile } from '../services/authService.js'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(
    () => subscribeToAuth((nextUser) => {
      setCurrentUser(nextUser)
      setAuthLoading(false)
      setProfileLoading(Boolean(nextUser))
      if (!nextUser) {
        setUserProfile(null)
      }
    }),
    [],
  )

  useEffect(() => {
    if (!currentUser?.uid) {
      return undefined
    }

    return subscribeToUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile)
      setProfileLoading(false)
    })
  }, [currentUser?.uid])

  return {
    currentUser,
    isLoggedIn: Boolean(currentUser),
    loading: authLoading || profileLoading,
    logout: logoutSession,
    userProfile,
  }
}
