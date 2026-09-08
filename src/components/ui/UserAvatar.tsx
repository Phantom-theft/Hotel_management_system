import { useState } from 'react'
import { cn } from '../../lib/utils'

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  className?: string
  textClassName?: string
  alt?: string
}

/** Shared avatar for profile, header, and dashboard sidebars. */
export function UserAvatar({
  name,
  avatarUrl,
  className,
  textClassName,
  alt,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(avatarUrl) && !failed

  if (showImage) {
    return (
      <img
        src={avatarUrl!}
        alt={alt ?? name}
        className={cn('object-cover', className)}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold uppercase',
        className,
        textClassName,
      )}
      aria-hidden={!alt}
      aria-label={alt}
    >
      {initialsFromName(name)}
    </span>
  )
}
