# DHPB 2026 — Code Conventions & Design System

Este documento estabelece as convenções de código, padrões de componentes, estilos e diretrizes que devem ser estritamente preservados em novas tarefas.

---

## 1. Nomenclatura e Organização

* **Rotas e Diretórios:** `kebab-case` para pastas em `src/app` (ex: `criar-equipe`, `montagem-equipe`, `sala-de-equipe`, `resumo-fase`, `provas-antigas`).
* **Componentes React:** `PascalCase` para nomes de componentes e arquivos de componentes (ex: `SupportWidget.jsx`, `ModalQuestionarioIndividual.jsx`, `ChatWindow.jsx`).
* **Hooks Customizados:** `camelCase` com prefixo `use` (ex: `useAuth`, `useSupportChat`).
* **Funções Utilitárias e Helpers:** `camelCase` (ex: `optimizeCloudinaryUrl`, `normalizarNomeBusca`, `derivarTipo`).
* **Alias de Importação:** Sempre utilizar o alias `@/` mapeado para `src/` (definido em `jsconfig.json`).
  * Exemplo: `import { db } from '@/lib/firebase'` ou `import { useAuth } from '@/context/AuthContext'`.

---

## 2. Padrões de Componentes e Next.js

1. **Diretiva Client-Side:**
   * Todas as páginas interativas utilizam `'use client'` no topo do arquivo.
2. **Tratamento de `useSearchParams()`:**
   * Qualquer página ou componente que utilize `useSearchParams()` deve ser envolvida por um `<Suspense fallback={...}>` para evitar erros durante o build estático do Next.js.
3. **Tipografia Institucional:**
   * Utilizar a fonte `Poppins` (pesos 400, 500, 600, 700) através de `next/font/google` para manter a identidade visual do DHPB.

---

## 3. Design System e Estilização (Tailwind CSS v4)

* **Paleta de Cores Primária:**
  * Vinho/Bordô DHPB: `#82181A` (usado em títulos, botões primários, bordas de foco e destaques).
  * Hover Primário: `#631214`.
  * Fundo Base: `#ffffff` / `bg-white`.
  * Texto Principal: `#000000` ou `#1a1a1a`.
* **Cores Semânticas e de Status:**
  * Entregue / Concluído: Verde (`bg-green-100 text-green-700` ou `#CCFFE6`).
  * Rascunho / Em Andamento: Rosa/Âmbar claro (`bg-amber-100 text-amber-700` ou `#F8E3E3`).
  * Pendente / Bloqueado: Neutro (`bg-neutral-100 text-neutral-500` ou `#F7F7F7`).
  * Alertas / Erros: Vermelho (`text-red-600` ou `bg-red-50`).
* **Formulários e Inputs:**
  * Inputs com bordas suaves: `rounded-2xl border border-neutral-300 p-4 pl-6 text-sm outline-none focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]`.
  * Botões principais com feedback de transição: `bg-[#82181A] text-white py-4 font-semibold hover:bg-[#631214] transition-colors rounded-2xl cursor-pointer`.

---

## 4. Padrões de Banco de Dados e Performance

1. **Nunca Fazer Full Collection Scans:**
   * Evite `getDocs(collection(db, '...'))` sem filtros. Sempre aplique `query(...)` com `where()` e `limit()`.
2. **Leituras Granulares:**
   * Durante as provas, a questão é carregada de forma estática com `getDoc(doc(db, 'edicoes', edId, 'fases', fId, 'questoes', qId))`.
   * O listener reativo do aluno escuta apenas o seu próprio documento de resposta (`equipes/{eqId}/respostas/{qId}`).
3. **Escritas Atômicas:**
   * Gravações que afetam pontuações ou rankings devem usar `runTransaction()` ou `writeBatch()` com `increment()`.
4. **Mídias do Cloudinary:**
   * Sempre passar URLs pelo helper `optimizeCloudinaryUrl(url, { width: 820 })` ao renderizar imagens.
