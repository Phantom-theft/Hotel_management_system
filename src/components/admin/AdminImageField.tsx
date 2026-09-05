import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Link2, Upload, X } from 'lucide-react'
import { toast } from '../../store/toastStore'

interface AdminImageFieldProps {
  /** Existing / pasted image URLs (persisted or about to be saved). */
  imageUrls: string[]
  onUrlsChange: (urls: string[]) => void
  /** New files to upload via multipart on save (not yet on the server). */
  imageFiles: File[]
  onFilesChange: (files: File[]) => void
}

export function AdminImageField({
  imageUrls,
  onUrlsChange,
  imageFiles,
  onFilesChange,
}: AdminImageFieldProps) {
  const [urlInput, setUrlInput] = useState('')
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const next = imageFiles.map((f) => URL.createObjectURL(f))
    setFilePreviews(next)
    return () => {
      next.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [imageFiles])

  function addUrl() {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    onUrlsChange([...imageUrls, trimmed])
    setUrlInput('')
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return

    const invalid = selected.find((f) => !f.type.match(/^image\/(jpeg|jpg|png|webp)$/i))
    if (invalid) {
      toast('Only jpg, jpeg, png, or webp images are allowed', 'error')
      e.target.value = ''
      return
    }

    const tooLarge = selected.find((f) => f.size > 5 * 1024 * 1024)
    if (tooLarge) {
      toast('Each image must be 5MB or smaller', 'error')
      e.target.value = ''
      return
    }

    onFilesChange([...imageFiles, ...selected])
    e.target.value = ''
  }

  const hasPreviews = imageUrls.length > 0 || filePreviews.length > 0

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-neutral-500">Images</label>

      {hasPreviews && (
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((src, i) => (
            <div
              key={`url-${src.slice(0, 40)}-${i}`}
              className="group relative h-28 w-36 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-2xs"
            >
              <img src={src} alt={`Room ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onUrlsChange(imageUrls.filter((_, idx) => idx !== i))}
                className="absolute right-1.5 top-1.5 rounded-md bg-neutral-900/80 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-neutral-900"
                title="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {filePreviews.map((src, i) => (
            <div
              key={`file-${i}-${imageFiles[i]?.name}`}
              className="group relative h-28 w-36 overflow-hidden rounded-lg border border-primary/30 bg-neutral-50 shadow-2xs"
            >
              <img
                src={src}
                alt={imageFiles[i]?.name ?? `New ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded bg-neutral-900/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                New
              </span>
              <button
                type="button"
                onClick={() => onFilesChange(imageFiles.filter((_, idx) => idx !== i))}
                className="absolute right-1.5 top-1.5 rounded-md bg-neutral-900/80 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-neutral-900"
                title="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={onFile}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-7 text-center transition hover:border-primary/50 hover:bg-primary/5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-primary shadow-2xs">
          <ImagePlus className="h-5 w-5" />
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
          <Upload className="h-3.5 w-3.5" />
          Choose image from device
        </span>
        <span className="text-xs text-neutral-500">
          JPG, PNG, or WebP · max 5MB each · preview shows after you select
        </span>
      </button>

      <div className="relative flex items-center">
        <Link2 className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-neutral-400" />
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addUrl()
            }
          }}
          placeholder="Or paste an image URL"
          className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-9 pr-24 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={addUrl}
          className="absolute right-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200 hover:text-neutral-900"
        >
          Add URL
        </button>
      </div>
    </div>
  )
}
