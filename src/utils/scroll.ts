const HEADER_OFFSET = 72

export function scrollToTop(behavior: ScrollBehavior = 'smooth') {
  window.scrollTo({ top: 0, behavior })
}

/** Instant scroll — used before auth transitions so layout doesn't jump mid-animation */
export function scrollToTopInstant() {
  window.scrollTo({ top: 0, behavior: 'auto' })
}

export function scrollToSection(id: string, behavior: ScrollBehavior = 'smooth') {
  const el = document.getElementById(id)
  if (!el) return false

  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top: Math.max(0, top), behavior })
  return true
}
