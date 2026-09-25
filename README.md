# 💈 Barber-M

Barber-M é um sistema moderno de agendamentos online para barbearias, construído com foco em alta performance, usabilidade premium e pagamentos de mensalidade via Pix.

O sistema permite que clientes encontrem barbearias, visualizem serviços e preços e agendem horários com verificação de disponibilidade em tempo real. Os cortes são pagos presencialmente; a mensalidade da plataforma é cobrada por Pix via Mercado Pago.

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
- **Pagamento de mensalidade via Pix (Mercado Pago)**:
  - QR Code dinâmico e código Pix copia-e-cola.
  - Liberação automática da assinatura após a confirmação do pagamento.
  - **Webhook Seguro**: confere o status diretamente na API do Mercado Pago e registra o histórico financeiro.

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

# Mercado Pago (mensalidade Pix)
MERCADO_PAGO_ACCESS_TOKEN="seu_access_token_privado"
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="sua_chave_publica"

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

### 4. Testar o webhook do Mercado Pago (opcional)
Para receber notificações durante o desenvolvimento local, exponha `http://localhost:3000/api/webhooks/mercadopago` com um túnel HTTPS (por exemplo, ngrok) e cadastre a URL gerada nas configurações de Webhooks do Mercado Pago.

---

## 📄 Licença

Este projeto é desenvolvido para fins de estudo e portfólio. Sinta-se livre para clonar e brincar!
