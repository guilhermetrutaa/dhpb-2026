# Plan: Prazo da presença, camisas à meia-noite e lista de espera

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/prazoFinal.js` | Corte 23:59 e abertura 00:00 em Fortaleza |
| `src/lib/convocacaoFinal.js` | Quem sai e quem sobe até 121, na ordem do ranking |
| `src/lib/prazoFinal.test.mjs` | Check dos horários e da convocação |
| `src/app/sala-de-equipe/page.jsx` | Botões condicionados ao relógio |
| `src/components/ModalTamanhosCamisa.jsx` | Orientador responde o próprio tamanho uma vez |
| `src/lib/tamanhosCamisa.js` | HTML não conta o mesmo uid duas vezes |
| `src/app/admin/final/page.jsx` | Preview e gravação da convocação |

## Queries

Participante: 0 varredura. Orientador: `array-contains` já existente. Admin: `equipes where edicaoId` só no clique.

## Writes a preservar

`df`, `ni`, `di`, `membro-index` e a presença já gravada não mudam. Convocação escreve só `aprovadoAte`.

## Risco Spark

1 leitura filtrada por orientador ao abrir o formulário. A convocação lê a edição inteira uma vez, no admin.
