# Spec: Copiar escolas e e-mails de completas sem prova

| Campo | Valor |
|---|---|
| Slug | `023-admin-copia-completas-sem-prova` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O admin precisa contactar escolas e professores orientadores das equipes **completas** que ainda não gravaram nenhuma resposta de prova. Dois botões na aba Equipes copiam, respectivamente, os nomes únicos dessas escolas e os e-mails únicos desses orientadores.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, chat. Não varre `equipes/{id}/respostas`. Não muda pontuação, dual-write, `isCompleta` nem ferramentas de manutenção. Não mistura o texto no botão “Copiar resumo”. Não filtra por `faseId` (follow-up quando a fase 2 abrir). `questionarioEquipe` não conta.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Completas sem prova | Só o inverso implícito do bloco “quem começou” no resumo (todas as equipes, não só completas) | Recorte: 4+ membros (017) **e** `equipeContaNoResumo` (013) **e** `!equipeComecouProva` (020) |
| Nomes de escola | Não há botão | Botão copia nomes únicos, um por linha, ordenados `pt-BR` |
| E-mails de orientador | Spec 010 só para incompletas (botões já removidos) | Botão copia e-mails únicos de `professor_orientador` nessas completas sem prova |
| Critério “começou” | Mapa `equipes.respostas` com qualquer chave | Igual (fase 1 é a única aberta; `faseId` fica para follow-up) |

## Firestore

**Leituras:** nenhuma nova query. Reusa `garantirScanEquipes()` da spec 021: `getDocsFromServer(collection(db, 'equipes'))` só no primeiro clique de qualquer botão de cópia; cliques seguintes leem o `useRef`. Nomes de escola: campo `equipes.escola` (0 fetch de `escolas-pb.json`). Path de aluno/prova: zero full scan. `membro-index`: zero.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/dashboard/page.jsx`
4. `specs/013-filtro-resumo-equipes-admin/spec.md`
5. `specs/020-admin-equipes-comecaram-provas/spec.md`
6. `specs/021-admin-copia-equipes-no-clique/spec.md`

## Critérios de aceite

- [x] Completa = 4 ou mais membros gravados (array ou mapa); `equipeContaNoResumo` permanece; não usar `isCompleta`
- [x] Não começou = mapa `respostas` vazio / inexistente / array; não conta `questionarioEquipe`; não varre subcoleção
- [x] Botão “Copiar escolas sem prova”: nomes únicos (chave `escolaId`, fallback nome trimado); texto = `equipes.escola`; omitir sem nome e sem id; um por linha, `localeCompare` `pt-BR`
- [x] Botão “Copiar e-mails sem prova”: `papel === 'professor_orientador'`; unique trim + lowercase; membros array ou mapa; omitir sem e-mail; um por linha
- [x] Clipboard: `writeText`; sucesso com alert (`Copiado: N escola(s).` / `Copiado: N e-mail(s).`); falha mostra o texto no `prompt`
- [x] Zero escolas: `Nenhuma escola de equipe completa sem resposta.` Zero e-mails: `Nenhum e-mail de orientador em equipes completas sem resposta.`
- [x] Primeiro clique de qualquer um dos três botões de cópia dispara o scan se ainda não houver snapshot; segundo clique: 0 `getDocs` extras
- [x] Sem query em `membro-index`; sem write em `isCompleta`
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Follow-up (fora desta entrega)

Quando a fase 2 existir, filtrar “começou esta fase” por `respostas[qId].faseId` da fase alvo em vez de qualquer chave no mapa.

## Princípios da constitution aplicáveis

Free Tier (scan admin só no clique, spec justifica); isolamento Firebase (só principal); escopo cirúrgico; SDD; `membro-index` não é lido nem reescrito.
