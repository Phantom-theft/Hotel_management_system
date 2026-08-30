import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchRooms } from '../../api/hotel'
import { LANDING_SECTIONS } from '../../constants/landing'
import { SectionHeading } from './SectionHeading'

function gallerySearchDates() {
  const checkInDate = new Date()
  checkInDate.setDate(checkInDate.getDate() + 1)
  const checkOutDate = new Date(checkInDate)
  checkOutDate.setDate(checkOutDate.getDate() + 7)
  return {
    checkIn: checkInDate.toISOString().slice(0, 10),
    checkOut: checkOutDate.toISOString().slice(0, 10),
  }
}

async function fetchGalleryImages() {
  const { checkIn, checkOut } = gallerySearchDates()
  const { rooms } = await searchRooms({ checkIn, checkOut, guests: 1 })
  const seen = new Set<string>()
  const images: { url: string; label: string }[] = []

  for (const room of rooms) {
    const roomType = room.roomType
    if (!roomType) continue
    for (const url of roomType.images ?? []) {
      if (seen.has(url)) continue
      seen.add(url)
      images.push({ url, label: roomType.name })
    }
  }

  return images
}

const gradientTiles = [
  {
    label: 'Lobby',
    gradient: 'linear-gradient(145deg, #1e3a6e 0%, #0f1e3c 40%, #c9a227 100%)',
    tall: true,
  },
  {
    label: 'Suite',
    gradient: 'linear-gradient(160deg, #0f1e3c 0%, #2563eb 45%, #d4a574 100%)',
    tall: false,
  },
  {
    label: 'Rooftop',
    gradient: 'linear-gradient(135deg, #1e3a6e 0%, #64748b 50%, #f5e6d3 100%)',
    tall: false,
  },
  {
    label: 'Restaurant',
    gradient: 'linear-gradient(150deg, #0f1e3c 0%, #1e3a6e 60%, #e8c49a 100%)',
    tall: true,
  },
  {
    label: 'Pool',
    gradient: 'linear-gradient(145deg, #2563eb 0%, #0f1e3c 55%, #94a3b8 100%)',
    tall: false,
  },
  {
    label: 'Entrance',
    gradient: 'linear-gradient(155deg, #1e3a6e 0%, #0f1e3c 35%, #c9a227 90%)',
    tall: false,
  },
  {
    label: 'Lounge',
    gradient: 'linear-gradient(140deg, #0f1e3c 0%, #334155 50%, #d4a574 100%)',
    tall: false,
  },
  {
    label: 'Courtyard',
    gradient: 'linear-gradient(160deg, #1e3a6e 0%, #2563eb 30%, #f5e6d3 100%)',
    tall: true,
  },
]

type GalleryItem = {
  key: string
  label: string
  imageUrl?: string
  gradient?: string
  tall?: boolean
}

export function GallerySection() {
  const { data: uploadedImages = [] } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: fetchGalleryImages,
    retry: false,
    staleTime: 10 * 60 * 1000,
  })

  const items = useMemo(() => {
    const uploaded: GalleryItem[] = uploadedImages.map((image) => ({
      key: image.url,
      label: image.label,
      imageUrl: image.url,
    }))

    const placeholders: GalleryItem[] = gradientTiles.map((tile) => ({
      key: tile.label,
      label: tile.label,
      gradient: tile.gradient,
      tall: tile.tall,
    }))

    if (uploaded.length >= 6) {
      return uploaded.slice(0, 8)
    }

    const merged = [...uploaded]
    for (const tile of placeholders) {
      if (merged.length >= 8) break
      if (!merged.some((m) => m.label === tile.label && m.imageUrl)) {
        merged.push(tile)
      }
    }
    return merged.slice(0, 8)
  }, [uploadedImages])

  return (
    <section id={LANDING_SECTIONS.gallery} className="scroll-mt-20 bg-neutral-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="The Property"
          title="A glimpse inside Harborlight"
          description="Warm light, quiet corners, and spaces designed for unhurried evenings."
        />
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((item) => (
            <figure
              key={item.key}
              className={`mb-4 break-inside-avoid overflow-hidden rounded-xl shadow-card ${
                item.tall ? 'sm:aspect-[3/4]' : 'sm:aspect-[4/3]'
              }`}
            >
              <div className="relative min-h-[200px] w-full sm:min-h-0 sm:h-full">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={
                    item.imageUrl
                      ? { backgroundImage: `url(${item.imageUrl})` }
                      : { backgroundImage: item.gradient }
                  }
                  role="img"
                  aria-label={item.label}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent px-4 py-3 text-sm font-semibold text-white">
                  {item.label}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
