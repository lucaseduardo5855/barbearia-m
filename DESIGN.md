# Interface Barber-M

## Direção

Painel operacional em tema claro e escuro, com superfícies neutras, bordas discretas e azul para ações. Página pública e cadastro compartilham fontes e controles. Não usar roxo, halos ou valores financeiros em neon.

## Tipografia

- Títulos: Inter variável local, peso 500; fallback Inter, ui-sans-serif, system-ui, sans-serif.
- Texto, formulários, dados e botões: Geist variável local, peso 400; destaque 450; fallback Geist, "Geist Fallback", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif.
- Escala: título de página 24px, seção 18–20px, corpo 16px, controle 15px, metadado 13–14px. Agenda e histórico mantêm o título acessível, mas visualmente usam só o breadcrumb para priorizar os dados.
- Números financeiros usam algarismos tabulares. Não usar negrito pesado para compensar textos pequenos.

## Componentes

- Button, Calendar, DatePicker, Dialog e tema dos portals compartilhados em src/components/ui.
- Cards: fundo neutro, borda de 1px, raio de 12–16px, sem halo.
- Controles: altura mínima de 40px; campos de 44px; raio de 8px.
- Valores editáveis usam MoneyInput com máscara BRL e limite coerente com Decimal(10,2). A formatação de exibição fica em formatBRL.
- Ajuda contextual apenas em parâmetros e situações relevantes, como limite/alerta de estoque.
- Ícones Lucide: 16px nas ações, 20px nos cabeçalhos.
- Azul para ação; verde, âmbar e vermelho restritos aos estados.
- Tabelas e calendários largos rolam dentro do componente; o documento não transborda horizontalmente.

## Navegação e dados

- Página da barbearia retorna ao catálogo; agendamento retorna entre etapas.
- Agenda ocupa a largura disponível e oferece dia, semana e mês.
- Histórico inicia no mês atual, filtra períodos e mostra dez registros por página.
- Catálogo mostra até doze unidades por página, em grade ou faixa.
- Financeiro separa entradas, saídas, saldo e comandas abertas; saldo não é chamado de lucro.
- Produtos vinculados à comanda entram apenas uma vez no faturamento.
- Sem cálculo de taxas, não afirmar que os valores estão líquidos de taxas.

## Movimento

Hover e foco de 220–300ms, priorizando cor e borda. Respeitar prefers-reduced-motion. A landing mantém os efeitos demonstrativos sem transferir animações decorativas ao painel.

Na landing, hovers têm 450–500ms e seleção por intenção de 180ms; a cena reserva/agenda/caixa usa uma timeline pausável e suspensa fora da tela. A ilustração Storyset e a fotografia Unsplash têm origem/licença em public/illustrations/SOURCES.md.
