# Spec: Normalizacao de nome e sobrenome no cadastro

| Campo | Valor |
|---|---|
| Slug | `004-normalizacao-nome-cadastro` |
| Status | aprovada |
| Firebase | principal |

## Problema / valor

Usuarios podem cadastrar `nome` e `sobrenome` com espacos extras no inicio, no fim e/ou duplicados no meio. Como a busca administrativa por pessoa usa igualdade exata nesses campos, esses espacos impedem localizar perfis reais.

A mudanca normaliza os campos no cadastro e no termo digitado na busca admin, mantendo o modelo atual sem migracao de dados legados.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

- Nao inclui backfill/migracao de usuarios antigos.
- Nao altera schema de `users`.
- Nao altera regras de busca por e-mail.
- Nao altera regras de `membro-index`, pontuacao, equipes, questoes ou ranking.

## As-is vs to-be

| Regra | No codigo hoje | Depois desta spec |
|---|---|---|
| Persistencia de `nome`/`sobrenome` no cadastro | Valores sao salvos como digitados | Valores sao salvos normalizados (`trim` + colapso de espacos internos) |
| Busca admin por nome completo | `trim` global no termo, mas sem normalizacao completa antes do parse/query | Termo de busca tambem passa pela mesma normalizacao antes do parse/query |
| Entradas vazias apos limpeza | Nao ha validacao dedicada para esse caso | Cadastro bloqueia com mensagem amigavel |

## Firestore

**Leituras:** sem novas queries. Mantem `where('nome','==')` + `where('sobrenome','==')` + `limit(15)` na busca por nome.

**Writes:** sem novas colecoes/campos. Mantem `setDoc(users/{uid})`, alterando apenas o valor normalizado de `nome` e `sobrenome`. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/cadastro/page.jsx`
4. `src/app/admin/firestore/page.jsx`

## Criterios de aceite

- [ ] Comportamento: cadastro salva `nome` e `sobrenome` sem espacos excedentes.
- [ ] Comportamento: busca admin por nome completo encontra usuarios novos mesmo que o admin digite espacos extras.
- [ ] Cota Spark: nenhuma query nova sem filtro no path do participante.
- [ ] `npm run build` codigo 0.
- [ ] Docs em `/docs` atualizados se rota ou schema mudar (nao aplicavel nesta mudanca).

## Principios da constitution aplicaveis

- Preservacao do Free Tier (sem full scans novos).
- Escopo cirurgico (apenas cadastro e busca admin).
- Integridade de build (`npm run build` obrigatorio no lote final).
