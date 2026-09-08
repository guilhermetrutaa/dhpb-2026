# Playbook: cadastro silencioso da tarefa no admin + link no resumo

Documento para **outro chat do Cursor** corrigir só o fluxo de cadastro/link da tarefa. Não implemente fórmula nova. Não refatore prova.

SDD: **antes** de editar `src/`, copie `specs/_templates/` para `specs/006-admin-salvar-tarefa/` e preencha spec mínima (repro + aceite). Spec manda sobre o chat. Depois: plan curto + tasks. Só então `src/`.

---

## Required reading (máx. 6)

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md` (campos `tarefa`, `tarefaUrl` na fase)
4. `specs/006-admin-salvar-tarefa/spec.md` (criar a partir do template)
5. Este playbook
6. Trechos alvo: `handleSalvarTarefa` em `src/app/admin/questoes/page.jsx` (~707–717) e o `Link` da tarefa em `src/app/resumo-fase/page.jsx` (~205–216)

---

## Repro

### A — Admin sem feedback

1. Login em `/admin` (`admin@dhpb.com`).
2. Dashboard → edição → fase → “Questões” (`/admin/questoes?faseId=...&edicaoId=...`).
3. Bloco **Tarefa da Fase**: título, URL (ex. `/tarefas/demo`), pontuação.
4. **Salvar Tarefa**.

**Hoje:** o botão não mostra sucesso nem erro. `catch {}` engole falha. O operador acha que não cadastrou.

**Aceite:** mensagem visível de sucesso ou de erro (texto do Firestore). Recarregar a página mantém título, URL e pontuação.

### B — URL sem fase

1. Abrir `/admin/questoes` **sem** query.
2. Clicar Salvar.

**Hoje:** `updateDoc` em path inválido, silêncio.

**Aceite:** aviso “Faltam faseId e edicaoId. Abra pelo dashboard.” Sem write.

### C — Aluno abre a tarefa sem contexto

1. Fase com `tarefa.titulo` e `tarefaUrl` preenchidos.
2. Aluno em `/resumo-fase?faseId=&edicaoId=&equipeId=`.
3. Clica no cartão da tarefa.

**Hoje:** `href={fase.tarefaUrl || '#'}` — sem `equipeId`, `faseId`, `edicaoId`.

**Aceite:** o href é o path cadastrado **mais** os três params (sem duplicar se a URL já tiver query). Sem título, o cartão continua oculto (`fase?.tarefa?.titulo`).

---

## Causa no código

`src/app/admin/questoes/page.jsx`:

```javascript
const handleSalvarTarefa = async () => {
  try {
    await updateDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId), {
      tarefa: { titulo: tarefaTitulo, pontuacao: parseFloat(tarefaPontuacao) || 0 },
      tarefaUrl,
    })
  } catch {}
}
```

Sem validação, sem `setErro`/`setMsg`, catch vazio. `updateDoc` falha se o doc da fase não existir.

`src/app/resumo-fase/page.jsx` lê status em `respostas['tarefa']`. **Fora deste playbook** alinhar esse id com `tarefa_${faseId}` (contrato em `docs/AI_PROMPT_TAREFAS.md`), a menos que a spec 006 peça só o append de query.

---

## Diff mínimo (o que fazer)

### 1. `handleSalvarTarefa` — só este handler + UI de mensagem no bloco Tarefa

- Se `!edicaoId || !faseId`: setar erro e `return`.
- `updateDoc` no path atual (`edicoes/{edicaoId}/fases/{faseId}`).
- Se o erro for documento inexistente, **opcional:** `setDoc(..., { merge: true })` **somente** com `tarefa` + `tarefaUrl`. Não recrie a fase inteira nem zere `peso`/`notaMaxima`/`status`.
- `catch`: mostrar `err.message`. Não engolir.
- Sucesso: texto curto (“Tarefa salva.”).
- Estado local: `salvandoTarefa` no botão (disabled + label). Reuse `erro` da página ou um `msgTarefa` local — sem extrair componente novo.

Não altere `handleCriarQuestao`, TipTap, upload Cloudinary, lista de questões.

### 2. Link no resumo — só o `href` do cartão da tarefa

Helper pequeno no mesmo arquivo (não crie `lib/`):

- Base = `fase.tarefaUrl` (se vazio, `#`).
- Se base for `#` ou não começar com `/`, não invente rota.
- Acrescente `equipeId`, `faseId`, `edicaoId` via `URLSearchParams` (funciona se já houver `?`).

Não mude layout, cores, `onSnapshot`, nem a listagem de questões.

### 3. Docs no mesmo PR

Se o schema não muda (já existem `tarefa` e `tarefaUrl`), não reescreva `DATABASE.md`. Uma linha em `docs/KNOWN_ISSUES.md` só se o feedback do admin ficar pendente de propósito. Preferível: fechar o gap com o aceite da spec.

---

## Proibido neste playbook

- Nova fórmula de pontuação; recalcular `df` em massa.
- Editar `src/app/questao/page.jsx` (exceto leitura).
- `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`.
- Criar `src/app/tarefas/**` (isso é outra tarefa; use `docs/AI_PROMPT_TAREFAS.md`).
- Somar `tarefa.pontuacao` em `notaMaxima` automaticamente (comportamento novo; spec à parte).
- Remover dual-write `fase.questoes`.
- `npm install`, `specify init`.
- `getDocs(collection)` sem `where`/`limit` no path do aluno (o resumo já escuta a subcoleção da **própria** equipe — não alargue isso).
- Misturar `@/lib/firebase` com `@/lib/support/firebase`.

---

## Checklist de teste

Admin:

- [ ] Pelo dashboard, salvar tarefa → “Tarefa salva.”
- [ ] F5 → campos iguais.
- [ ] Firestore: `edicoes/{edicaoId}/fases/{faseId}` tem `tarefa` e `tarefaUrl`.
- [ ] `/admin/questoes` sem query → erro, sem write.
- [ ] Forçar falha (faseId inventado) → mensagem, não silêncio.
- [ ] Criar/editar questão objetiva ainda funciona.

Aluno (fase `aberta`, equipe na fase 1):

- [ ] Cartão aparece se houver título.
- [ ] Href contém `equipeId`, `faseId`, `edicaoId`.
- [ ] Sem título, cartão some.
- [ ] Status pode continuar “Em branco” até existir página de tarefa que grave a resposta — aceitável neste playbook.

Validação SDD:

- [ ] Critérios da spec 006
- [ ] Checklist da constitution
- [ ] `npm run build` código 0
- [ ] Diff só nos arquivos combinados

---

## Prompt para colar no outro chat

```
Leia docs/PROJECT_CONTEXT.md, docs/CONSTITUTION.md, docs/DATABASE.md
e docs/PLAYBOOK-CORRECAO-ADMIN-TAREFA.md.

Crie specs/006-admin-salvar-tarefa/ a partir de specs/_templates/
(spec mínima: repro A/B/C + aceite). Espere aprovação da spec se o fluxo
do repo exigir. Depois implemente APENAS:
1) feedback + validação em handleSalvarTarefa (admin/questoes/page.jsx)
2) append de equipeId, faseId, edicaoId no Link da tarefa (resumo-fase/page.jsx)

Não mexa em pontuação, questao, ranking, Auth, firebase, nem crie /tarefas.
Sem npm install. npm run build = 0.
```
