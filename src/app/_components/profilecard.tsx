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
  <div
    className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 select-none ${
      isActive
        ? "bg-primary/10 border-primary shadow-lg scale-[1.02]"
        : "bg-secondary/10 border-secondary hover:border-gray-500"
    }`}
    onClick={() => onSelect(id)}
  >
    {/* Ícone */}
    <div
      className={`p-3 rounded-lg shrink-0 ${
        isActive ? "bg-primary text-black" : "bg-secondary text-white"
      }`}
    >
      <Icon className="w-6 h-6" />
    </div>

    {/* Textos (Título e Descrição) */}
    <div>
      <h4 className="font-bold text-sm text-white">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
)}
