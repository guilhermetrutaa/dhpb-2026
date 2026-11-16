# Spec: Remover simulação local da correção

| Campo | Valor |
|---|---|
| Slug | `061-remover-simulacao-correcao` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

Em localhost a página `/correcao` pulava o login e usava dados fictícios (`SIMULAÇÃO LOCAL`). Isso atrapalha testar a banca de verdade. A página passa a usar sempre Firebase, como em produção.

## Atores

- [ ] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente

## Escopo negativo

Não altera distribuição, veredito, rubrica, PDF, `PortfolioWall` nem Firestore. Só tira o bypass de localhost.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Localhost | Mock + banner "SIMULAÇÃO LOCAL" | Login Firebase e dados reais |
| Arquivo `mock.js` | Importado em `/correcao` | Removido |

## Firestore

Nenhuma leitura nem escrita nova. Localhost deixa de evitar as queries já existentes.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `src/app/correcao/page.jsx`
3. `src/app/correcao/mock.js`

## Critérios de aceite

- [x] Sem banner "SIMULAÇÃO LOCAL"
- [x] Sem `mock.js`
- [x] `/correcao` em localhost exige login de corretor
- [x] Cota Spark: nenhuma query nova
- [x] `npm run build` código 0

## Princípios da constitution aplicáveis

Diff mínimo. Free Tier inalterado no path de produção.
