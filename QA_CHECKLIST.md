# BARBER-M — checklist de validação do MVP

Use este checklist antes de cada rodada de refatoração. Para cada falha, anote a URL, o que clicou, o resultado esperado, o resultado obtido e uma captura de tela.

## Fluxo A — cliente final

- [ ] Abrir `/` sem estar logado.
- [ ] Pesquisar ou escolher uma barbearia no marketplace.
- [ ] Abrir o perfil público da barbearia.
- [ ] Escolher um serviço.
- [ ] Escolher um profissional ou “qualquer profissional”.
- [ ] Escolher uma data futura.
- [ ] Confirmar se aparecem apenas horários livres.
- [ ] Escolher um horário.
- [ ] Chegar à revisão sem login antecipado.
- [ ] Fazer login na última etapa.
- [ ] Confirmar que serviço, profissional, data e horário continuam selecionados.
- [ ] Finalizar a reserva.
- [ ] Conferir a reserva em `/{slug}/reservas` ou `/bookings`.
- [ ] Conferir o mesmo agendamento no painel administrativo.

## Fluxo B — dono da barbearia

- [ ] Abrir `/landing`.
- [ ] Clicar em “Criar minha barbearia”.
- [ ] Entrar ou criar uma conta de dono.
- [ ] Preencher todas as etapas de `/admin/register`.
- [ ] Finalizar o cadastro.
- [ ] Confirmar o redirecionamento para `/{slug}/admin`.
- [ ] Confirmar nome, endereço, logo, banner e profissionais.
- [ ] Confirmar serviços e preços cadastrados.
- [ ] Abrir `/{slug}` e conferir os mesmos dados publicamente.
- [ ] Criar um agendamento pelo painel.
- [ ] Bloquear um horário e confirmar que ele deixa de aparecer ao cliente.
- [ ] Finalizar uma comanda e conferir o reflexo no financeiro.

## Fluxo C — permissões

- [ ] Cliente não acessa `/{slug}/admin`.
- [ ] Dono não altera recursos de outra barbearia trocando o slug ou ID.
- [ ] Barbeiro vê somente as áreas permitidas para seu papel.
- [ ] Usuário deslogado é redirecionado ao tentar abrir uma área protegida.

## Fluxo D — responsividade

Testar em aproximadamente 390 px, 768 px e 1440 px.

- [ ] Landing sem cortes ou rolagem horizontal.
- [ ] Marketplace com cards legíveis.
- [ ] Perfil público com CTA acessível.
- [ ] Agendamento utilizável com uma mão no celular.
- [ ] Painel com menu navegável e tabelas sem conteúdo inacessível.
- [ ] Modais cabem na tela e permitem rolagem interna.

## Modelo para registrar um problema

```text
URL:
Etapa:
Ação realizada:
Esperado:
Obtido:
Mensagem do terminal/console:
Captura de tela:
```

## Ordem da sessão de hoje

1. Validar Fluxo A.
2. Corrigir bloqueios encontrados no Fluxo A.
3. Validar Fluxo B.
4. Corrigir onboarding e sincronização com página pública.
5. Auditar permissões do Fluxo C.
6. Fazer uma rodada de responsividade do Fluxo D.
7. Só então separar arquivos grandes e remover duplicações por domínio.

