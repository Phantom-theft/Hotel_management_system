export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white/70 p-8">
      <h1 className="font-display text-3xl text-neutral-900">{title}</h1>
      <p className="mt-2 text-neutral-600">{note}</p>
    </div>
  )
}
