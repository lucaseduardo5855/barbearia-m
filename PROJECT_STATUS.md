# BARBER-M — mapa do projeto e ordem de execução

Atualizado em 11/10/2026. Este arquivo é o mapa de decisão do MVP. O objetivo é evitar mexer em várias telas ao mesmo tempo sem fechar os fluxos principais.

## 1. O que já existe

### Produto público

- `/landing`: apresentação comercial para donos de barbearia.
- `/`: marketplace público para o cliente encontrar estabelecimentos.
- `/barbershops/[id]`: perfil público de uma barbearia.
- `/[slug]`: página pública por slug, com catálogo e entrada para agendamento.
- `/[slug]/agendar`: fluxo de serviço, profissional, data e horário.
- `/[slug]/reservas`: área de reservas do cliente.

### Produto do dono

- `/admin/register`: onboarding da barbearia.
- `/[slug]/admin`: painel por barbearia.
- Abas existentes: visão geral, agenda, histórico, financeiro, comissões, relatórios, serviços, produtos, equipe, marketing e configurações.
- Bloqueio de assinatura e pagamento Pix via Mercado Pago.

### Backend

- Next.js App Router + Server Actions.
- Prisma + PostgreSQL.
- NextAuth com credenciais/social.
- UploadThing para imagens.
- Webhook Mercado Pago e cron de lembretes.
- Modelos principais para usuários, barbearias, barbeiros, serviços, produtos, agendamentos e transações.

## 2. O que está incompleto ou precisa de validação

### P0 — antes de vender

1. **Fluxo completo do cliente**: marketplace → perfil → serviço → profissional → horário → login → reserva confirmada.
2. **Fluxo completo do dono**: landing → cadastro → slug → página pública → painel.
3. **Horários reais**: `Barbershop.openingHours` ainda é texto; precisa virar uma estrutura validável por dia, abertura, fechamento e intervalo.
4. **Disponibilidade real**: o agendamento precisa respeitar expediente, bloqueios, duração do serviço e conflitos por profissional.
5. **Login tardio**: preservar seleção também em Google/Facebook, não somente no login por e-mail.
6. **Permissões**: validar dono, administrador, barbeiro e cliente em todas as ações e em todas as rotas por slug.
7. **Dados de demonstração**: separar seed/demo de dados reais antes de apresentar o produto para outra barbearia.

### P1 — experiência vendável

1. Estados de loading, vazio e erro em marketplace, perfil, agendamento e painel.
2. Revisão mobile do marketplace e do checkout.
3. Página pública da barbearia com catálogo, card fixo de informações e CTA de agendamento.
4. Convite de barbeiro com vínculo ao usuário correto.
5. Notificações de confirmação e lembrete com rastreabilidade.
6. Planos, trial e bloqueio de assinatura configuráveis por barbearia.

### P2 — escala

1. Multiunidade: hoje `Barbershop.ownerId` é único, então o mesmo dono não pode ter várias unidades.
2. Separar `admin-actions.ts` por domínio: agenda, serviços, equipe, produtos e financeiro.
3. Criar testes automatizados para disponibilidade, autorização e criação/cancelamento de reservas.
4. Observabilidade: logs estruturados, monitoramento de erros e auditoria de ações críticas.
5. Pagamentos e planos com idempotência, retry e tela de assinatura.

## 3. Estrutura recomendada sem reescrever tudo

```text
src/
  app/                  # rotas e composição de páginas
    _components/        # componentes compartilhados do produto
    _actions/           # ações temporárias; migrar por domínio
    api/                # webhooks, auth, cron e uploads
    [slug]/              # experiência isolada da barbearia
  components/ui/        # primitives shadcn reutilizáveis
  lib/                  # Prisma, auth, rate limit e utilitários

prisma/
  schema.prisma
  migrations/
  seed.ts

scripts/
  db-backup.js
```

Não mova centenas de arquivos agora. Primeiro feche os fluxos P0. A reorganização de pastas só deve acontecer quando uma ação estiver grande demais para ser testada e mantida.

## 4. Ordem recomendada de trabalho

### Branch 1 — `feature/qa-fluxos-mvp`

- Testar os dois fluxos principais manualmente.
- Corrigir redirects, mensagens de erro e estados vazios.
- Registrar cada bug reproduzível.

### Branch 2 — `feature/availability-rules`

- Criar modelo estruturado de expediente.
- Gerar horários livres por duração do serviço.
- Respeitar bloqueios, folgas e conflitos.

### Branch 3 — `feature/booking-auth-preservation`

- Unificar o estado temporário do agendamento.
- Preservar a seleção em e-mail, Google e Facebook.
- Criar a reserva uma única vez após autenticação.

### Branch 4 — `feature/tenant-permissions`

- Centralizar `getSession`, papel e `barbershopId`.
- Auditar ações administrativas e rotas dinâmicas.
- Testar tentativa de acessar dados de outra barbearia.

### Branch 5 — `feature/public-booking-experience`

- Refinar catálogo público no padrão Fresha.
- Melhorar mobile, sticky card e confirmação.
- Usar os dados cadastrados no onboarding sem duplicação.

## 5. Critério para considerar o MVP pronto

- Um dono cria uma barbearia sem intervenção manual.
- O slug público mostra os serviços e horários configurados.
- Um cliente agenda sem login prévio.
- O login não apaga a seleção do cliente.
- O horário não pode ser reservado duas vezes.
- O dono visualiza o agendamento na agenda e no histórico.
- Usuário de uma barbearia não consegue ler ou alterar outra.
- O fluxo funciona em desktop e celular.

## 6. Diagnóstico atual

O projeto não precisa de uma reescrita. Ele precisa de fechamento de regras de negócio e testes de fluxo. A prioridade não é adicionar mais páginas nem trocar toda a aparência: é transformar o que já existe em um produto confiável para a primeira barbearia pagante.

