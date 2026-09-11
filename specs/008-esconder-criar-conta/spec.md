# Spec: Bloquear so criacao de equipe apos prazo

| Campo | Valor |
|---|---|
| Slug | `008-esconder-criar-conta` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

Os bloqueios de UI apos o prazo foram **revertidos**. Cadastro, criacao de equipe e montagem voltam ao fluxo original.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)

## Escopo negativo

Nao altera `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, `membro-index`, sala-de-equipe, admin.

## As-is vs to-be

| Regra | Depois do bloqueio | Agora |
|---|---|---|
| Botao criar conta | Removido | "Crie agora" no login |
| Pagina `/cadastro` | Mensagem de encerrado | Formulario cria Auth + `users/{uid}` |
| Clique na edicao sem equipe | `alert` | Vai a `/criar-equipe` |
| Montagem | (nao estava bloqueada no commit) | Incluir membro liberado |

## Firestore

**Leituras:** nenhuma extra do bloqueio. **Writes:** cadastro e criar equipe como antes.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/login/page.jsx`
4. `src/app/cadastro/page.jsx`
5. `src/app/home/page.jsx`
6. `src/app/home-professor/page.jsx`

## Criterios de aceite

- [x] "Crie agora" no login leva a `/cadastro`
- [x] `/cadastro` cria conta
- [x] Sem equipe: vai para criar-equipe
- [x] Montagem permite incluir membros
- [x] Cota Spark: zero leitura extra do bloqueio

## Principios da constitution aplicaveis

Escopo cirurgico, Spark, sem wrappers, AuthContext intocado.
