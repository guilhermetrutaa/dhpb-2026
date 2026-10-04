# Plan: Tarefa Portfólio Artístico (fase 4)

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/portfolio-artistico/config.js` | Seções, campos, limites, temas, `validarImagem`, `contarFaltantes` |
| `src/app/tarefas/portfolio-artistico/page.jsx` | Shell (auth, params, lock), formulário, upload, persistência |
| `src/app/tarefas/portfolio-artistico/PortfolioWall.jsx` | Prévia em 5 abas, 4 temas, animações `framer-motion` |
| `scripts/check-portfolio-config.mjs` | Asserts de limites e validações |
| `docs/DATABASE.md`, `docs/BUSINESS_RULES.md` | Payload `portfolio` e regra da tarefa F4 |

## Queries

3 `getDoc` na abertura (equipe, fase, resposta). Nenhum `getDocs`.

## Writes a preservar

Transação do contrato `docs/AI_PROMPT_TAREFAS.md` com `peso: 0` (delta sempre 0): só `set` da resposta + mapas `respostas.tarefa_{faseId}` e `respostas.tarefa`.

## Auth e UI

Membro `ativo`; fase `aberta`/`correcao`. Localhost: localStorage, sem Firestore. Upload unsigned (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`). Fontes dos temas via `next/font/google`.

## Risco Spark

~3 reads/abertura + 1 transação por rascunho/entrega. Doc da equipe cresce ~8 KB com o espelho (bem abaixo de 1 MB).

## Docs a atualizar

`docs/DATABASE.md`, `docs/BUSINESS_RULES.md`.
