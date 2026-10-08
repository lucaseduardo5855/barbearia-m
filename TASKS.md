# 📋 Barbearia SaaS - Roadmap & Tarefas

---

## 9. Fluxo atual do produto e prÃ³ximos ajustes

### Estrutura definida

- [x] `/` abre o marketplace pÃºblico para clientes, sem exigir login.
- [x] `/landing` apresenta o BARBER-M para donos de barbearia.
- [x] `Encontrar barbearias` leva o cliente ao marketplace.
- [x] `Entrar` identifica o perfil e direciona cliente, dono ou barbeiro para o ambiente correto.
- [x] `Criar minha barbearia` inicia o onboarding e, ao finalizar, direciona para `/{slug}/admin`.
- [x] Marketplace com links visÃ­veis para `Entrar`, `Meus agendamentos` e `Para barbearias`.
- [x] Cliente percorre o agendamento sem login e autentica apenas na confirmaÃ§Ã£o (login por e-mail preserva a seleÃ§Ã£o).
- [x] Dias escolhidos no onboarding sÃ£o salvos e exibidos na pÃ¡gina pÃºblica da barbearia.

### Prioridade imediata

- [ ] Testar no navegador o fluxo completo do cliente: marketplace → perfil → serviÃ§o → profissional → horÃ¡rio → login → reserva.
- [ ] Testar o fluxo do dono: landing → onboarding → slug → pÃ¡gina pÃºblica → painel admin.
- [ ] Permitir configurar horÃ¡rio de abertura, fechamento e intervalo no onboarding.
- [ ] Fazer o agendamento respeitar os dias e horÃ¡rios configurados pela barbearia.
- [ ] Preservar o agendamento tambÃ©m ao usar Google/Facebook no login tardio.
- [ ] Validar convites de barbeiros e associaÃ§Ã£o do usuÃ¡rio Ã  agenda da barbearia.
- [ ] Revisar permissÃµes multi-tenant antes de publicar para outras barbearias.

### ExperiÃªncia e publicaÃ§Ã£o

- [ ] Adicionar estados de carregamento e erro no marketplace, perfil pÃºblico e agendamento.
- [ ] Confirmar layout mobile do marketplace e do checkout de agendamento.
- [ ] Criar dados de demonstraÃ§Ã£o controlados para apresentar o produto a novas barbearias.
- [ ] Preparar planos, trial e limites por barbearia antes da venda comercial.

## 10. OrganizaÃ§Ã£o do Git

- `main`: apenas versÃµes estÃ¡veis e demonstrÃ¡veis.
- `develop`: integraÃ§Ã£o das tarefas concluÃ­das antes de publicar.
- `feature/...`: uma tarefa por vez, por exemplo `feature/fluxo-marketplace`.
- Commits pequenos e descritivos, por exemplo:
  - `feat: adiciona entrada do marketplace`
  - `fix: preserva agendamento durante login`
  - `chore: ignora caches locais do Next`
- NÃ£o versionar `node_modules`, `.next-*`, `.env` ou metadados de ferramentas locais.

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




CATEGORIA DE PRODUTOS 
RELATORIO https://www.youtube.com/shorts/dgIurqrc7Uc 
https://www.reservio.com/pt-br/software-para-barbearia?utm_source=google&utm_medium=cpc&utm_campaign=dsa_pt_br&utm_term=HP&gad_source=2&gad_campaignid=16807494427&gclid=CjwKCAjw_eLVBhBEEiwAeaYZfLO4Hp7roTSurov2uONvSsKToSzmoxeV7RJutDdnhjm_b1hU5qH0zxoCUHoQAvD_BwE


## 💈 7. Gestão de Unidades, Agenda Interativa, Comanda e Financeiro (Concluído)

