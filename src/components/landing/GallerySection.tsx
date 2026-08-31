import { Gallery4 } from '../ui/gallery4'
import { GALLERY_ITEMS } from '../../constants/gallery'
import { LANDING_SECTIONS } from '../../constants/landing'

export function GallerySection() {
  return (
    <section id={LANDING_SECTIONS.gallery} className="scroll-mt-20 bg-neutral-50 py-16 sm:py-20">
      <Gallery4
        title="Around Harborlight"
        description="Walk the spaces that shape a stay here — from the first step inside to quiet corners above the water."
        items={GALLERY_ITEMS}
      />
    </section>
  )
}
