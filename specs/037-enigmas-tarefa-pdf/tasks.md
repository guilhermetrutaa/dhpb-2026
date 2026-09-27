# Tasks: Enigmas reais do TAREFA.pdf (fase 3)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `specs/037-.../` | Artefatos preenchidos | nenhum |
| T2 | Remedir a geometria | `config.js` | Lombada e os dois papéis medidos; `DVD_GEO.texto` com `left/top/width/height` e os dois sistemas de coordenadas | nenhum |
| T3 | 20 enigmas + gabarito | `config.js` | Textos do PDF; gabarito 1–7 / 8–14 / 15–20; self-check do gabarito e do sorteio | nenhum |
| T4 | Sorteio por equipe | `config.js` | `ordemAlternativas` com `fmix32`; 400/400 padrões distintos; sem viés | nenhum |
| T5 | Pontuação das duas etapas | `config.js`, `page.jsx` | `calcularPontosTarefa` devolve as duas etapas e a média; `persistirResposta` grava as três | nenhum (mesma transação) |
| T6 | Font + texto nos dois papéis | `page.jsx`, `globals.css` | `next/font/local` em `BryndanWriteBook.ttf`; texto centrado, sem corte nos 4 tamanhos | nenhum |
| T7 | Respondidos só leitura | `page.jsx` | Capa vermelha, halves `disabled`, faixa de aviso, `dvd-aberto` próprio | nenhum |
| T8 | Pastas de imagem | `public/.../dvd-abertos-respondidos/` | 10 PNGs + LEIA-ME, sem 404 | nenhum |
| T9 | Docs + validação | `docs/DATABASE.md` | Schema novo documentado; `npm run build` código 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
