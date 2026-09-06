import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import type { GalleryItem } from '@/constants/gallery'

export interface Gallery4Props {
  title?: string
  description?: string
  items: GalleryItem[]
  className?: string
}

const navButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-primary shadow-sm transition hover:bg-neutral-50 disabled:pointer-events-auto disabled:opacity-40'

function GallerySlideMedia({ item }: { item: GalleryItem }) {
  const sharedClass =
    'absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105'

  if (item.imageUrl) {
    return <img src={item.imageUrl} alt="" className={sharedClass} />
  }

  return (
    <div
      className={sharedClass}
      style={{ backgroundImage: item.gradient }}
      role="img"
      aria-label={item.title}
    />
  )
}

export function Gallery4({
  title = 'Around Harborlight',
  description = 'Walk the spaces that shape a stay here — from the first step inside to quiet corners above the water.',
  items,
  className,
}: Gallery4Props) {
  const shouldReduceMotion = useReducedMotion()
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!carouselApi) return

    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev())
      setCanScrollNext(carouselApi.canScrollNext())
      setCurrentSlide(carouselApi.selectedScrollSnap())
    }

    updateSelection()
    carouselApi.on('select', updateSelection)
    return () => {
      carouselApi.off('select', updateSelection)
    }
  }, [carouselApi])

  return (
    <div className={cn(className)}>
      <motion.div
        className="mx-auto max-w-6xl px-4 text-center"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">The Property</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-600">{description}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            className={navButtonClass}
            onClick={() => carouselApi?.scrollPrev()}
            disabled={!canScrollPrev}
            aria-label="Previous slide"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            className={navButtonClass}
            onClick={() => carouselApi?.scrollNext()}
            disabled={!canScrollNext}
            aria-label="Next slide"
          >
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </motion.div>

      <motion.div
        className="mx-auto mt-10 w-full max-w-6xl px-4"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: 'center',
            dragFree: true,
            breakpoints: {
              '(min-width: 768px)': { dragFree: false },
            },
          }}
        >
          <CarouselContent>
            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className="basis-[85%] pl-4 sm:basis-[70%] md:basis-[55%] lg:basis-[45%] xl:basis-[38%]"
              >
                <article className="group h-full rounded-xl">
                  <div className="relative h-full min-h-[27rem] max-w-full overflow-hidden rounded-xl shadow-card md:aspect-[5/4] lg:aspect-[16/9]">
                    <GallerySlideMedia item={item} />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-white md:p-8">
                      <h3 className="font-display text-xl font-bold md:text-2xl">{item.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-200 md:line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Gallery slides">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={currentSlide === index}
              aria-label={`Go to ${item.title}`}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                currentSlide === index ? 'bg-primary' : 'bg-primary/20',
              )}
              onClick={() => carouselApi?.scrollTo(index)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
