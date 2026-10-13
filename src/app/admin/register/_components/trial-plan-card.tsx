import { Check, Clock3, Info } from "lucide-react"
import {
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_PLAN_LABEL,
} from "@/lib/subscription-plan"

const benefits = [
  "Agenda da equipe e página pública de agendamento",
  "Serviços, produtos, estoque, caixa e comissões",
  "Histórico e relatórios para acompanhar a operação",
]

export function TrialPlanCard({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`rounded-2xl border border-primary/20 bg-primary/[0.055] p-4 text-sm text-foreground ${compact ? "" : "shadow-[0_16px_36px_hsl(var(--primary)/0.1)]"}`}
      aria-label="Plano de teste do BARBER-M"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Clock3 className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium">
            {SUBSCRIPTION_PLAN.trialDays} dias grátis
          </p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            O teste começa quando o cadastro for concluído.
          </p>
        </div>
      </div>

      {compact ? (
        <p className="mt-3 rounded-lg bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
          Sem cobrança agora. Você conhece o painel antes de decidir.
        </p>
      ) : (
        <div className="mt-4 border-y border-primary/15 py-3">
          <p className="text-xs text-muted-foreground">
            Depois do período de teste
          </p>
          <p className="mt-1 text-lg font-medium tracking-tight">
            {SUBSCRIPTION_PLAN_LABEL}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Pagamento por Pix para manter o acesso ao painel.
          </p>
        </div>
      )}

      {!compact && (
        <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-success"
                aria-hidden="true"
              />
              {benefit}
            </li>
          ))}
        </ul>
      )}

      {!compact && (
        <p className="mt-4 flex gap-2 rounded-lg bg-background/70 p-2.5 text-xs leading-5 text-muted-foreground">
          <Info
            className="mt-0.5 size-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          Sem assinatura ao fim do teste, o painel fica pausado até a ativação.
          Seus dados permanecem salvos.
        </p>
      )}
    </aside>
  )
}
