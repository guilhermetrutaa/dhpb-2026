# Spec: Sistema de pontuação e eliminação por fases (4º DHPB)

| Campo | Valor |
|---|---|
| Slug | `011-sistema-pontuacao-eliminacao-fases` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O 4º DHPB passa a usar pesos 1, 2, 4, 8 e 16 (`Di = Ni × peso`, `Df` máximo 3100) e um funil de eliminação por nota mínima (Fases 1–2) e por vagas com ampla concorrência + reserva de rede pública (Fases 3–5). O ranking admin deixa de aprovar por quatro cotas (médio/fundamental × rede) e passa a gerar preview antes de gravar `aprovadoAte`. O regulamento publicado e o conhecimento do chat devem refletir as mesmas regras.

## Atores

- [x] Estudante (textos do regulamento; sala continua lendo `aprovadoAte`)
- [x] Professor (`documentoStatus`)
- [x] Admin principal
- [x] Atendente (`SUPPORT_ADMIN_EMAILS`) — via knowledge do bot

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, medalhas, certificados, isolamento do chat. Não cria ranking público para participante. Não recalcula `df` histórico. Não adiciona enforcement de `aprovadoAte` em `/questao` ou `/resumo-fase` (drift já conhecido). Não redesenha a sala de equipe.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| `Di` na entrega | `(Ni / notaMaxima) * peso` | `Di = Ni × peso` (`notaMaxima` = teto da nota bruta, não divisor) |
| Pesos das fases | Livres no dashboard | Oficiais 1, 2, 4, 8, 16; hint no dashboard; `notaMaxima` 100 |
| Alternativas (texto oficial) | Regulamento: 0, 1, 4, 5 | 0, 2,00, 8,00, 10,00 (cadastro no admin; sem hardcode em `questao`) |
| Ordenação do ranking | Só `df` | `Df`, desempate N3 → N2 → N1 (nota bruta) |
| Aprovação admin | 4 cotas; `di` da fase de origem; sem preview | Transição escolhida; preview; confirmação grava `aprovadoAte` |
| F1 → F2 | Cota + `di` da fase 1 | `N1 ≥ 25,00`; sem teto de vagas |
| F2 → F3 | Cota + `di` da fase 2 | `N2 ≥ 50,00`; sem teto de vagas |
| F3 → F4 | Cota + `di` da fase 3 | Até 125 AC + 125 VR pública pelo `Df` acumulado |
| F4 → F5 | Cota + `di` da fase 4 | Até 120; 60 primeiras do geral; completa mínimo 60 públicas; resto na ordem geral |
| Empate na linha de corte | Não tratado | Todas com a mesma chave avançam juntas |
| Exibição | `toFixed(1)` | Duas casas decimais |
| Regulamento 5.4–5.6, 5.14, 5.19 | Pesos 1–5; itens 0/1/4/5 | Alinhado aos PDFs oficiais |

## Firestore

**Leituras:** ranking admin já faz `getDocs(query(collection(db, 'equipes'), where('edicaoId', '==', edId)))` e fases da edição. Preview e confirmação usam essa carga em memória. Path do participante: zero full scan. Escolas: só `public/escolas-pb.json`.

**Writes:** entrega continua `runTransaction` + `increment` em `ni` / `di` / `df` e dual-write (`pontuacoes` subcoleção + mapa em `equipes`). Aprovação: `writeBatch` só em `aprovadoAte` das equipes do preview marcadas para aprovar; não rebaixa quem já está no destino ou além; perdedores não são escritos. `membro-index`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/BUSINESS_RULES.md`
4. `src/app/questao/page.jsx`
5. `src/app/admin/ranking/page.jsx`
6. `src/app/regulamento/page.jsx`

## Critérios de aceite

- [x] Entrega de questão: `deltaDi = delta * peso` da fase; transação e dual-write intactos; `entregue` imutável
- [x] Ranking: preview por transição (F1→2, F2→3, F3→4, F4→5) com parâmetros editáveis (25 / 50 / 125+125 / 120 e piso 60)
- [x] F3→F4 e F4→5 ordenam por `Df` acumulado e desempate N3, N2, N1; VR não preenche com particular
- [x] Confirmar grava só `aprovadoAte` das aprovadas novas; não rebaixa
- [x] Tabela admin mostra Ni/Di/Df com duas casas
- [x] `/regulamento` 5.4–5.6, 5.14, 5.19 e knowledge do suporte com os mesmos números
- [x] Dashboard: hint de pesos 1/2/4/8/16 e nota máxima 100
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs `BUSINESS_RULES.md` e `DATABASE.md` com `Di = Ni × peso`

## Princípios da constitution aplicáveis

Free Tier (scan admin já existente; participante só transação da entrega); atomicidade (`runTransaction` / `increment`); dual-write legado preservado; SDD (aprovação humana desta spec); escopo cirúrgico; isolamento Firebase (só principal); `'use client'` + `<Suspense>` no ranking.