- [x] **Seleção & Configuração Rápida de Unidade (Setup Rápido)**
  - Seletor de unidade com status de atividade no topo da barra lateral (`admin-dashboard-client.tsx`).
  - Modal de Setup Rápido (`quick-setup-modal.tsx`):
    - **Logo em botões clicáveis**: Galeria com estilos prontos (Retrô, Clássico, Gold, Vintage, Moderno, Minimalista) e suporte a link customizado.
    - **Horários de Trabalho**: Configuração dia a dia (Seg a Dom) com atalho de 1 clique para replicar horário comercial.
    - **Catálogo Rápido de Serviços (Beleza/Barbearia)**: Botões clicáveis com Corte Social, Fade, Barba Toalha Quente, Pezinho, Escova, Sobrancelha na Navalha, Hidratação, Selagem e Combos.
- [x] **Aba de Agendamentos & Agenda Interativa (Fiel à `image-1.png`)**
  - **Menu Lateral**: Grupo `AGENDAMENTOS` dividido em **Agenda** e **Histórico**.
  - **Botões de Ação no Topo**:
    - 🔴 **Bloquear horário**: Modal para definir colaborador, dia, horário e motivo (ex: almoço, folga).
    - 🟡 **Nova venda de produtos**: Venda direta de produtos no balcão com atribuição de comissão ao barbeiro.
    - 🟡 **Novo agendamento**: Seleção de colaborador, serviço principal, tipo (`Padrão` ou `Encaixe`), data/hora e dados do cliente.
    - ⚙️ **+ Ações / Atualizar**: Navegação por datas com atalho "Hoje" e filtros de bloqueios e barbeiros.
  - **Grade Visual Timeline**: Linhas de horários (08:00 às 20:00) cruzadas com colunas de cada barbeiro.
  - **Comanda & Gestão do Atendimento**:
    - Adição de serviços extras durante o atendimento.
    - Adição de produtos vendidos no momento do atendimento.
    - Cálculo automático da comissão individual do colaborador para aquele atendimento.
    - Finalização de comanda com baixa automática e lembrete direto no WhatsApp.
- [x] **Sub-Aba de Histórico (`historico-tab.tsx`)**
  - Listagem dos agendamentos passados, cancelados e finalizados com busca por cliente, comanda e filtros de status.
- [x] **Aba Financeiro -> Dashboard (Fiel à `image-2.png`)**
  - **Gráfico Neon Suave**: *Total de receita bruta por dia* com curva consolidada do faturamento diário.
  - **Cards de Métricas Superiores**:
    - Total bruto de vendas no período (comandas finalizadas).
    - Total das comandas em aberto.
    - Total de clientes atendidos no mês e média por dia.
    - Previsão do total bruto de vendas no período.
  - **Seção "Saldo do período"**:
    - Card verde de Saldo Líquido (Recebimentos - Saídas).
    - Total de recebimentos no período.
    - Total de saídas e despesas operacionais no período.
  - **Seção "Valores a receber no período selecionado"**:
    - Vendas realizadas no período, lançamentos manuais, pacotes e total líquido a receber.
  - **Seção "Despesas pagas no período selecionado"**:
    - Comissões pagas aos colaboradores, despesas manuais (com modal para registrar novos lançamentos) e total de despesas.
  - **Histórico de Assinaturas SaaS**: Visualização dos comprovantes Pix Mercado Pago.
- [x] **Aba Relatórios -> Produtos e Serviços (Fiel à `image-3.png`)**
  - Título: *Detalhamento de vendas*.
  - Filtro por período de datas e botão **Exportar em Excel** (download de arquivo CSV formatado).
  - Cards de métricas: Total de vendas, Serviços, Total de comandas (com contagem de Aguardando, Finalizadas e Faltantes), Valor das comandas abertas, Descontos e Vendas de produtos.
  - Gráfico Donut de distribuição de faturamento por serviço/produto.
  - Tabela detalhada com descrição, volume total, clientes distintos, média de utilizações por cliente, status e total em vendas com % do faturamento.
