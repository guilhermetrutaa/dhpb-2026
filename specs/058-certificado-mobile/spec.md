# Spec: Certificado legível no celular

| Campo | Valor |
|---|---|
| Slug | `058-certificado-mobile` |
| Status | implementada |
| Firebase | nenhum |

> A geração do PDF (linhas sobre `html2canvas` abaixo) foi substituída pela spec `059-certificado-pdf-jspdf`. Desta spec segue valendo a prévia em tela (`cqw` + `@container`).

## Problema / valor

No celular, os textos de `/certificado` e `/certificado-medalha` se sobrepõem: o certificado encolhe com a tela, mas a fonte tem piso fixo em rem. O PDF baixado no celular sai com o mesmo defeito.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera: textos, carga horária, dados lidos, rota, Sala de Equipe, PDF do portfólio.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Fonte do certificado | `clamp(rem, vw, rem)` | `cqw` (proporcional à largura do certificado) |
| PDF gerado no celular | Captura na largura da tela, textos sobrepostos | Captura da tela com `scale = 2800 / largura`: PDF sempre com 2800px, igual à tela |
| Fundo (assinaturas e logos) | `background-image` no `<section>`: o `html2canvas` reduz ao tamanho CSS (`resizeImage`) antes de escalar, borrando no celular | `<img>` absoluto como primeiro filho: desenhado direto na resolução final |

Uma cópia forçada em 1400px (`windowWidth` + `onclone`) foi testada e quebrava no Chrome Android (fonte inflada na cópia larga). Por isso a captura usa o certificado da tela.

## Firestore

**Leituras:** nenhuma nova.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/certificado/page.jsx`
4. `src/app/certificado-medalha/page.jsx`

## Critérios de aceite

- [x] Em ~360px de largura, os textos do certificado não se sobrepõem
- [x] No desktop, o layout fica praticamente igual ao anterior
- [x] PDF baixado no celular sai igual à tela, com 2800px de largura
- [x] Assinaturas e logos do fundo nítidos no PDF baixado no celular
- [x] Cota Spark: nenhuma query nova
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança (rota e schema iguais)

## Princípios da constitution aplicáveis

Free Tier (zero leitura nova). Diff mínimo.
