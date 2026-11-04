# Spec: PDF do portfólio na correção

| Campo | Valor |
|---|---|
| Slug | `049-pdf-correcao` |
| Status | aprovada |
| Firebase | nenhum |

## Problema / valor

O corretor abre o portfólio na banca e só o vê na tela. Precisa de um arquivo para ler fora do sistema.

## Atores

- [ ] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente

## Escopo negativo

Não altera nota, rascunho, veredito, entrega nem `PortfolioWall`. Não instala dependência. Reusa a folha da spec 048. Vídeo e áudio entram como o link escrito.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Arquivo na banca | Não existe | Botão "Baixar PDF" no painel do portfólio aberto |
| Conteúdo | Parede em abas | Documento com todas as seções, na cor do design |

## Firestore

Nenhuma leitura nem escrita nova.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `src/app/correcao/page.jsx`
3. `src/app/tarefas/portfolio-artistico/portfolioPdf.jsx`
4. `specs/048-pdf-portfolio/spec.md`
