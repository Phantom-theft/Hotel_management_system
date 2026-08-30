import { useState, type ChangeEvent } from 'react'
import { cloudinaryConfigured, uploadImage } from '../utils/upload'
import { toast } from '../store/toastStore'

interface ImageFieldProps {
  images: string[]
  onChange: (images: string[]) => void
}

export function ImageField({ images, onChange }: ImageFieldProps) {
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const canUpload = cloudinaryConfigured()

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const secureUrl = await uploadImage(file)
      onChange([...images, secureUrl])
      toast('Image uploaded', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function addUrl() {
    const trimmed = url.trim()
    if (!trimmed) return
    onChange([...images, trimmed])
    setUrl('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((src) => (
          <div key={src} className="relative h-16 w-20 overflow-hidden rounded border border-neutral-200">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              className="absolute right-0.5 top-0.5 rounded bg-neutral-900/70 px-1 text-[10px] text-white"
              onClick={() => onChange(images.filter((i) => i !== src))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste image URL"
          className="min-w-[200px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addUrl}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          Add URL
        </button>
        {canUpload && (
          <label className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm text-white transition hover:bg-primary-light">
            {uploading ? 'Uploading…' : 'Upload'}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
          </label>
        )}
      </div>
      {!canUpload && (
        <p className="text-xs text-neutral-500">
          Optional: set VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET for file uploads.
        </p>
      )}
    </div>
  )
}