- [x] **Aba Relatórios -> Comissões de Colaboradores (Fiel à `image-4.png`)**
  - Título: *Relatório de colaboradores*.
  - Botão **Dar baixa nas comissões** (modal para pagar comissão com quitação do saldo pendente).
  - Botão **Adicionar lançamento para o barbeiro** (modal para conceder vales/adiantamentos ou bônus).
  - Botão **Exportar em Excel**.
  - 10 Cards consolidados de métricas: Vendas Total, Vendas serviços, Comissões pagas, Comissões pendentes, Vendas finalizadas, Vendas produto, Comissões normais, Comissões total e Vales.
  - Gráfico Donut com detalhamento das comissões repassadas.
  - Tabela completa por colaborador com total em vendas, comissão de serviços, produtos, vales descontados, comissão pendente e botão de pagamento individual.
- [x] **Aba Cadastros -> Produtos e Estoque (`produtos-tab.tsx`)**
  - Gestão de produtos, preço de venda, custo, estoque e categorias para abastecimento das comandas.


---

## 🗺️ 8. Próximos Passos - Estrutura do Sistema & MVP Estilo Fresha

### 💈 Fluxo 1: Onboarding do Barbeiro (Dono do Estabelecimento)
- [ ] **Validação do Cadastro Inicial (`/admin/register`):**
  - O cadastro em 6 etapas já existe no projeto. Validar se ao finalizar o cadastro, a barbearia é salva com o `slug` correto no banco de dados e redireciona direto para `/[slug]/admin`.
  - Garantir que os serviços e horários informados no onboarding já fiquem disponíveis na página pública da barbearia (`/[slug]`).
- [ ] **Link de Acesso no Topo/Menu da Home:**
  - Adicionar botão **"Cadastrar minha barbearia"** no cabeçalho ou menu da página inicial para direcionar novos barbeiros para `/admin/register`.

---

### ✂️ Fluxo 2: Experiência do Cliente Final (Inspirado no Fresha)
- [ ] **Página Pública da Barbearia (`/[slug]` - Estilo Fresha):**
  - **Layout de 2 Colunas no Desktop:**
    - Coluna Esquerda: Catálogo completo de serviços (com nome, duração, descrição, preço e botão "Agendar").
    - Coluna Direita (Sticky Card): Foto da barbearia, nota, endereço, horários de funcionamento e botão de agendamento rápido.
  - No mobile, manter botão flutuante inferior para agendar direto.
- [ ] **Fluxo de Agendamento Sem Login Prévio (Zero Fricção):**
  - Permitir que o cliente passe por todas as etapas sem exigir login:
    1. Escolha do serviço.
    2. Escolha do profissional (ou primeiro disponível).
    3. Escolha da data e horário livre.
    4. Tela de revisão e resumo da reserva.
- [ ] **Login Tardio com Preservação de Dados:**
  - Na última etapa ("Confirmar agendamento"), se o cliente não estiver logado:
    - Salvar a seleção do agendamento temporariamente (no estado da aplicação / sessionStorage).
    - Abrir o modal de login (Google ou credenciais).
    - Após o login ser concluído com sucesso, disparar a criação do agendamento automaticamente, **sem o cliente ter que escolher tudo de novo**.
- [ ] **Confirmação e Redirecionamento:**
  - Redirecionar para `/[slug]/reservas` com o agendamento já confirmado em destaque.

---

### 🌐 Fluxo 3: Como os Dois Mundos se Conectam no Site
1. **Link da Barbearia (Bio do Instagram / WhatsApp):**
   - O barbeiro divulga diretamente seu link próprio: `site.com/barbearia-do-minhoca`.
   - O cliente entra direto na tela da barbearia dele (estilo Fresha), sem passar pela tela de busca ou outras barbearias concorrentes.
2. **Portal / Marketplace Principal (`site.com/`):**
   - Serve para novos clientes buscarem barbearias por cidade/geolocalização e para novos donos de barbearia conhecerem a plataforma e clicarem em "Cadastrar minha barbearia".
