# Spec: PDF do certificado montado direto com jsPDF

| Campo | Valor |
|---|---|
| Slug | `059-certificado-pdf-jspdf` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

Participantes baixam o certificado e recebem PDF em branco (iPhone) ou só com texto, sem logos e assinaturas. O PDF era uma captura do DOM via `html2canvas`:

- Assinaturas, logos e cacto são PNGs embutidos em `certificado-fundo.svg`; ao desenhar o SVG no canvas, Safari e alguns Chrome mobile pulam essas imagens internas.
- No celular o texto tem ~4px e é desenhado com escala ~8; em alguns navegadores não aparece.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera: prévia em tela, textos, carga horária, dados lidos, rotas, PDF do portfólio (continua com `html2canvas`). Sem bloqueio anti-cópia nem código de validação (decisão do usuário: só corrigir o PDF).

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Geração do PDF | `html2canvas` da tela + `jsPDF.addImage` | `jsPDF` direto: fundo JPEG + texto `times` em posições fixas, A4 paisagem |
| Fundo no PDF | SVG com PNGs embutidos | `public/certificado-fundo.jpg` (2480px, gerado uma vez do SVG com `sharp`) |

## Firestore

**Leituras:** nenhuma nova.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/certificado/page.jsx`
4. `src/app/certificado-medalha/page.jsx`
5. `specs/058-certificado-mobile/spec.md`

## Critérios de aceite

- [x] PDF tem fundo com assinaturas e logos, e todos os textos, independente do navegador
- [x] Layout espelha a prévia em tela (mesmas porcentagens)
- [x] Acentos (ã, ç, º, Â) corretos
- [x] `node src/lib/certificadoPdf.test.mjs` passa
- [x] Cota Spark: nenhuma query nova
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança (rota e schema iguais)

## Princípios da constitution aplicáveis

Free Tier (zero leitura nova). Sem dependência nova (`jspdf` já instalado; `sharp` só para gerar o asset uma vez). Diff mínimo.
