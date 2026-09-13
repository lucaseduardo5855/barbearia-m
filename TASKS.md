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
- [ ] Remover a opção de "Pagar Online" para agendamentos de cortes.
- [ ] Deixar como padrão único: **"Pagar no Local"** (o cliente agenda e paga presencialmente na barbearia).

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
- [ ] **Neon Point-in-Time Recovery (PITR):** O Neon já realiza backups contínuos de todas as transações, permitindo restaurar o banco para qualquer minuto dos últimos 7 dias.
- [ ] **Branching de Segurança:** Criar uma branch de snapshot antes de rodar migrações críticas.
- [ ] **Script de Dump Local (`pg_dump`):** Criar script npm para exportar arquivo `.sql` de backup sob demanda.

---

## 🛡️ 5. Checklist de Auditoria e Ajustes Finais de Segurança

| # | Item de Segurança | Status | Descrição / Solução |
|---|---|---|---|
| 01 | **Chaves de API Expostas** | ✅ Seguro | Chaves sensíveis ficam apenas no `.env` do servidor (Next.js server-side). |
| 02 | **Row Level Security / Isolamento Multi-tenant** | ⏳ A Validar | Garantir que todas as queries de admin filtrem obrigatoriamente por `barbershopId` e `userId` da sessão. |
| 03 | **Permissão Validada no Servidor** | ⏳ A Validar | Nunca confiar apenas em esconder botões no front; validar papel (`ADMIN`/`OWNER`) em cada Server Action. |
| 04 | **Rate Limit nos Endpoints** | ⏳ A Fazer | Proteger rotas públicas e webhooks contra abuso e força bruta (ex: `@upstash/ratelimit`). |
| 05 | **Proteção contra SQL Injection** | ✅ Seguro | Prisma ORM utiliza *Prepared Statements* por padrão, neutralizando injeção de SQL. |
| 06 | **Validação de Inputs no Servidor** | ⏳ A Validar | Validar todos os payloads recebidos com schemas **Zod** antes de gravar no banco. |
| 07 | **Senhas em Criptografia Segura** | ✅ Seguro | Utilização de `bcryptjs` com salt para hashing irreversível de senhas. |
| 08 | **Tokens em Cookies HTTP-Only** | ✅ Seguro | NextAuth configurado com cookies seguros (HTTP-Only, Secure, SameSite), blindados contra XSS. |
| 09 | **Configuração de CORS Restritivo** | ⏳ A Validar | Garantir que apenas as origens oficiais tenham permissão de requisição para as APIs. |
| 10 | **IDs Imprevisíveis na URL (Anti-IDOR)** | ✅ Seguro | Barbearias e usuários utilizam UUID / CUID, impedindo enumeração sequencial. |
| 11 | **Validação de Webhook** | ✅ Seguro | Webhook consulta o status real diretamente na API oficial do Mercado Pago com token privado. |
| 12 | **Ocultar Stack Traces em Produção** | ⏳ A Validar | Tratar `try/catch` para não vazar logs de stack trace com caminhos internos de arquivos para o cliente. |
| 13 | **Auditoria de Dependências** | ⏳ A Fazer | Executar `npm audit` e manter bibliotecas críticas atualizadas. |
| 14 | **Validação de Uploads** | ✅ Seguro | UploadThing restringe tipos MIME válidos (imagens) e limites de tamanho em megabytes. |
