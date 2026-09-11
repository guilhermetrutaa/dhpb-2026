# Spec: Bloquear so criacao de equipe apos prazo

| Campo | Valor |
|---|---|
| Slug | `008-esconder-criar-conta` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

Prazo de inscricao acabou. Cadastro de conta e criacao de equipe bloqueados na UI. Quem ja tem equipe entra normal. Sem documento Firestore, sem admin.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)

## Escopo negativo

Nao altera `criar-equipe` (pagina/URL), `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, `membro-index`, sala-de-equipe, admin.

## As-is vs to-be

| Regra | No codigo hoje | Depois desta spec |
|---|---|---|
| Botao criar conta | "Crie agora" no login | Removido |
| Pagina `/cadastro` | Formulario cria Auth | Mensagem de encerrado; sem `createUser` |
| Clique na edicao sem equipe | Vai a `/criar-equipe` | `alert` de inscricoes encerradas |
| Clique com equipe | Montagem/sala | Inalterado |

## Firestore

**Leituras:** nenhuma nova. **Writes:** nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/login/page.jsx`
4. `src/app/cadastro/page.jsx`
5. `src/app/home/page.jsx`
6. `src/app/home-professor/page.jsx`

## Criterios de aceite

- [x] "Crie agora" nao aparece no login
- [x] `/cadastro` nao cria conta
- [x] Sem equipe: alert, nao navega para criar-equipe
- [x] Com equipe: fluxo atual
- [x] Cota Spark: zero leitura extra

## Principios da constitution aplicaveis

Escopo cirurgico, Spark, sem wrappers, AuthContext intocado.
