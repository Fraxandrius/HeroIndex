import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import { getFirebaseClient } from '../firebase/firebaseClient.js'

function sanitizeFileName(fileName = 'image') {
  const sanitizedName = fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/-+/g, '-')

  return sanitizedName || 'image'
}

function sanitizeFolder(folder = 'uploads') {
  const sanitizedFolder = folder
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')

  return sanitizedFolder || 'uploads'
}

export async function uploadImage(file, folder = 'uploads') {
  if (!file) {
    throw new Error('Image file is required')
  }

  if (!file.type?.startsWith('image/')) {
    throw new Error('Only image files can be uploaded')
  }

  const { app, isConfigured } = getFirebaseClient()

  if (!isConfigured || !app) {
    throw new Error('Firebase is not configured')
  }

  const storage = getStorage(app)
  const timestamp = Date.now()
  const safeFolder = sanitizeFolder(folder)
  const safeFileName = sanitizeFileName(file.name)
  const imageRef = ref(storage, `${safeFolder}/${timestamp}-${safeFileName}`)

  await uploadBytes(imageRef, file, { contentType: file.type })

  return getDownloadURL(imageRef)
}
