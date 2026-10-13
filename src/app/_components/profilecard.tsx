import React from "react"

interface ProfileCardProps {
  id: "alone" | "team" | "small" | "medium"
  selectedProfile: "alone" | "team" | "small" | "medium" | ""
  onSelect: (profile: "alone" | "team" | "small" | "medium") => void
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

export default function ProfileCard({
  id,
  selectedProfile,
  onSelect,
  icon: Icon,
  title,
  description,
}: ProfileCardProps) {
  const isActive = selectedProfile === id
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(id)}
      className={`flex w-full cursor-pointer select-none items-start gap-4 rounded-xl border p-5 text-left transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isActive
          ? "border-primary bg-primary/10"
          : "border-secondary bg-secondary/10 hover:border-primary/60"
      }`}
    >
      {/* Ícone */}
      <div
        className={`shrink-0 rounded-lg p-3 ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>

      {/* Textos (Título e Descrição) */}
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}
