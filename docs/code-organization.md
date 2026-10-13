# Organização do código

As rotas continuam no App Router. Mudanças desta rodada preservam os contratos existentes e o visual aprovado.

- `src/components/ui`: controles canônicos, tema dos portais, calendário, máscara monetária e ajuda contextual.
- `src/app/_components/ui/input.tsx` e `button.tsx`: reexports de compatibilidade. Não criar outra implementação nesses caminhos.
- `src/lib`: regras puras e testáveis de dinheiro, cadastro, expediente, cálculo financeiro, detalhamento de vendas e planejamento de notificações.
- `src/app/_actions/admin`: ações agrupadas em `bookings`, `catalog`, `inventory` e `finance`; `ownership` concentra a verificação do proprietário. O arquivo `admin-actions.ts` preserva a entrada pública sem duplicar implementação.
- `admin-navigation.tsx`: uma definição para os menus desktop/mobile, rótulos e acesso por perfil.
- `booking-types.ts`: contrato mínimo de dados do cliente enviado ao painel. Não enviar senha ou tokens ao navegador.
- Componentes da landing e animações são isolados dos painéis operacionais. A landing é carregada separadamente na rota inicial.

## Validação

```text
node scripts/verify-financial-summary.cjs
node scripts/verify-money.cjs
node scripts/verify-notifications.cjs
node scripts/verify-notification-provider.cjs
npm run lint
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

`verify-ui.cjs` usa Chrome isolado, uma sessão local temporária e apenas navegação/leitura de telas; não confirma formulários, envia mensagens ou exclui registros. Capturas ficam em `.next-verify`, ignorado pelo Git.

## Commits

Separar fundação visual/controles, operações do admin/cliente e cadastro, notificações, e landing/marketplace. Usar mensagens convencionais que indiquem o resultado. Não incluir `.env`, capturas, arquivos locais de agentes ou alterações não relacionadas do usuário. Não fazer push ou reescrever histórico como parte da refatoração.

O hook Git local existente referencia `commit-msg-linter`, ausente em `node_modules`, e imprime um aviso sem impedir os commits. A configuração local do hook foi preservada; as mensagens desta rodada seguem o formato convencional.

## Limites conhecidos

- BoardUI completo exige uma migração separada de React 18/Tailwind 3 para React 19/Tailwind 4. A integração atual usa os componentes compatíveis do projeto.
- A paginação do histórico é visual; a rota admin ainda carrega os registros da unidade. Paginação e agregações no servidor são a próxima etapa para unidades com volumes muito grandes.
- Mensagens automáticas dependem da configuração documentada em `notifications.md`; aceitação pelo provedor não significa confirmação de entrega.
