# Plan: Sistema de correção da tarefa Portfólio Artístico (fase 4)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, React 19, Firebase Spark). Não escolhe stack nova, não instala dependência.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/criterios.js` | 47 critérios (id, bloco, texto, peso) + escala 100/75/50/25/0 + `notaDe` + autotest |
| `src/lib/correcao.js` | Correitores/campus, `classificarEquipe`, `distribuir`, `notaFinal`, `precisaTerceira`, `gravarNota` + autotest |
| `src/app/correcao/page.jsx` | Login + cadastro + board + painel (client, `Suspense`) |
| `src/app/admin/dashboard/page.jsx` | Botão "Gerar distribuição da correção" na aba Equipes |
| `docs/DATABASE.md`, `docs/BUSINESS_RULES.md` | `correcoes` nova coleção + regra de correção |
| `specs/044-correcao-portfolio/` | Spec / plan / tasks |

Sem arquivo novo em `src/lib/firebase.js`, `AuthContext`, `tarefas/portfolio-artistico/*` — a página de entrega fica intocada.

## Reuso (sem duplicar)

- `PortfolioWall` + `config.js` (`temaPorId`, `embedUrl`) — o painel importa direto, zero cópia.
- `getRede` / `ehPublica` de `@/lib/eliminacaoFases` para pública × privada.
- `round2` de `@/lib/recalcularPontuacao`.
- `EQUIPE_EXCLUIDA_RECALC_ID` de `@/lib/recalcularPontuacao` — a equipe de teste fica fora da distribuição.
- `getModalidade` existe duplicado em `admin/ranking` e `admin/dashboard`; a normalização de modalidade vai em `correcao.js` como `classificarEquipe` (fonte única nova, sem tocar os dois legados).
- `optimizeCloudinaryUrl` — todo `<img>` do portfólio.

## Dados

47 critérios em 11 blocos, pesos do Excel 2026. Soma dos pesos = **100**. Cada critério: `{ id, bloco, texto, peso }`. Bloco = subtotal do Excel (linha `COMANDO` correspondente). Nível → fator em `FATORES`; `notaDe(peso, nivel)` = `round2(peso * fator)`, nível ausente = 0.

Escala é `100/75/50/25/0` para **todo** peso (decisão do solicitante, inclusive peso 1 — diverge do exemplo do PDF, que fica registrado aqui de propósito).

## Distribuição

`distribuir(equipes, faseId)` puro:

1. Filtra `EQUIPE_EXCLUIDA_RECALC_ID`.
2. Só entram equipes com `status === 'entregue'` em `respostas.tarefa_{faseId}` (ou no mapa legado dessa fase).
3. Ordena por `nomeLower` — ordem estável, mesma entrada dá a mesma saída.
4. Para cada equipe, escolhe os 2 elegíveis de menor carga: entre os 7, descarta quem é do campus da equipe e quem já está na lista da equipe; ordena por (carga, ordem fixa da lista) e pega os 2 primeiros.

Carga inicial 0 → a primeira equipe vai para os 2 primeiros elegíveis; as seguintes vão preenchendo os demais. Sem estado global, sem aleatoriedade, sem seed.

Carga alvo do PDF (44/43 Pública Médio) é o resultado esperado do round-robin com 7 corretores; a spec não exige número exato, só equilíbrio.

Campus: `campusDe(equipe, escolasPorId)` compara o nome da escola com `escolas-pb.json` (`id` = `escolaId`, campo `municipio`) e casa por nome normalizado. Sem match → `null` → sem restrição.

## 3ª correção e veredito

- `precisaTerceira(notas)` = exatamente 2 notas e `|a − b| >= 20`.
- 3º corretor: elegível (fora do campus, fora dos 2 primeiros), menor carga primeiro.
- `notaFinal(notas)`: 2 notas → `round2((a+b)/2)`; 3 notas → descarta a menor, `round2((a+b)/2)` das 2 maiores. Sem notas → 0.
- `gravarNota` só roda no admin (ou na 3ª correção); lê ao vivo com `runTransaction`, `delta = notaFinal − pesoAtual`, `increment` em `df`, `pontuacoes.{faseId}.ni` e `.di` (doc + mapa), `set` merge em `respostas/tarefa_{faseId}` e nos mapas embutidos. `delta === 0` → não grava. Nunca toca `status`, `portfolio`, `design`.

## Writes

`correcoes/fase4/distribuicao` (doc único: `{ versao, geradoEm, atribuido: { equipeId: [uid, uid] }, status: 'ativa' }`) e `correcoes/fase4/correcoes/{uid}` (uma correção por corretor: `{ equipeId, criterios: { id: nivel }, nota, ia: [ids], comentario, corretorUid, atualizadoEm }`). Veredito consolidado em `correcoes/fase4/vereditos/{equipeId}`.

Batch na geração: 1 write da distribuição + 2 writes de atribuição por equipe. Idempotente — regerar sobrescreve `atribuido`, não duplica.

## Auth

Página fora do admin, mas no mesmo `auth` (`@/lib/firebase`) — `signInWithEmailAndPassword` + `createUserWithEmailAndPassword` + `setPersistence(browserLocalPersistence)`. Guarda `correcao-authenticated` no `localStorage` como os pages do admin, e revalida com `onAuthStateChanged` (padrão de `admin/documentos`) para não confiar só no flag. `tipo: 'corretor'` no doc `users/{uid}` — não colide com `estudante`/`professor`.

## UI

- **Login/cadastro**: copia o layout de `src/app/admin/page.jsx` (Poppins, metade imagem `/bg-correcao.svg`, metade form, vinho `#82181A`). Abas Entrar / Criar conta. Checkbox "Manter conectado", ligado por padrão.
- **Board**: CSS Grid puro. Header com nome + email + sair. Abas dos 7 professores (a do logado em destaque). 5 colunas: Públicas (Médio), Públicas (Fundamental), Privadas (Médio), Privadas (Fundamental), Corrigidas. Card = nome da equipe + escola + cidade.
- **Painel**: split. Esquerda 47 critérios agrupados por bloco, 5 níveis por linha, subtotal do bloco, total geral, botão IA por bloco. Direita `PortfolioWall`.
- Corrigidos vão para "Corrigidas" quando a 2ª (ou 3ª) nota fecha.

## Risco Spark

Leitura do board: 1 query filtrada (`array-contains` + `limit`). Clique no card: 1 `getDoc` da equipe. Identidade: 1 query `where('tipo','==','corretor')` + `limit`. Sem scan. Admin (uma vez): 1 query `where('edicaoId')` + fases ordenadas.

## Docs a atualizar

`docs/DATABASE.md` (coleção `correcoes`, campo `tipo: 'corretor'` em `users`) e `docs/BUSINESS_RULES.md` (§ correção da fase 4: escala, 3ª correção, veredito, campus).