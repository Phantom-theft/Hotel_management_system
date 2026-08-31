import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { HOTEL_CONTACT, MAP_VIEW } from '../../constants/contact'

export function ContactMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
      iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
      shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
    })

    const map = L.map(el, {
      center: [MAP_VIEW.lat, MAP_VIEW.lng],
      zoom: MAP_VIEW.zoom,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(map)

    L.marker([MAP_VIEW.lat, MAP_VIEW.lng]).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="min-h-[220px] flex-1 overflow-hidden rounded-xl border border-neutral-200 shadow-card [&_.leaflet-control-zoom]:border-neutral-200"
      role="img"
      aria-label={`Map of ${HOTEL_CONTACT.address}`}
    />
  )
}
