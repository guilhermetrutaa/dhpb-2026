# Spec: Copiar resumo de equipes inscritas completas

| Campo | Valor |
|---|---|
| Slug | `013-admin-copia-resumo-completas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Os seis botões WhatsApp da aba Equipes (escolas por rede, cidades, incompletas, Glayds) misturam totais de todas as equipes com o campo `isCompleta`, que pode estar desatualizado. O admin precisa de um único resumo copiável só das equipes inscritas com os quatro slots de membros, e o topo da aba deve usar a mesma regra.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, escritas em `membro-index`, `aprovadoAte`, chat. Não recalcula nem grava `isCompleta`. Não consulta `membro-index`. Não abre WhatsApp. Ferramentas de manutenção da aba permanecem.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Badge “completas” no topo | `getCountFromServer(where('isCompleta','==',true))` | Count no scan: `membros[0]`…`[3]` truthy |
| Públicas / M / E / F / privadas no topo | Counts de **todas** as equipes | Só equipes com os quatro slots |
| Botões WhatsApp | Seis botões `wa.me` (municipais, estaduais, federais, cidades, incompletas, Glayds) | Removidos |
| Resumo para colar | Não existe (só WhatsApp) | Um botão copia totais das completas |

## Firestore

**Leituras:** no mount de `TabEquipes`, um `getDocsFromServer(collection(db, 'equipes'))` só admin (scan justificado: `isCompleta` não é confiável e slots do array não são queryáveis). Mantém `getCountFromServer` do total + lista `limit(50)` + `edicoes`. Clique do botão reusa o snapshot; cidades via `/escolas-pb.json` (0 reads). Path de aluno/prova: zero full scan. `membro-index`: zero.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/app/admin/dashboard/page.jsx`
5. `specs/009-admin-glayds-quatro-membros/spec.md`

## Critérios de aceite

- [x] Completa = `membros[0]` e `[1]` e `[2]` e `[3]` truthy (array ou mapa); não usar `isCompleta` no topo nem no resumo
- [x] Topo: públicas, M/E/F, privadas e completas contam só equipes com os quatro slots; “N exibida(s) · M no servidor” continua da lista/total bruto
- [x] Seis botões WhatsApp e handlers `wa.me` removidos
- [x] Um botão copia: total completas; públicas (municipal + estadual + federal, + `publica` genérica se houver); privadas; fundamental (`fundamental`\|`eja_fundamental`); médio (`medio`\|`eja_medio`); cidades únicas (`escolaId` → `escolas-pb.json`); professores orientadores únicos (`uid`, senão e-mail lowercase, `papel === 'professor_orientador'`)
- [x] Clipboard: `writeText`; sucesso com alert; falha mostra o texto para copiar
- [x] Sem query em `membro-index`; sem write em `isCompleta`
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (scan só admin no mount da aba, spec justifica); dataset estático de escolas; isolamento Firebase (só principal); escopo cirúrgico; SDD; `membro-index` não é lido nem reescrito.
