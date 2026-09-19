# Spec: Aba admin Firestore — respostas da equipe por fase

| Campo | Valor |
|---|---|
| Slug | `027-admin-firestore-respostas-equipe` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Admins de suporte precisam ver, corrigir e apagar respostas de questões e tarefas de uma equipe (fases 1–4) sem abrir o console do Firebase. Hoje `/admin/firestore` não lê `equipes/{id}/respostas`. Entregue é imutável no path do aluno; o admin precisa de override com recálculo de nota para o ranking não ficar inconsistente. Excluir deve reabrir a questão/tarefa para a equipe reenviar.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, dual-write legado (permanece), `membro-index`, `aprovadoAte`, chat. Não usa `SUPPORT_SERVICE_ACCOUNT`. Não lista todas as equipes/respostas sem filtro. Não cria resposta do zero. Path do aluno continua recusando sobrescrita de `entregue`.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Ver respostas | Só console Firebase ou login como aluno | Aba Respostas: busca pelo nome; blocos por fase; questão e tarefa |
| Editar `entregue` | Imutável em `questao` / tarefa | Admin troca alternativa/associações; `runTransaction` + `increment` em `ni`/`di`/`df` |
| Excluir resposta | Não existe no admin | Apaga subcoleção + `deleteField` no mapa; se era `entregue`, desconta nota; equipe pode reenviar |
| Dual-write | Aluno grava subcoleção + `equipes.respostas` + `pontuacoes` | Admin replica o mesmo contrato; tarefa também limpa `respostas.tarefa` se o legado for desta fase |
| Busca | Aba Equipes já busca nome | Mesmo `nomeNormalized` prefix + fallback `nomeLower`, `limit(15)` |

## Firestore

**Leituras:** `equipes` `nomeNormalized` range `limit(15)` ou `nomeLower ==` `limit(15)`; `edicoes/{edicaoId}/fases` `orderBy(dataInicio)` `limit(10)`; `equipes/{id}/respostas` `limit(80)`; `getDoc` pontual de `questoes/{qId}` e da fase na edição. Path de aluno/prova: zero full scan. Escolas: não usadas.

**Writes:** `runTransaction` + `increment`. Editar: `set` na subcoleção + mapa `equipes.respostas.{id}` (tarefa: também `tarefa_{faseId}` e `tarefa` se o legado for desta fase). Excluir: `deleteDoc` + `deleteField`. Delta de nota só se status for/era `entregue`. `df` / mapas `pontuacoes` atualizados. `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/app/admin/firestore/page.jsx`
5. `src/app/admin/firestore/ops.js`
6. `src/app/questao/page.jsx`

## Critérios de aceite

- [x] Admin autenticado busca equipe pelo nome (`limit(15)`), escolhe homônimo e vê questões + tarefa das fases da edição (rótulo `fase.nome`), com pendentes como “sem resposta”
- [x] Editar alternativa de questão lê peso em `questoes/{qId}`; se `entregue`, ajusta `ni`/`di`/`df`; rascunho só troca o documento
- [x] Editar tarefa atualiza `associacoes`; recortes/migalhas recalcula peso com `calcularPontosTarefa` + teto `fase.tarefa.pontuacao`; senão admin informa o peso
- [x] Excluir pede confirmação (nome da equipe + item); some da subcoleção e do mapa; `entregue` desconta nota; equipe pode reenviar
- [x] Editar `entregue` pede confirmação extra com delta de `ni`/`df`
- [x] Dual-write preservado; `atualizadoPor` = `admin` (ou e-mail da sessão)
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs: `DATABASE.md`, `BUSINESS_RULES.md`, `CONSTITUTION.md` §5 (exceção admin spec 027)

## Princípios da constitution aplicáveis

Free Tier (where/limit); isolamento Firebase (só principal); atomicidade (`runTransaction`/`increment`); dual-write intacto; override de `entregue` só nesta aba; `'use client'`; SDD; escopo cirúrgico (prova pública intocada).
