# Spec: Reabrir cadastro de pessoas

| Campo | Valor |
|---|---|
| Slug | `018-reabrir-cadastro-pessoas` |
| Status | cancelada (humano pediu fechar de novo antes do deploy) |
| Firebase | principal |

## Problema / valor

`/cadastro` mostra só aviso de inscrições encerradas. Quem ainda precisa de conta (estudante ou professor) não consegue criar. Pedido humano: reabrir o cadastro de pessoas. Criação de equipe nova e inclusão de membro continuam fechadas (008 / 015).

**Cancelada:** o humano pediu para fechar o cadastro de conta de novo antes do deploy. O código voltou ao estado de 008 (`/cadastro` encerrado, sem "Crie agora" no login).

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `home`, `home-professor`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, `membro-index`, prova, chat.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| `/cadastro` | Mensagem de encerrado + link login | Formulário cria Auth + `users/{uid}` (nome/sobrenome normalizados) |
| Login "Crie agora" | Ausente | Link para `/cadastro` |

## Firestore

**Leituras:** `getDocFromServer(users/{uid})` após o write (já existia no fluxo aberto). Sem scan.

**Writes:** `createUserWithEmailAndPassword` + `setDoc(users/{uid})` no fluxo de cadastro. Sem `membro-index` / `df` / `aprovadoAte`.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/cadastro/page.jsx`
4. `src/app/login/page.jsx`
5. `specs/004-normalizacao-nome-cadastro/spec.md`
6. `specs/008-esconder-criar-conta/spec.md`

## Critérios de aceite

- [ ] Comportamento: `/cadastro` exibe e envia o formulário (email, nome, sobrenome, tipo, senha)
- [ ] Comportamento: login mostra "Crie agora" apontando para `/cadastro`
- [ ] Comportamento: nome/sobrenome continuam normalizados (`trim` + colapso de espaços)
- [ ] Home/criar-equipe/montagem: sem mudança neste lote
- [ ] Cota Spark: nenhuma query nova sem filtro no path do participante
- [ ] `npm run build` código 0
- [ ] Docs em `/docs`: rota e schema inalterados

## Princípios da constitution aplicáveis

Escopo cirúrgico, Spark, sem wrappers, AuthContext intocado, integridade de build.
