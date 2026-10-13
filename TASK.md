# Registro da rodada de refinamento — painel administrativo

## Validado em 12/10/2026

- A conta de Lucas acessa o painel em `/barbearia-do-minhoca-g5kg/admin`.
- Uma reserva criada pelo fluxo público aparece na agenda do estabelecimento.
- Ao clicar no atendimento, a comanda abre. O fluxo reserva → agenda → comanda está funcional.
- Serviço extra recalcula o total da comanda corretamente.
- A conclusão da comanda registrou os valores no Financeiro.

## Correções funcionais concluídas

- A tela pública de "Meus agendamentos" agora classifica reservas pelo `status`; uma comanda `DONE` aparece imediatamente em "Finalizados", mesmo com data futura.
- Produtos agora possuem marca, preço de custo, preço de venda, estoque e alerta mínimo, além de edição posterior para reposição e correção.
- A comissão é editável por profissional na Equipe; atendimentos ainda não atribuídos não calculam uma comissão fictícia.
- A comanda passou a identificar reservas sem barbeiro como "Aguardando atribuição", em vez de "Geral".

## Padronização visual aplicada ao painel

### Referência BoardUI

- Usar a linguagem do BoardUI como referência para dashboards, tabelas, métricas e filtros: hierarquia limpa, números legíveis, bordas suaves e densidade operacional.
- Não instalar o CLI atual diretamente enquanto o projeto estiver em React 18 + Tailwind CSS 3; a versão documentada do BoardUI exige React 19 + Tailwind CSS 4. Adaptar os princípios aos componentes existentes para evitar uma migração arriscada no meio da refatoração.
- Remover aparência de neon dos indicadores financeiros e usar cor apenas para significado: entrada, saída, alerta e informação.
- Padronizar ícones em Lucide com o mesmo tamanho, espessura e recipiente.

### Tipografia

- Usar `Inter, ui-sans-serif, system-ui, sans-serif` como fonte padrão da interface.
- Reservar `Geist, "Geist Fallback", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif` para os textos que precisarem de tom editorial, nunca como padrão de formulário/painel.
- Reduzir pesos excessivos: títulos com hierarquia clara, números de métricas sem negrito pesado e textos auxiliares com contraste adequado.

### Design system

- Centralizar tokens de cor, espaçamento, raio, bordas, sombras, tamanhos tipográficos e estados de foco/hover.
- Padronizar cards, botões, inputs, selects, badges, modais e tabelas para evitar estilos repetidos ou inconsistentes.
- Usar cantos levemente arredondados, bordas discretas e os mesmos estados de interação em todo o admin.
- Corrigir a aparência atual de selects, campos da comanda e modal de novo agendamento para seguirem o padrão único.

### Agenda

- Aproveitar toda a largura útil do conteúdo e remover áreas vazias sem função.
- Aumentar legibilidade de horários, cabeçalhos de profissionais, cartões de agendamento e ações "Agendar".
- Ao clicar na data (ex.: `12/10/2026`), abrir um calendário para seleção direta.
- Manter filtros e ações com layout responsivo e sem apertar os controles.
- Melhorar a comanda: hierarquia, espaçamento, selects, botões, valores e estados de abertura/conclusão.

## Ordem aplicada nesta rodada

1. Auditoria dos componentes e estilos atuais.
2. Consolidação dos tokens e componentes-base compartilhados.
3. Padronização da Agenda e da Comanda.
4. Aplicação do mesmo padrão em Visão geral, Financeiro, Serviços, Produtos, Configurações e Equipe.
5. Validação estática, TypeScript, ESLint, Prisma e compilação de produção.

## Segunda rodada — retorno das telas reais

- Voltar ao catálogo na página pública, Inter/Geist carregadas e tema azul compartilhado.
- Modais herdam o tema da tela que os abriu e têm largura corrigida.
- Agenda sem limite de largura, calendário em português e visões de dia, semana e mês.
- Histórico com busca normalizada, ícone sem sobreposição, mês inicial, semana/intervalo e paginação.
- Financeiro refeito com cálculos compartilhados com a visão geral; extras separados no relatório; produtos da comanda sem contagem dupla.
- Gráficos sem proporções inventadas para valores zerados; dados financeiros sem neon.
- Estoque atualizado em transação e vendas sem estoque rejeitadas.
- Cadastro sem capa, serviços personalizados, horários por dia e aviso da conta que já possui uma unidade.
- Equipe opcional cadastrada como profissional; sem promessa de convite por e-mail que não é enviado.
- Catálogo com paginação, busca por nome/serviço/endereço, carregamento e faixa horizontal.
- Chrome em 1440px e 390px: fontes, tema dos modais, largura da agenda e ausência de transbordamento horizontal verificados.
- Testes de cálculos e cadastro em scripts/verify-financial-summary.cjs.
- Disponibilidade pública limitada à unidade e ao profissional; expediente respeitado, dias fechados bloqueados e profissional livre atribuído na opção de qualquer profissional.

## Rodada final — refatoração e novos pedidos

- Agenda/histórico sem título visual duplicado; barra operacional compacta, calendário mais alto e avatar com fallback.
- Financeiro com oito indicadores úteis, ticket médio/vales nas descrições, sem os totais duplicados do desenho antigo.
- Máscara BRL compartilhada nos formulários; produto/estoque/preço validado antes de consultar o banco.
- Menu desktop/mobile extraído, tipos de agendamento centralizados e ações do admin separadas por responsabilidade.
- Comissão com botão “Atualizar comissão”; ajuda limitada no alerta de estoque; confirmação de exclusão centralizada no componente de diálogo.
- Horários da configuração rápida com largura suficiente; cores azuis em vez de laranja.
- Ilustração de equipe de barbearia substitui o computador; fotos reais nas prévias da landing.
- Vídeo de referência inspecionado em três quadros; timeline ilustrativa reserva/agenda/caixa, pausável, com tratamento de movimento reduzido, hovers suaves e navegação por âncora com rolagem suave.
- Notificações com proteção de cron, consentimentos, deduplicação e painel de configuração. E-mail de demonstração autorizado aceito pelo Resend; WhatsApp testado com mock, sem disparos reais para clientes.
- Testes de regras, ESLint, TypeScript, build e capturas desktop/mobile executados; detalhes em docs/code-organization.md e docs/notifications.md.
