# BARBER-M

Sistema de gestão e agendamento para barbearias. O BARBER-M reúne a agenda da equipe, página pública de reservas, serviços, produtos, estoque, caixa, comissões e relatórios em uma única operação.

## O que o produto entrega

- Agenda por profissional com horários, encaixes, bloqueios e filtros de status.
- Página pública para o cliente escolher serviço, profissional e horário.
- Catálogo de serviços e produtos, controle de estoque e alerta de mínimo.
- Financeiro, caixa diário, comissões, despesas e histórico de atendimentos.
- Lembretes por e-mail e WhatsApp quando configurados e autorizados pelo cliente.
- Teste grátis de 7 dias. Após o teste, o acesso ao painel custa **R$ 49,90/mês** via Pix.

## Telas que valem aparecer no GitHub

Para o README e a página do repositório, as melhores imagens são:

1. **Agenda da equipe** — mostra o valor principal do sistema: horários e profissionais no mesmo lugar.
2. **Visão financeira** — mostra caixa, receita, despesas e comissões; é a melhor imagem para explicar o lado de gestão.
3. **Serviços e produtos** — mostra o catálogo junto do estoque, útil para explicar vendas no balcão.
4. **Página pública de agendamento** — mostra a experiência do cliente e deixa claro que existe marketplace/reserva online.

As telas da landing usam dados ilustrativos. Nunca publique no repositório capturas com dados reais de clientes, telefones, e-mails, QR Codes Pix ou tokens.

## Tecnologias

- Next.js 14 e React 18
- TypeScript e Tailwind CSS
- Prisma ORM e PostgreSQL
- NextAuth para autenticação
- Mercado Pago Pix para mensalidade
- Resend e WhatsApp Cloud API para comunicações opcionais

## Rodando localmente

```bash
git clone https://github.com/lucaseduardo5855/barbearia-m.git
cd barbearia-m
npm install
```

Crie `.env` a partir das variáveis abaixo:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
MERCADO_PAGO_ACCESS_TOKEN="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Depois gere o Prisma e inicie o projeto:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Pagamento e período de teste

Ao concluir o cadastro de uma barbearia, o sistema cria um teste de 7 dias. Sem a assinatura após esse período, o painel administrativo fica pausado até o pagamento; os dados cadastrados permanecem guardados. A assinatura é de R$ 49,90 por 30 dias e é liberada após a confirmação do Pix pelo webhook do Mercado Pago.

## Qualidade

```bash
npm run lint
npm run build
node scripts/verify-money.cjs
node scripts/verify-financial-summary.cjs
node scripts/verify-notifications.cjs
```

## Licença

Projeto para estudo e portfólio. Consulte os créditos das ilustrações em `public/illustrations/SOURCES.md`.
