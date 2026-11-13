# Spec: Certificado legível no celular

| Campo | Valor |
|---|---|
| Slug | `058-certificado-mobile` |
| Status | implementada |
| Firebase | nenhum |

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
| PDF gerado no celular | Captura na largura da tela, textos sobrepostos | Captura em 1400px, igual ao desktop |

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
- [x] PDF baixado no celular sai em 1400px de largura (x2)
- [x] Cota Spark: nenhuma query nova
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança (rota e schema iguais)

## Princípios da constitution aplicáveis

Free Tier (zero leitura nova). Diff mínimo.
