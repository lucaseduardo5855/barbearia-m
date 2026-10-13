# Mensagens e lembretes

As automações ficam desativadas até o proprietário ativar cada canal em **Mensagens e lembretes**. Reservas antigas não recebem mensagens automaticamente: os consentimentos novos começam desativados. O cliente autoriza cada tipo na confirmação da reserva e pode revogar todas as autorizações em `/notifications`.

- Lembrete: primeira execução dentro das 24 horas anteriores ao atendimento confirmado.
- Avaliação: no dia seguinte à conclusão, com consentimento para avaliação/retorno.
- Retorno: 30 dias após a conclusão por padrão (7–180 dias), somente para a última visita e sem outra reserva futura.
- Uma chave única por reserva, data, tipo e canal impede duplicação por concorrência ou repetição do cron. Falhas e solicitações em processamento não são reenviadas cegamente: o provedor pode ter aceitado antes de uma falha de rede. Verifique o painel do provedor antes de qualquer recuperação manual.
- `ACCEPTED` significa aceitação pelo provedor, não entrega ou leitura. Confirmação de entrega via webhook é uma etapa futura.

## Configuração do servidor

Defina as variáveis no ambiente de implantação; não coloque segredos no código ou em variáveis `NEXT_PUBLIC_*`:

```dotenv
NEXTAUTH_URL=https://seu-dominio.com
RESEND_API_KEY=...
EMAIL_FROM=Barber-M <agenda@seu-dominio-verificado.com>
CRON_SECRET=uma-chave-aleatoria-longa
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_API_VERSION=versao-suportada-pela-sua-conta
WHATSAPP_REMINDER_TEMPLATE=lembrete_atendimento
WHATSAPP_REVIEW_TEMPLATE=avaliacao_atendimento
WHATSAPP_RETURN_TEMPLATE=convite_retorno
```

O remetente deve pertencer a um domínio verificado no Resend. `onboarding@resend.dev` é usado apenas pelo script de teste, nunca pelos disparos de clientes.

O WhatsApp usa a Cloud API oficial e templates aprovados em `pt_BR`. Cada template precisa de quatro variáveis no corpo, nesta ordem: **nome do cliente, nome da barbearia, detalhe, URL de preferências**. No lembrete, detalhe é serviço/data/hora; nos outros, é a URL do perfil. O template de retorno deve ser aprovado na categoria apropriada a convite promocional. Os templates precisam explicar como parar as mensagens usando o link de preferências. A criação/aprovação dos templates e a conexão da conta Meta não são feitas pelo código.

Exemplos de corpos para cadastrar na Meta (confira a categoria na aprovação):

- Lembrete: `Olá, {{1}}! Seu atendimento na {{2}}: {{3}}. Para ajustar sua reserva, acesse o aplicativo. Preferências de mensagens: {{4}}.`
- Avaliação: `Olá, {{1}}! Como foi seu atendimento na {{2}}? Responda a esta mensagem com sua opinião. Perfil da barbearia: {{3}}. Preferências de mensagens: {{4}}.`
- Retorno: `Olá, {{1}}! Quando quiser renovar o corte na {{2}}, confira os horários em {{3}}. Para parar os convites, altere suas preferências em {{4}}.`

`vercel.json` agenda `/api/cron/reminders` a cada hora. Confirme se o plano da hospedagem suporta essa frequência. Outro agendador pode chamar a mesma rota com `Authorization: Bearer <CRON_SECRET>`. Sem chave, a rota retorna 503; com chave incorreta, 401.

Para simulação, chame a rota autenticada com `?dryRun=true`; ela não registra nem envia mensagens. Nunca execute o cron de produção só para testar um destinatário.

## Testes seguros

`node scripts/verify-notifications.cjs` valida horários, consentimentos, exclusões, retorno e formato de telefone sem enviar mensagens.

`node scripts/test-notification.cjs --email seu-email` simula o teste. Acrescente `--send` somente com autorização do destinatário. O script não lê clientes nem reservas e usa idempotência diária.

No estado local atual faltam `EMAIL_FROM`, `CRON_SECRET` e as credenciais/templates do WhatsApp. O e-mail de demonstração ao endereço autorizado foi aceito pelo Resend. Não houve disparo para clientes nem envio automático no WhatsApp.

Referências: [Resend: enviar e-mail](https://resend.com/docs/api-reference/emails/send-email), [Meta: WhatsApp Cloud API](https://www.postman.com/meta/whatsapp-business-platform/overview).
