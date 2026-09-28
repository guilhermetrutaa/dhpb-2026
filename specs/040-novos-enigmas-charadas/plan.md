# Plan: 040-novos-enigmas-charadas

- `config.js`: `ENIGMAS` na ordem do PDF (A1..C6) com `respondido`/`fixo`; `CAPA_SRC` vira mapa por id; `hash32` extraído de `ordemAlternativas` e reusado em `ordemGrade(sorteio)`; `FIXOS`, `filaVisual`, `capacidadeMovel`; `idsAlocados`, `alocacaoCompleta`, `gabaritoPrateleiras` e `calcularPontosEstante` cientes dos fixos; `INSTRUCAO` e self-check.
- `page.jsx`: grade por `ordemGrade`; capa por id; estante renderiza `filaVisual`, slot fixo sem `data-slot` e sem ×; índice visual convertido em índice móvel; degraus de fonte para texto longo.
- Estado guarda só os móveis (lista compacta, como antes), então rascunhos antigos continuam legíveis.
