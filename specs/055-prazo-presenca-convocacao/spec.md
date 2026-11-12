# Spec: Prazo da presença, camisas à meia-noite e lista de espera

| Campo | Valor |
|---|---|
| Slug | `055-prazo-presenca-convocacao` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A confirmação de presença na final fecha em 11/11/2026 às 23:59 (horário de Fortaleza). À meia-noite, quem já confirmou escolhe o tamanho da camisa. O admin tira da final quem não confirmou e convoca, da fase 4, o que falta para fechar 121. Professor que orienta mais de uma finalista informa o próprio tamanho uma vez.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera pontuação (`ni`/`di`/`df`), `membro-index`, `questao`, nem o algoritmo que montou as 120 vagas. A convocação não roda sozinha: o admin vê os nomes e confirma. Não reabre o prazo de presença para as equipes convocadas.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Confirmar presença | Sem hora de corte | Bloqueado a partir de 11/11/2026 23:59, America/Fortaleza |
| Formulário de camisa | Assim que a presença está confirmada | Só a partir de 12/11/2026 00:00 |
| Lista da final | Quem tem `aprovadoAte === fase_final` permanece | Admin pode voltar quem não confirmou para `fase4` e subir as próximas `fase4` até 121 |
| Tamanho do orientador | Gravado em cada equipe | Gravado na primeira equipe; as outras não pedem de novo |

## Firestore

**Leituras:** Sala segue o `onSnapshot` da equipe. O modal do orientador reusa `equipes where orientadorUids array-contains uid` (já usada na home do professor) e filtra a edição no cliente. A convocação, só no clique do admin, lê `equipes where edicaoId` e as fases da edição. Sem varredura no path do participante.

**Writes:** Confirmação e camisa iguais às specs 050 e 053. Convocação: `writeBatch` de `aprovadoAte` (`fase4` para quem sai, `fase_final` para quem sobe). Sem `df` e sem `membro-index`.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md` (§2.3 equipes)
4. `src/app/sala-de-equipe/page.jsx`
5. `src/app/admin/final/page.jsx`
6. `src/lib/eliminacaoFases.js`
7. `src/lib/tamanhosCamisa.js`

## Critérios de aceite

- [x] Antes de 11/11/2026 23:59 o botão confirma. A partir desse instante fica desabilitado, mesmo com a página aberta.
- [x] O botão de tamanhos só aparece com presença confirmada e a partir de 12/11/2026 00:00.
- [x] `/admin/final` mostra quem sai e quem sobe. Só grava `aprovadoAte` depois do confirm.
- [x] Orientador com tamanho já gravado em outra equipe da edição não entra de novo no formulário nem no total do HTML.
- [x] Cota Spark: query nova do participante tem `where`. A varredura da edição é só no admin, no clique.
- [x] `npm run build` código 0

## Princípios da constitution aplicáveis

Free Tier no path do participante. `aprovadoAte` só muda no batch do admin, depois de preview. Relógio de Fortaleza (`-03:00`), não o fuso do navegador.
