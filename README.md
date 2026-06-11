# 💈 Barber-M

Barber-M é um sistema moderno de agendamentos online para barbearias, construído com foco em alta performance, usabilidade premium e fluxos completos de pagamento integrados.

O sistema permite que clientes encontrem barbearias, visualizem serviços e preços, agendem horários de forma inteligente com verificação de disponibilidade em tempo real e realizem pagamentos online via cartão de crédito ou optem por pagar no local.

---

## 🚀 Funcionalidades Principais

- **Visualização de Barbearias**: Pesquisa e listagem dinâmica de barbearias, seus endereços, fotos, descrições e contatos.
- **Painel de Agendamentos**:
  - Exibição organizada de agendamentos **Confirmados**.
  - Seção inteligente e colapsável para agendamentos **Finalizados** (com botão interativo de expandir/ocultar para evitar listas muito longas).
- **Agendamento Inteligente**:
  - Seleção dinâmica de data e horários disponíveis.
  - Prevenção de conflito de horários (bloqueando horários já reservados por outros usuários no banco de dados).
- **Autenticação Segura**: Login social completo usando NextAuth.js (com suporte ao Google).
- **Integração com Stripe**:
  - Possibilidade de agendamento gratuito com pagamento no local ou pagamento online por cartão de crédito.
  - Redirecionamento automático e seguro para a página de checkout do Stripe.
  - **Webhook Seguro**: Atualização automática do status do agendamento (`Confirmado`) e pagamento (`Pago`) assim que a transação é processada no Stripe.

---

## 🛠️ Tecnologias Utilizadas

- **Core**: [Next.js 14](https://nextjs.org/) (App Router) & [React 18](https://react.dev/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) (Componentes acessíveis com Radix)
- **Banco de Dados & ORM**: [Prisma ORM](https://www.prisma.io/) & [PostgreSQL](https://www.postgresql.org/) (Neon DB)
- **Autenticação**: [NextAuth.js](https://next-auth.js.org/)
- **Pagamentos**: [Stripe SDK](https://stripe.com/) & Stripe Webhooks
- **Datas**: [date-fns](https://date-fns.org/)
- **Ferramentas de Qualidade**: Prettier, ESLint, Git Hooks com Husky

---

## ⚙️ Variáveis de Ambiente (`.env`)

Crie um arquivo `.env` na raiz do seu projeto contendo as seguintes variáveis:

```env
# Conexão com o Banco de Dados (Direct URL para migrações no Neon DB)
DATABASE_URL="sua_string_de_conexao_pooler_postgres"
DIRECT_URL="sua_string_de_conexao_direta_postgres"

# NextAuth Configuração
NEXTAUTH_SECRET="seu_segredo_para_gerar_tokens"
NEXTAUTH_URL="http://localhost:3000"

# Credenciais de Login Social (Google Cloud Console)
GOOGLE_CLIENT_ID="seu_google_client_id"
GOOGLE_CLIENT_SECRET="seu_google_client_secret"

# Stripe Configurações
STRIPE_SECRET_KEY="sua_chave_secreta_do_stripe"
STRIPE_WEBHOOK_SECRET="seu_segredo_de_webhook_do_stripe"

# URL Base da Aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 💻 Como Iniciar o Projeto Localmente

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/lucaseduardo5855/barbearia-m.git
cd barbearia-m
npm install
```

### 2. Configurar o Banco de Dados (Prisma)
Gere o cliente do Prisma e rode as migrações para criar as tabelas no seu PostgreSQL:
```bash
npx prisma generate
npx prisma migrate dev
```

*(Opcional)* Se quiser popular seu banco de dados com barbearias e serviços fictícios para teste, rode o seed:
```bash
npx prisma db seed
```

### 3. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### 4. Rodar o Stripe Webhook Localmente (Para testar pagamentos)
Instale a [Stripe CLI](https://stripe.com/docs/stripe-cli) e execute o comando abaixo para encaminhar os eventos do Stripe para a sua API local:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copie a chave de webhook gerada no terminal (`whsec_...`) e salve-a na variável `STRIPE_WEBHOOK_SECRET` no seu arquivo `.env`.

---

## 📄 Licença

Este projeto é desenvolvido para fins de estudo e portfólio. Sinta-se livre para clonar e brincar!
