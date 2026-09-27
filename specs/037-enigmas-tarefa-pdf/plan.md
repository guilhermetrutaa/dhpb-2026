# Plan: Enigmas reais do TAREFA.pdf (fase 3)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/charadas/config.js` | 20 enigmas, gabarito da estante, `ordemAlternativas`/`alternativasDe`, `calcularPontosResolucao`/`Estante`/`Tarefa`, `DVD_GEO.texto`, `DVD_ABERTO_RESPONDIDO` |
| `src/app/tarefas/charadas/page.jsx` | Fonte local, texto nos dois papéis, escolha por valor, respondidos só leitura, `sorteio`, persistência dos pontos |
| `src/app/globals.css` | `.dvd-texto` (Bryndan Write, 2,1cqw, centralizado), `.dvd-base` como bloco |
| `public/tarefas/charadas/dvd-abertos-respondidos/` | 10 PNGs provisórios + LEIA-ME |
| `docs/DATABASE.md` | `enigmas` agora `{ valor }`; `sorteio`, `pontosResolucao`, `pontosEstante` |

## Onde mora cada coisa

- **Texto do enunciado e valor das alternativas** em `config.js`: é dado do PDF, não estado de tela, e o self-check no fim do arquivo valida o gabarito.
- **`sorteio`** é estado, mas só porque o rascunho pode sobrescrever o valor derivado do `equipeId`. Derivar direto não dá hydration mismatch e não muda entre recargas.
- **`enigmas` guarda valor, não letra.** Qual texto cai em cada lado é sorteado, então "A"/"B" não significam nada entre equipes.
- **Dois textos em duas faces diferentes:** o esquerdo dentro de `.dvd-face-verso` (viaja com a tampa), o direito dentro de `.dvd-base` (fica parado). Por isso `DVD_GEO.texto` tem duas caixas em sistemas de coordenadas diferentes.

## Pontuação

`calcularPontosTarefa` passou a devolver `{ resolucao, estante, nota }`. O `peso` que vai para o Firestore é `nota`; as duas etapas também são gravadas, para conferência no admin. A média é o que o PDF pede, e `Di = Ni × peso` continua idêntico.

## Queries

Nenhuma leitura nova. Path do participante segue com 3 `getDoc`.

## Writes a preservar

`persistirResposta` intacto no mecanismo: `runTransaction`, `increment`, dual-write subcoleção + mapa, rascunho com `delta = 0`, `entregue` imutável. Só ganharam três campos.

## Risco Spark

Nenhum: nenhuma query, nenhum write novo, nenhuma dependência. A fonte é `next/font/local` sobre um arquivo já existente em `public/`.

## Docs a atualizar

`docs/DATABASE.md` (schema). Rota e regras de negócio inalteradas.
