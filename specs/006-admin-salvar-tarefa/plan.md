# Plan: Feedback ao salvar tarefa no admin e query no resumo

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/questoes/page.jsx` | Validar IDs, feedback, `setDoc` merge |
| `src/app/resumo-fase/page.jsx` | Append de query no `Link` da tarefa |

## Queries

Nenhuma query nova.

## Writes a preservar

Só metadados da fase (`tarefa`, `tarefaUrl`). Sem pontuação de equipe.

## Auth e UI

Admin continua com `localStorage` + sessão `admin@dhpb.com` já usada nas writes. Sem mudança de `Suspense`.

## Risco Spark

1 write por clique no admin. Zero no path do aluno.

## Docs a atualizar

Nenhum schema/rota novo.
