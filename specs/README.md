# Specs — DHPB 2026

Artefatos SDD de **features novas** ou mudança de comportamento. O sistema legado está em `/docs`, não aqui.

Não crie uma spec retrospectiva para cada rota existente.

## Fluxo

```text
IDEIA → SPECIFICATION → PLAN → TASKS → IMPLEMENTATION → VALIDATION
```

1. Copie `specs/_templates/` para `specs/<nnn-slug>/` (próximo número livre, slug em kebab-case).
2. Preencha `spec.md` (o quê/porquê). Em dúvida de regra de negócio, esclareça com humano antes do plan.
3. Preencha `plan.md` (como, neste stack — Next.js 16 + Firebase Spark).
4. Preencha `tasks.md` (fatias verificáveis).
5. Implemente uma task por vez. Valide contra a spec e `docs/CONSTITUTION.md`.

Caminho curto (UI/copy sem Firestore): spec → plan → tasks → implement → validation.

Caminho completo (equipes, provas, ranking, suporte, auth): + clarify, checklist, analyze e aprovação humana da spec.

## Pasta de uma feature

```text
specs/001-exemplo-slug/
  spec.md
  plan.md
  tasks.md
  checklists/requirements.md
```

Convenções do template e restrições Spark: `docs/SDD_ADOPTION_PLAN.md` §§5–9.
