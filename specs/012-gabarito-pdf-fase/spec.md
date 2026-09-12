# Spec: Gabarito em PDF na fase

| Campo | Valor |
|---|---|
| Slug | `012-gabarito-pdf-fase` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O admin já cadastra o PDF da prova por fase. Precisa cadastrar também o PDF do gabarito. No resumo da fase, quando a fase está em correção e esse link existe, o botão de download passa a apontar para o gabarito (fundo azul, texto “Baixar gabarito”).

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `sala-de-equipe` (acesso), `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`. Não muda trava de acesso (`aberta` / `correcao`). Não toca `membro-index`, `aprovadoAte`, `ni` / `di` / `df`.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| URL da prova | `provaPdfUrl` no admin e botão vinho no resumo | Inalterado |
| URL do gabarito | Não existe | Campo `gabaritoPdfUrl` no card da fase no admin |
| Botão no resumo | Sempre prova (ou “PDF não disponível”) | Em `correcao` + URL preenchida: azul `#002fbd`, “Baixar gabarito”, abre o link do gabarito. Senão, comportamento atual |
| Acesso ao resumo | Só `aberta` ou `correcao` | Inalterado |

## Firestore

**Leituras:** nenhuma nova. O resumo já escuta `edicoes/{edicaoId}/fases/{faseId}`. Path de aluno/prova: zero full scan. Escolas: só `public/escolas-pb.json`.

**Writes:** `updateDoc` pontual no admin em `edicoes/{edicaoId}/fases/{faseId}` com `{ gabaritoPdfUrl }`. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/app/admin/dashboard/page.jsx`
5. `src/app/resumo-fase/page.jsx`

## Critérios de aceite

- [x] Admin: campo e “Salvar” gravam só `gabaritoPdfUrl`, sem alterar `provaPdfUrl`
- [x] Resumo `aberta`: botão continua prova (mesmo com gabarito já cadastrado)
- [x] Resumo `correcao` + URL: fundo `#002fbd`, texto “Baixar gabarito”, `href` = `gabaritoPdfUrl`
- [x] Resumo `correcao` sem URL: continua prova (ou “PDF não disponível”)
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs` atualizados (`DATABASE.md` + knowledge do chat)

## Princípios da constitution aplicáveis

Free Tier (1 write admin por clique; listener existente no resumo); isolamento Firebase (só principal); escopo cirúrgico; SDD; `'use client'` / `Suspense` já existentes no resumo.
