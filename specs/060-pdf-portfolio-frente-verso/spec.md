# Spec: PDF do portfólio em frente e verso

| Campo | Valor |
|---|---|
| Slug | `060-pdf-portfolio-frente-verso` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

O PDF das specs 048 e 049 é uma folha de 800 px fatiada em páginas A4. Imagens e textos partem no meio e o arquivo sai com 4–5 páginas. A banca e as equipes querem um cartaz para imprimir, no padrão do "Buquê histórico": duas colunas, fotos inteiras, faixa de logos. Exatamente 2 páginas A4 (frente e verso).

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera entrega, nota, rascunho, veredito, `PortfolioWall`, `config.js` nem Firestore. Não instala dependência. Vídeo e áudio continuam como o link escrito.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Páginas | Folha contínua fatiada em A4 (4–5 páginas) | Exatamente 2 folhas A4: frente e verso |
| Layout | Uma coluna, seções em sequência | Duas colunas, estilo cartaz, logos no rodapé do verso |
| Corte | Imagem e texto partem entre páginas | Cada folha capturada inteira; texto encolhe até caber |

## Firestore

**Leituras:** nenhuma nova.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/tarefas/portfolio-artistico/portfolioPdf.jsx`
4. `src/app/correcao/page.jsx`
5. `src/app/tarefas/portfolio-artistico/page.jsx`

## Critérios de aceite

- [x] Frente: título, artista e trajetória (`img1`), capa e obra representativa (`img2`)
- [x] Verso: obra sob análise (`img3`), reflexão, referências, foto e créditos da equipe, logos da aba da equipe (DHPB + Realização IFPB + Apoio NUHCL/NDH/Comitê/Kodeo)
- [x] PDF com 2 páginas mesmo com todos os campos no limite de caracteres
- [x] Nenhuma imagem cortada ao meio
- [x] Cota Spark: nenhuma query nova
- [x] `npm run build` código 0
- [x] `docs/BUSINESS_RULES.md` cita frente e verso

## Princípios da constitution aplicáveis

Free Tier (zero leitura), sem dependência nova, diff mínimo. Imagens Cloudinary seguem a transformação JPEG já usada pelo PDF.
