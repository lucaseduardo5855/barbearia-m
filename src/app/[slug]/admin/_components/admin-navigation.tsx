import {
  CalendarDays,
  Coins,
  DollarSign,
  History,
  LayoutDashboard,
  Settings,
  Scissors,
  Users,
  ShoppingBag,
  Share2,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
export const adminTabLabels = {
  overview: "Visão geral",
  agenda: "Agenda",
  historico: "Histórico",
  financeiro: "Financeiro",
  comissoes: "Comissões",
  relatorio_produtos_servicos: "Produtos e serviços",
  servicos: "Serviços",
  produtos: "Produtos (Estoque)",
  equipe: "Equipe",
  marketing: "Divulgação",
  config: "Configurações",
  notifications: "Mensagens e lembretes",
} as const
export type AdminTab = keyof typeof adminTabLabels
const sections = [
  {
    label: "Gestão",
    items: [
      { tab: "overview", icon: LayoutDashboard, manage: true },
      { tab: "agenda", icon: CalendarDays },
      { tab: "historico", icon: History },
    ],
  },
  {
    label: "Financeiro",
    items: [{ tab: "financeiro", icon: DollarSign, manage: true }],
  },
  {
    label: "Relatórios",
    items: [
      { tab: "comissoes", icon: Coins, manage: true },
      { tab: "relatorio_produtos_servicos", icon: Scissors, manage: true },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { tab: "servicos", icon: Scissors, manage: true },
      { tab: "produtos", icon: ShoppingBag, manage: true },
      { tab: "equipe", icon: Users, manage: true },
      { tab: "config", icon: Settings, manage: true },
      { tab: "notifications", icon: Bell, owner: true },
      { tab: "marketing", icon: Share2, manage: true },
    ],
  },
] satisfies {
  label: string
  items: {
    tab: AdminTab
    icon: typeof Scissors
    manage?: boolean
    owner?: boolean
  }[]
}[]
export function AdminNavigation({
  activeTab,
  onSelect,
  role,
}: {
  activeTab: AdminTab
  onSelect: (tab: AdminTab) => void
  role: "OWNER" | "ADMIN" | "EMPLOYEE"
}) {
  return (
    <nav className="flex flex-col gap-5 text-sm" aria-label="Áreas do painel">
      {sections.map((section) => {
        const items = section.items.filter(
          (item) =>
            !("manage" in item && role === "EMPLOYEE") &&
            !("owner" in item && role !== "OWNER"),
        )
        if (!items.length) return null
        return (
          <div key={section.label}>
            <span className="mb-1.5 block px-2 text-xs text-muted-foreground">
              {section.label}
            </span>
            <div className="space-y-1">
              {items.map(({ tab, icon: Icon }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onSelect(tab)}
                  aria-current={activeTab === tab ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeTab === tab
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {adminTabLabels[tab]}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
