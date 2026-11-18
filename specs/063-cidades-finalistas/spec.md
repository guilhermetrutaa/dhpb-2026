# Spec: Cidades das equipes da final

| Campo | Valor |
|---|---|
| Slug | `063-cidades-finalistas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O admin precisa ver, na página da final, o ID de cada equipe finalista, o código INEP da escola e o município oficial, e quantas equipes da final cada município tem. Varreduras anteriores erraram porque a equipe não guarda cidade e o fallback `equipe.cidade` não é o censo.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `aprovadoAte`, `membro-index`, dashboard, nem a correção (`campusDaEquipe`). Não grava município na equipe. Não corrige as varreduras antigas.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Lista da final | Nome, escola, membros | Também ID, INEP (`escolaId`) e município |
| Origem da cidade | Não aparece | `escolaId` exato → `municipio` em `escolas-pb.json` |
| INEP ausente ou fora do JSON | — | `Sem município no censo`, com o ID. Sem usar `equipe.cidade` |
| Contagem | — | Uma equipe = um município. Mesma escola com duas equipes conta duas. `Sem município no censo` no fim |
| JSON indisponível | — | Finalistas continuam. Erro explícito. Sem chute de cidade |

## Firestore

**Leituras:** a query que a página já faz: `equipes` com `where('edicaoId')` e `where('aprovadoAte', '==', 'fase_final')`. Escolas: `fetch` de `/escolas-pb.json` (0 reads). Nenhuma query nova.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md` (campo `escolaId` em `equipes`)
4. `src/app/admin/final/page.jsx`
5. `public/escolas-pb.json` (formato `id` / `municipio`)
6. `src/lib/correcao.js` (`campusDaEquipe` — não reutilizar)

## Critérios de aceite

- [x] Cada finalista mostra ID, INEP e município oficial
- [x] Resumo `Município — N`, maior primeiro, empate por nome, sem censo no fim
- [x] Equipe sem `escolaId` ou INEP fora do JSON não herda `equipe.cidade`
- [x] Falha do JSON não inventa cidade
- [x] Cota Spark: nenhuma query nova sem filtro
- [x] `npm run build` código 0
- [x] Docs: sem mudança de rota ou schema

## Princípios da constitution aplicáveis

Free Tier (query já filtrada; escolas no JSON estático); escopo cirúrgico; SDD.
