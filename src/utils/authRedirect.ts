/** Build a /login location that returns the user to `returnTo` after sign-in */
export function loginWithReturn(returnTo: string) {
  return {
    pathname: '/login' as const,
    state: { from: returnTo },
  }
}

export function readReturnPath(state: unknown): string | undefined {
  const from = (state as { from?: string } | null)?.from
  if (!from || from === '/login' || from === '/register') return undefined
  return from
}
