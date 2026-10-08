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
    description
}: ProfileCardProps)
 {
    const isActive = selectedProfile === id;
  return (
  <button
    type="button"
    aria-pressed={isActive}
    onClick={() => onSelect(id)}
    className={`w-full p-5 rounded-xl border-2 cursor-pointer text-left transition-all flex items-start gap-4 select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
      isActive
        ? "bg-primary/10 border-primary shadow-lg scale-[1.02]"
        : "bg-secondary/10 border-secondary hover:border-primary/60"
    }`}
  >
    {/* Ícone */}
    <div
      className={`p-3 rounded-lg shrink-0 ${
        isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      }`}
    >
      <Icon className="w-6 h-6" />
    </div>

    {/* Textos (Título e Descrição) */}
    <div>
      <h4 className="font-bold text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </button>
)}
