export const LANDING_SECTIONS = {
  amenities: 'amenities',
  gallery: 'gallery',
  about: 'about',
  testimonials: 'testimonials',
  contact: 'contact',
} as const

export type LandingSectionId = (typeof LANDING_SECTIONS)[keyof typeof LANDING_SECTIONS]

/** DOM order on the landing page — used for scroll-spy */
export const LANDING_SECTION_IDS: LandingSectionId[] = [
  'amenities',
  'gallery',
  'about',
  'testimonials',
  'contact',
]

export const LANDING_NAV_ANCHORS: { id: LandingSectionId; label: string }[] = [
  { id: 'amenities', label: 'Amenities' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'about', label: 'About' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
]
