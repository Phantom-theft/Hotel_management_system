import landingBackground from '../../assets/landing-background.png'

/** Fixed full-viewport hero — identical crop on landing and auth routes */
export function LandingHeroBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#091326] via-[#0F1E3C] to-[#1B3563]">
        <img
          src={landingBackground}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/20" />
      </div>
    </div>
  )
}
