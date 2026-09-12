# Spec: Bloquear cadastro, equipe e montagem apos prazo

| Campo | Valor |
|---|---|
| Slug | `008-esconder-criar-conta` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

Prazo de inscricao acabou. Cadastro de conta, criacao de equipe e inclusao de membros bloqueados na UI. Quem ja tem equipe entra na sala. Sem documento Firestore.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)

## Escopo negativo

Nao altera `criar-equipe` (pagina/URL), `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, `membro-index`, sala-de-equipe, admin. Em `montagem-equipe` so desliga incluir membro.

## As-is vs to-be

| Regra | Fluxo aberto | Agora |
|---|---|---|
| Botao criar conta | "Crie agora" | Removido |
| `/cadastro` | Cria Auth | Mensagem de encerrado |
| Clique sem equipe | `/criar-equipe` | `alert` |
| Incluir membro | Formularios | Desligado. Remover/trocar iguais |

## Firestore

**Leituras:** nenhuma nova. **Writes:** nenhum write de cadastro/equipe/membro pelo fluxo bloqueado.

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
- [x] Sem equipe: alert, nao vai para criar-equipe
- [x] Incluir membro desligado; remover/trocar iguais
- [x] Cota Spark: zero leitura extra

## Principios da constitution aplicaveis

Escopo cirurgico, Spark, sem wrappers, AuthContext intocado.
