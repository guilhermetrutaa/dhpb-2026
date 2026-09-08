# Spec: Relação de cidades no dashboard admin (WhatsApp)

| Campo | Valor |
|---|---|
| Slug | `002-admin-share-cidades` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Admins precisam, ~1 vez por semana, enviar ao WhatsApp a relação de municípios com equipe e quantas equipes cada município tem (reuniões e conteúdo de Instagram). Os botões atuais só cobrem totais e listas de escolas por rede.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, `membro-index`, `aprovadoAte`, chat de suporte. Não adiciona totais por modalidade, distritos/bairros, filtro por edição, nem lista na tela. Os 4 botões WhatsApp existentes permanecem iguais.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Relatório geográfico | Não existe | Botão “Lista de Cidades” na aba Equipes |
| Origem da cidade | Equipe tem `escola`/`escolaId`; município só no JSON | Join `escolaId` → `municipio` em `escolas-pb.json` |
| Mensagem | — | `Cidade - N equipes`, maior primeiro; `Sem município` no fim |
| WhatsApp longo | — | Se URL > ~1800 chars: clipboard + resumo no wa.me |

## Firestore

**Leituras:** no clique, `getDocsFromServer(collection(db, 'equipes'))` só no admin (scan justificado: ~1×/semana). Join local via `/escolas-pb.json` (0 reads Firestore). Path de aluno/prova: zero full scan.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/app/admin/dashboard/page.jsx`
5. `public/escolas-pb.json` (formato `id` / `municipio`)

## Critérios de aceite

- [x] Botão na aba Equipes abre WhatsApp com lista `Município - N equipes` (desc por quantidade)
- [x] Equipe sem `escolaId` ou ID fora do JSON aparece como `Sem município`
- [x] URL longa: texto completo no clipboard + resumo no wa.me
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs: sem mudança de rota ou schema

## Princípios da constitution aplicáveis

Free Tier (scan só admin, spec justifica); dataset estático de escolas; isolamento Firebase (só principal); escopo cirúrgico; SDD.
