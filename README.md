# Firmina

Protótipo mobile para divulgar o trabalho de empreendedoras de São Luís e aproximá-las de compradores e empresas parceiras.

## Executar

```sh
npm install
npm run android
```

O Android deve ter o Expo Go ou uma development build compatível. A primeira execução requer instalar as dependências.

## Acessos de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Pessoa compradora | `compradora@firmina.app` | `firmina123` |
| Empresa IEMA | `IEMA@firmina.app` | `firmina123` |
| Empreendedora | `empreendedora@firmina.app` | `firmina123` |
| Equipe SEMMU | `semmu@firmina.app` | `firmina123` |

Também é possível tocar em uma conta na tela inicial para entrar. Usuários sem login veem apenas entrada, cadastro de pessoa e recuperação de acesso. O catálogo, eventos, parcerias, chat e administração exigem sessão autenticada.

Para validar uma vendedora no perfil administrativo, use `DEMO-024`, `DEMO-018` ou `DEMO-031`. Produtos, eventos, contas criadas e mensagens são salvos localmente no dispositivo.

O navegador e o Expo Go mantêm dados locais separados. Excluir uma conta de demonstração oculta seu acesso somente naquele dispositivo. Se ela não aparecer no login, use **Restaurar conta da compradora** (ou o botão correspondente ao perfil removido). Isso restaura apenas o acesso predefinido, sem apagar os demais dados nem recuperar conversas excluídas. Se já estiver em outro perfil, use **Perfil → Sair da conta** para voltar ao login.

## Limites do protótipo

Autenticação, chat e avisos são locais e demonstrativos; não há API ou envio de notificações push. O mapa apresenta contagens fictícias por bairro. Não use dados reais de atendimento ou elegibilidade.

## Vitrine e consultas

A vitrine e os detalhes continuam em [app/index.tsx](./app/index.tsx). As regras de seleção, copy, unidades e retirada ficam em [lib/catalog.ts](./lib/catalog.ts). Os produtos iniciais são demonstrações: continuam com os mesmos nomes, autoras, preços e avaliações, identificados como demonstração e sem encomenda. Nenhuma oferta sugerida foi cadastrada.

A intenção pessoal/evento e os filtros compartilham o mesmo catálogo. Data e participantes permanecem na sessão ao navegar e seguem para o rascunho editável do chat. Abrir detalhes ou conversa não envia mensagem nem cria pedido. Rascunhos são mantidos por conversa durante a sessão e limpos ao sair da conta. O chat ainda só persiste mensagens neste dispositivo.

### Dados comerciais pendentes

O cadastro existente ganhou somente a categoria obrigatória. Os campos opcionais abaixo são lidos do produto persistido, sem valores padrão inventados; sua coleta/validação pelas empreendedoras e integração ao cadastro dependem de uma etapa posterior:

- Unidade de venda (`saleUnit`), rendimento em pessoas/fatias (`serves`/`slices`), composição, sabores, modelos, medidas, comprimento, fotos adicionais com legenda, retirada, disponibilidade, prazo concreto e entrega.
- Oferta para grupos (`eventOffer`: cakes, trays, kits, lunches ou souvenirs). Artesanato para eventos exige venda por lote e `unitsPerSale` confirmado. Produtos demonstrativos não entram nesse caminho.
- `minimumOrder`, `orderMultiple` e `capacity` são expressos em unidades de venda, não em participantes. O total é uma estimativa para consulta, calculada apenas com preço e unidade/rendimento definidos, respeitando mínimos e múltiplos. `priceOnRequest` ou capacidade insuficiente exige orçamento.
- Feiras precisam de `id`, `startsAt` futuro em ISO com fuso, `participantEmails` e `pickups` com produto, e-mail da vendedora e confirmação. Datas antigas sem ano não habilitam retirada. O vínculo é conferido novamente ao abrir a consulta.
- Rita e Lúcia não têm contas ativas no chat atual. Não há fotos adicionais, unidade do bolo/colar, produção em lote ou retirada em feira confirmadas nos dados iniciais.

### Acompanhamento comercial

Meta: aproximadamente 50% do valor vendido no mês por categoria, revisado semanalmente, sem bloquear vendas, ocultar ofertas ou aplicar descontos. A medição futura deve separar visualizações de produto, orçamentos efetivamente enviados, compras concluídas e valor vendido. Pedidos mistos devem atribuir o valor de cada item à respectiva categoria.

Este repositório não possui infraestrutura de analytics, pedidos ou confirmação de venda no chat. Portanto, nenhum contador, venda ou orçamento enviado foi simulado. A medição e a confirmação de transações dependem desses serviços; abrir conversa não é orçamento enviado, e orçamento não é venda.

### Verificações da vitrine

Além de TypeScript e da exportação web existentes, os testes de regras podem ser executados com Node com suporte nativo a TypeScript (22.18 ou posterior):

```sh
node --test lib/catalog.test.mjs
npx tsc --noEmit
npm run build:web
```

As fixtures do teste existem apenas em memória e nunca alimentam o catálogo do aplicativo.
