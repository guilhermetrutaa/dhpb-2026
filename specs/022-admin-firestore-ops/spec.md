# Spec: Painel admin Firestore — contas, equipes e questionários

| Campo | Valor |
|---|---|
| Slug | `022-admin-firestore-ops` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Admins de suporte precisam criar/excluir contas, corrigir nome e e-mail, montar equipes e ajustar questionários sem ir ao console do Firebase nem reabrir `/cadastro` e `/criar-equipe` (prazo encerrado). Hoje `/admin/firestore` só busca e apaga equipe/`membro-index`/`participacoes`.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não reabre `/cadastro` nem `/criar-equipe` para o público. Não altera `criar-equipe`, `montagem-equipe`, `questao`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, dual-write de prova, `df`, `aprovadoAte`, chat. Não usa `SUPPORT_SERVICE_ACCOUNT`. Não lista todas as pessoas/equipes sem filtro. Não edita `respostas` nem questões `entregue`. Não desativa conta sem apagar, não mescla duplicatas, não cria stub de questionário, não transfere `criadorUid`, não apaga equipe vazia após cascata.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Criar conta | Só `/cadastro` (encerrado) ou console Auth | Admin cria Auth + `users/{uid}` via `/api/admin/auth/*` (token `admin@dhpb.com`) |
| Excluir conta | Não existe | Cascata: tira das equipes + `membro-index` (chave original e lowercased) + `participacoes` + `questionarios` + `users/{uid}` + Auth. Equipe vazia permanece. Professor com outras equipes: retarget `participacoes` (spec 015) |
| Nome | Só leitura no card | Edita `users.nome`/`sobrenome` (normalização spec 004) e espelha `membros[].nome` / `criadorNome` |
| E-mail | Só leitura | Auth + Firestore + reescreve `membro-index` + `membros[].email` + `criadorEmail` |
| Questionário | Outra aba, só leitura | `getDoc`/`setDoc`/`deleteDoc` em `users/{uid}/questionarios/{edicaoId}`; `questionarioEquipe` no card da equipe |
| Equipe | Busca + exclusão profunda + link montagem | Criar (payload de criar-equipe, escola em `escolas-pb.json`); renomear (sem cooldown 25 dias; ainda checa `nomeLower`); add/remove/mover/trocar membros; trocar papel `aluno`↔`responsavel`; editar escola/modalidade |
| `membro-index` | Só apagar registro avulso | Add/remove/troca/e-mail em `writeBatch`. Professor: não sobrescreve index 1:1. Botão recriar index quebrado |
| Busca pessoa | E-mail ou nome completo | Também UID (`getDoc(users/{uid})`) |
| Senha | Console / `/recuperar-senha` | Admin define senha na criação; botão envia reset; metadados Auth (`emailVerified`, `disabled`, `lastSignInAt`) |

## Firestore

**Leituras:** buscas atuais (`getDoc(equipes/{id})`, `nomeNormalized`/`nomeLower` `limit(15)`, `users` e-mail ou nome+sobrenome `limit(15)`); `getDoc(users/{uid})`; subcoleções `participacoes`/`questionarios` do uid com `limit(50)`; `getDoc(membro-index/{key})` por edição (chaves original e lowercased); `users` `where email ==` `limit(1)` ao add membro; `equipes` `where edicaoId+nomeLower` na criação/renomeação; `equipes` `where orientadorUids array-contains uid` só na remoção/cascata de professor; `edicoes` com `orderBy`/`limit` (já existia scan pequeno). Escolas: só `/escolas-pb.json`. Path de aluno/prova: zero full scan.

**Writes:** `writeBatch` para criar equipe, add/remove/mover/trocar membro, troca de e-mail (index + membros), cascata Firestore da conta. `updateDoc` para nome de equipe, escola/modalidade, papel, nome de pessoa, `questionarioEquipe`. `setDoc`/`deleteDoc` no questionário individual. Auth (create/update/delete/get) só no servidor. Impacto em `membro-index`: alinhado ao batch (canonico = e-mail lowercased; delete tenta as duas chaves). `df` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `docs/AUTHENTICATION.md`
5. `src/app/admin/firestore/page.jsx`
6. `src/app/criar-equipe/page.jsx`

## Critérios de aceite

- [x] Admin autenticado como `admin@dhpb.com` cria conta (e-mail, senha ≥ 6, nome/sobrenome normalizados, tipo) sem cair a sessão admin; documento `users/{uid}` na mesma rota da Auth
- [x] Excluir conta pede confirmação digitando o e-mail; cascata Firestore + Auth; não apaga `admin@dhpb.com`; professor multi-equipe não quebra as outras
- [x] Editar nome atualiza perfil e espelho na(s) equipe(s); editar e-mail atualiza Auth + Firestore + `membro-index`
- [x] Questionário individual visível/editável/apagável por `edicaoId`; `questionarioEquipe` no card da equipe
- [x] Criar equipe no admin com escola do JSON, criador existente, batch equipe + participação + index; `/cadastro` e `/criar-equipe` públicos inalterados
- [x] Add/remove/mover/trocar membro e troca de papel usam batch alinhado a `membro-index`; estudante não entra em duas equipes; professor não tem index 1:1 sobrescrito
- [x] Renomear equipe ignora cooldown; ainda bloqueia `nomeLower` duplicado na edição
- [x] Busca por UID; reset de senha; painel Auth (metadados); recriar `membro-index`
- [x] Rotas `/api/admin/*` recusam token que não seja `admin@dhpb.com`; `MAIN_SERVICE_ACCOUNT` nunca no client
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs: `AUTHENTICATION.md`, `DATABASE.md`, `PROJECT_CONTEXT.md` (rotas API)

## Princípios da constitution aplicáveis

Free Tier (where/limit, escolas no JSON); isolamento Firebase (principal ≠ suporte); segredos só em `src/app/api/*`; trava `membro-index` em batch; dual-write de prova intocado; `'use client'` na página; SDD; escopo cirúrgico (`criar-equipe`/`montagem-equipe` não editados).
