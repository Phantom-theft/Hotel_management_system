/**
 * Upload an image to Cloudinary (unsigned preset) when env is configured.
 * Falls back to rejecting so the UI can accept a pasted URL instead.
 */
export async function uploadImage(file: File): Promise<string> {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined

  if (!cloud || !preset) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET, or paste an image URL.',
    )
  }

  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', preset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body,
  })

  if (!res.ok) {
    throw new Error('Image upload failed')
  }

  const json = (await res.json()) as { secure_url?: string }
  if (!json.secure_url) throw new Error('Upload response missing URL')
  return json.secure_url
}

export function cloudinaryConfigured() {
  return !!(
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  )
}
