# Spec: Tarefa Portfólio Artístico (fase 4)

| Campo | Valor |
|---|---|
| Slug | `042-tarefa-portfolio-artistico` |
| Status | implementada (pontuação pendente) |
| Firebase | principal |

## Problema / valor

Na fase 4 a equipe escolhe um(a) artista paraibano(a) e monta um portfólio: cabeçalho (título + capa) e 6 seções de texto/imagem (trajetória, obra representativa, obra sob análise, reflexão, equipe, referências). A equipe escolhe 1 de 4 designs (rosa, verde, azul, bege — `public/PORT{1..4}_PAG{1..5}.jpeg`) e vê uma prévia "parede de museu" com 5 abas e animações. Rascunho salvo sob demanda; uma entrega imutável ("Entregar a questão"). Correção é feita pela banca: a entrega **não credita pontos** (`peso: 0`) até spec futura.

## Atores

- [x] Estudante
- [x] Professor — mesmo acesso, se membro ativo
- [x] Admin principal — cadastra título, URL `/tarefas/portfolio-artistico` e pontuação em `/admin/questoes` (já existe)
- [ ] Atendente

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `admin/questoes`, `resumo-fase`, `respostas-tab`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`. Não instala dependências (usa `framer-motion` já instalado e `next/font`). Não usa o Firebase de suporte. Fora: pontuação da entrega, visualização na banca/admin, galeria pública.

## Formulário (fonte: Lovable, `public/PORT1..9.jpeg`)

Todo texto: mínimo 2 caracteres. Imagens: JPG/PNG, até 3 MB, até 3000×3000 px.

| Seção | Campo | Máx. |
|---|---|---|
| Cabeçalho | Título do portfólio | 200 |
| Cabeçalho | Capa (identidade visual) | imagem |
| 1 | Imagem 1, Legenda 1, Nome do artista, Trajetória | img, 400, 200, 800 |
| 2 | Título da obra, Imagem 2, Link (opcional), Legenda 2, Apresentação | 200, img, 500, 400, 1200 |
| 3 | Título da obra, Imagem 3, Link (opcional), Legenda 3, Análise | 200, img, 500, 400, 1600 |
| 4 | Reflexão crítica, Identificação da questão | 800, 200 |
| 5 | Imagem da equipe, Créditos | img, 400 |
| 6 | Referências | 1000 |

A entrega é permitida mesmo com campos incompletos (regulamento), com aviso.

## Prévia (parede)

Cabeçalho fixo: título, capa (largura total, recorte 625 px de altura), 5 abas ("O artista e sua trajetória", "O artista através da obra", "Obra sob análise", "Reflexão histórica", "Aba da equipe"), linha inferior. Pág. 4 com "REFLEXÃO HISTÓRICA" fixo; Pág. 5 com nome da equipe (de `equipe.nome`), créditos, imagem, "REFERÊNCIAS USADAS" fixo, referências e logos de realização/apoio. Animações: troca de aba deslizante, Ken Burns na capa, obras com entrada "pendurada", holofote seguindo o cursor, lightbox; `prefers-reduced-motion` desliga.

## As-is vs to-be

| Regra | Hoje | Depois |
|---|---|---|
| Tarefa fase 4 | Não existe | `/tarefas/portfolio-artistico?equipeId&faseId&edicaoId` |
| Upload de participante | Só professor (`enviar-documento`) | Upload unsigned Cloudinary em `dhpb/portfolios/{equipeId}` |
| Pontuação | — | Entrega com `peso: 0`, sem `increment` |

## Firestore

**Leituras:** `getDoc` de `equipes/{equipeId}`, `edicoes/{edicaoId}/fases/{faseId}`, `equipes/{equipeId}/respostas/tarefa_{faseId}`. Zero scan.

**Writes:** só em "Salvar rascunho" e "Entregar". `runTransaction`; aborta se já `entregue`. Dual-write `respostas/tarefa_{faseId}` + `equipes.respostas.tarefa_{faseId}` + `equipes.respostas.tarefa`. Payload: `{ status, peso: 0, faseId, tipo: 'tarefa', design, portfolio, atualizadoEm, atualizadoPor }`. `ni`/`di`/`df`: sem alteração (delta 0). `membro-index`/`aprovadoAte`: nenhum impacto.

## Required reading

1. `docs/AI_PROMPT_TAREFAS.md`
2. `src/app/tarefas/viagem-no-tempo/page.jsx`
3. `src/app/enviar-documento/page.jsx`
4. `src/lib/cloudinary.js`

## Critérios de aceite

- [x] Rota com `'use client'` + `Suspense`; sem os três params, erro e link ao resumo
- [x] Formulário com campos, orientações, contadores e limites da tabela
- [x] Upload valida tipo, tamanho e dimensões antes de enviar
- [x] Seletor de 4 designs só após "Concluir preenchimento" (aviso no formulário); prévia com 5 abas, cabeçalho fixo e animações
- [x] Textos longos sem espaço quebram dentro da parede (`overflow-wrap: anywhere`) em todos os temas
- [x] Rascunho e entrega via `runTransaction`; segunda entrega aborta; `correcao`/`entregue` somente leitura
- [x] Imagens exibidas via `optimizeCloudinaryUrl`
- [x] Nenhuma query sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs atualizados (`DATABASE.md`, `BUSINESS_RULES.md`)

## Princípios da constitution aplicáveis

Free Tier, isolamento Firebase, `entregue` imutável via transação, dual-write legado, `'use client'` + `Suspense`, Cloudinary otimizado, sem dependência nova. Nota: o limite de 3 MB vem do regulamento da tarefa; a regra de 2 MB da constitution é para upload do admin.
