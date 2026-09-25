# 📋 Barbearia SaaS - Roadmap & Tarefas

---

## 🚀 1. Integração de Pagamento Pix (SaaS / Mensalidade)
- [x] Criação da aplicação Mercado Pago ("Barbearia M Pix") com API de Pagamentos (Checkout Transparente).
- [x] Configuração das chaves no `.env`.
- [x] Tela de bloqueio (`pix-lock-screen.tsx`) com QR Code Pix dinâmico e Copia e Cola.
- [x] Remoção do fluxo manual de WhatsApp (agora 100% automatizado).
- [x] Auto-polling na tela de bloqueio (destrava automaticamente assim que o Pix é pago).
- [x] Rota de Webhook (`/api/webhooks/mercadopago/route.ts`) para receber notificações do Mercado Pago e atualizar o banco.
- [x] Validação prática do Webhook e fluxo de pagamento real de R$ 1,00 aprovado e liberado com sucesso.

---

## 💈 2. Agendamentos dos Clientes Finais (Cortes)
- [x] Remover a opção de "Pagar Online" para agendamentos de cortes.
- [x] Deixar como padrão único: **"Pagar no Local"** (o cliente agenda e paga presencialmente na barbearia).

---

## 📊 3. Melhoria no Banco de Dados: Histórico Financeiro
- [x] Criar model `SubscriptionPayment` no `schema.prisma`:
  - `id`: UUID
  - `barbershopId`: Referência para a Barbearia
  - `amount`: Valor pago (R$ 1,00 / R$ 49,90)
  - `paymentMethod`: PIX
  - `mercadopagoPaymentId`: ID único da transação no Mercado Pago
  - `status`: APPROVED, PENDING, REJECTED
  - `paidAt`: Data/hora da confirmação do pagamento
- [x] Vincular a gravação dessa tabela direto no Webhook do Mercado Pago.

---

## 🗄️ 4. Estratégia de Backup do Banco de Dados
- [x] **Neon Point-in-Time Recovery (PITR):** O Neon já realiza backups contínuos de todas as transações, permitindo restaurar o banco para qualquer minuto dos últimos 7 dias.
- [x] **Branching de Segurança:** Estratégia de criar branch de snapshot no console Neon antes de rodar migrações críticas.
- [x] **Script de Dump Local (`npm run db:backup`):** Script npm automatizado (`scripts/db-backup.js`) com fallback inteligente (pg_dump + snapshot Prisma ORM de todas as tabelas).

---

## 🛡️ 5. Checklist de Auditoria e Ajustes Finais de Segurança

| # | Item de Segurança | Status | Descrição / Solução |
|---|---|---|---|
| 01 | **Chaves de API Expostas** | ✅ Seguro | Chaves sensíveis ficam apenas no `.env` do servidor (Next.js server-side). |
| 02 | **Row Level Security / Isolamento Multi-tenant** | ✅ Seguro | Mutações e exclusões validam obrigatoriamente se o recurso pertence ao `barbershopId`. |
| 03 | **Permissão Validada no Servidor** | ✅ Seguro | `verifyOwnership` e checagens de autenticação/papel ativas em todas as Server Actions. |
| 04 | **Rate Limit nos Endpoints** | ✅ Seguro | Utilitário de rate limit em memória (`rate-limit.ts`) ativo para proteger endpoints públicos e webhooks. |
| 05 | **Proteção contra SQL Injection** | ✅ Seguro | Prisma ORM utiliza *Prepared Statements* por padrão, neutralizando injeção de SQL. |
| 06 | **Validação de Inputs no Servidor** | ✅ Seguro | Schemas **Zod** validando payloads antes de qualquer gravação no banco de dados. |
| 07 | **Senhas em Criptografia Segura** | ✅ Seguro | Utilização de `bcryptjs` com salt para hashing irreversível de senhas. |
| 08 | **Tokens em Cookies HTTP-Only** | ✅ Seguro | NextAuth configurado com cookies seguros (HTTP-Only, Secure, SameSite), blindados contra XSS. |
| 09 | **Configuração de CORS Restritivo** | ✅ Seguro | As rotas de API não enviam cabeçalhos `Access-Control-Allow-Origin`; portanto, o navegador bloqueia chamadas cross-origin por padrão. Webhooks são comunicação servidor-a-servidor e validam o pagamento diretamente na API do Mercado Pago. |
| 10 | **IDs Imprevisíveis na URL (Anti-IDOR)** | ✅ Seguro | Barbearias e usuários utilizam UUID / CUID, impedindo enumeração sequencial. |
| 11 | **Validação de Webhook** | ✅ Seguro | Webhook consulta o status real diretamente na API oficial do Mercado Pago com token privado. |
| 12 | **Ocultar Stack Traces em Produção** | ✅ Seguro | Tratamento de `try/catch` sanitizado; respostas de erro 500 sem vazar mensagens internas. |
| 13 | **Auditoria de Dependências** | ✅ Auditado | `npm audit fix` executado; dependências seguras e compatíveis atualizadas. |
| 14 | **Validação de Uploads** | ✅ Seguro | UploadThing restringe tipos MIME válidos (imagens) e limites de tamanho em megabytes. |

---

## 🎨 6. Refinamento de Frontend & UI/UX (Design & Responsividade)

- [x] **Padronização Visual das Telas:**
  - Marketplace (`/`): alinhamento dos cards de barbearia, categorias e carrossel de recomendações com `asChild` nativo.
  - Landing Page da Barbearia (`/[slug]`): apresentação moderna dos barbeiros, catálogo de serviços e fluxo de agendamento.
  - Painel Administrativo (`/[slug]/admin`): navegação refinada entre abas (Agenda, Financeiro, Serviços, Equipe, Configurações).
- [x] **Responsividade Mobile-First:**
  - Garantir adaptação fluida em smartphones (Android/iOS), tablets e telas ultrawide.
  - Ajustar gavetas (sheets), menus de navegação inferior/lateral e modais de agendamento para uso fácil com os dedos.
- [x] **Exibição do Histórico na Aba Financeiro (`financeiro-tab.tsx`):**
  - Renderizar a listagem do histórico de assinaturas pagas (`SubscriptionPayment`) formatado em `pt-BR` com badge de status e valor oficial.
- [x] **Micro-interações e Feedback Visual:**
  - Estados de loading modernos (esqueletos/skeletons e spinners elegantes).
  - Toasts (Sonner) descritivos para confirmações e erros.
  - Animações suaves de transição entre abas e modais.
- [x] **Acessibilidade e Contraste:**
  - Revisado o tema dark: texto principal, secundário e estados de foco mantêm legibilidade; cores de ação primária e destrutiva foram ajustadas para contraste AA com texto claro.



