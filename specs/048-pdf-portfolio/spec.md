# Spec: Download do portfólio em PDF

| Campo | Valor |
|---|---|
| Slug | `048-pdf-portfolio` |
| Status | aprovada |
| Firebase | nenhum |

## Problema / valor

Depois da entrega, a equipe só vê o portfólio na tela. Ela precisa de um arquivo para guardar.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente

## Escopo negativo

Não altera a entrega, o `peso`, a banca nem `PortfolioWall`. Não instala dependência. Vídeo e áudio entram como o link escrito.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Arquivo do portfólio | Não existe | Botão "Baixar PDF" depois da entrega |
| Conteúdo | Parede em abas | Documento com todas as seções, na cor do design |

## Firestore

Nenhuma leitura nem escrita nova.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `src/app/tarefas/portfolio-artistico/page.jsx`
3. `src/app/certificado/page.jsx`
