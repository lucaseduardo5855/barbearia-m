export default function Loading() {
  return (
    <main
      className="mx-auto max-w-6xl p-5 sm:p-8"
      aria-busy="true"
      aria-label="Carregando barbearia"
    >
      <div className="mb-6 h-10 w-48 rounded-lg bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-card" />
      <div className="mt-6 h-80 animate-pulse rounded-xl bg-card" />
    </main>
  )
}
