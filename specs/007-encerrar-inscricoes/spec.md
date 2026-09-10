# Spec: Encerrar inscricoes com interruptor no admin

| Campo | Valor |
|---|---|
| Slug | `007-encerrar-inscricoes` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

No fim do prazo (10/09/2026), ninguem deve criar conta, criar equipe nem incluir membros. O admin precisa ligar/desligar isso na hora, sem deploy a meia-noite. Equipes com os quatro slots de `membros` preenchidos continuam na sala e nas provas.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Nao altera `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `questao`, `admin/ranking`, chat de suporte (exceto texto em `knowledge.js`). Nao migra o campo `isCompleta`. Nao reescreve o relatorio Glayds. Nao bloqueia login nem recuperar senha. Nao publica regras do Firestore Console.

## As-is vs to-be

| Regra | No codigo hoje | Depois desta spec |
|---|---|---|
| Cadastro de conta | `/cadastro` e "Crie agora" sempre criam Auth + `users/{uid}` | Com flag fechada: pagina/link recusam; sem `createUserWithEmailAndPassword` |
| Criar equipe | Home, URL `/criar-equipe` e submit sempre gravam | Flag fechada: recusa no load e no submit |
| Incluir/trocar membro | `montagem-equipe` add/swap livres | Flag fechada: recusa add/auto-add/swap; visualizar continua |
| Equipe completa | Campo `isCompleta` (1+1+2 papeis) | Slots `membros[0]`..`[3]` existem; ignora `isCompleta` |
| Sala de equipe | URL entra se for membro | Flag fechada: entra so com os 4 slots |
| Admin | Sem interruptor | Card no dashboard (qualquer aba): Encerrar / Reabrir |

## Firestore

**Leituras:** `getDoc` / `getDocFromServer` em `config/plataforma` (documento conhecido). Path de aluno/prova: zero full scan. Escolas JSON: inalteradas.

**Writes:** admin `setDoc` merge em `config/plataforma` `{ inscricoesAbertas, atualizadoEm }`. Documento ausente = inscricoes abertas. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum write novo nesses paths; writes de equipe/`membro-index` deixam de ocorrer quando fechado.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/lib/inscricoes.js`
5. `src/app/admin/dashboard/page.jsx`
6. `src/app/criar-equipe/page.jsx`

## Criterios de aceite

- [x] Admin ve card entre as abas e o conteudo; Encerrar/Reabrir com `confirm`
- [x] Flag `false`: cadastro (botao e URL), criar equipe (botao da edicao e URL), cadastro-escola recusam
- [x] Login e recuperar senha continuam; "Crie agora" some
- [x] Add/swap de membros recusados; equipe com `membros[0]`..`[3]` entra na sala
- [x] Completude nao usa `isCompleta`
- [x] Documento `config` ausente = aberto
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` codigo 0
- [x] Docs: `DATABASE.md`, `BUSINESS_RULES.md`; knowledge do suporte atualizado

## Principios da constitution aplicaveis

Free Tier (1 `getDoc` de path conhecido); isolamento Firebase (so principal); escopo cirurgico; SDD; dual-write e `membro-index` nao reescritos; `AuthContext` intocado.
