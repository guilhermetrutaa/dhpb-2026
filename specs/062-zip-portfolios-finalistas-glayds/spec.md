# Spec: ZIP dos portfólios finalistas (Glayds)

| Campo | Valor |
|---|---|
| Slug | `062-zip-portfolios-finalistas-glayds` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Glayds precisa baixar de uma vez os PDFs de todas as equipes classificadas para a final, mesmo as que ela não corrigiu. Um ZIP no navegador evita abrir equipe por equipe.

## Atores

- [ ] Estudante
- [x] Professor (`documentoStatus`) — só a corretora `glayds`
- [ ] Admin principal
- [ ] Atendente

## Escopo negativo

Não altera distribuição, veredito, nota, fila dos outros corretores, `PortfolioWall`, `aprovadoAte` nem admin/final. Não muda quem é finalista.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| PDF | Um portfólio por vez, só da fila do corretor | Glayds vê botão em destaque e baixa ZIP de todos com `aprovadoAte === 'fase_final'` |
| Quem vê | — | Só `corretor.id === 'glayds'` |

## Firestore

**Leituras:** 1 `getDocs` em `equipes` com `where('aprovadoAte','==','fase_final')` + `limit(500)`, só no clique do botão (Glayds). Portfolio vem do mapa `respostas` já no doc — sem query extra por equipe.

**Writes:** nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/correcao/page.jsx`
4. `src/app/tarefas/portfolio-artistico/portfolioPdf.jsx`
5. `src/app/admin/final/page.jsx`

## Critérios de aceite

- [x] Botão em destaque só para Glayds
- [x] ZIP com PDF de cada finalista (`aprovadoAte === 'fase_final'`), independente da fila dela
- [x] Progresso visível durante a geração
- [x] Sem write; 1 query filtrada + limit no clique
- [x] `npm run build` código 0

## Princípios da constitution aplicáveis

Scan admin justificado na spec (export pontual, filtrado, limit 500). Diff mínimo. Dependência `jszip` só para o compactado pedido.
