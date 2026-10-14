import Header from "@/app/_components/header"
export default function Loading() {
  return (
    <>
      <Header />
      <main
        className="mx-auto max-w-7xl p-5 sm:p-8"
        aria-busy="true"
        aria-label="Carregando barbearias"
      >
        <div className="mb-6 h-11 rounded-lg bg-muted" />
        <div className="grid gap-5 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      </main>
    </>
  )
}
