# DHPB 2026 - Documento de Referência

## 1. STACK TECNOLÓGICA

- **Framework:** Next.js 16.2.6 (App Router + React 19.2.4)
- **Estilo:** Tailwind CSS v4 + PostCSS
- **Fontes:** Geist (padrão), Geist Mono (mono), Poppins (pesos 400-700)
- **Autenticação:** Firebase Auth (v12.13.0)
- **Banco:** Firebase Firestore com cache persistente (`persistentLocalCache` + `persistentMultipleTabManager`)
- **Editor Rich Text:** TipTap v3.23.6 (com extensões: tabela, link, lista de tarefas, cor, destaque, sub/sobrescrito, alinhamento)
- **Ícones:** Bootstrap Icons (SVG inline)
- **Hospedagem:** Pronta para Vercel
- **Path alias:** `@/` → `./src/`

## 2. ARQUITETURA DO FIREBASE

### Coleções e Documentos

```
edicoes/                          # Lista de edições do desafio
  {edicaoId}/
    fases/                        # Fases de cada edição
      {faseId}/
        questoes/                 # Questões de cada fase
          {questaoId}             # Contém: numero, instrucao (HTML), alternativas[{letra,texto,peso}], comentario, documentos[{titulo,subtitulo,blocos[...],origem,creditos,...}]

equipes/                          # Equipes cadastradas
  {equipeId}                      # Contém: nome, edicaoId, escola, modalidade, tipoEscola, membros[{uid,nome,email,papel,status}], criadorUid, criadorNome, criadorEmail, aprovadoAte
    respostas/                    # Respostas da equipe para cada questão
      {questaoId}                 # Contém: alternativa, status (pendente/rascunho/entregue), peso, atualizadoEm

users/                            # Dados de usuários
  {uid}                           # Contém: nome, sobrenome, email, tipo (professor/estudante), avatar, documento, documentoStatus, documentoMime, documentoTipo, documentoRecusadoMotivo
    participacoes/                # Subcoleção: {edicaoId} → {equipeId, papel}

escolas/                          # Escolas importadas do INEP
  {inep}                          # Contém: nome, municipio, endereco, uf, tipo, cadastrada, nomeBusca

membro-index/                     # Índice auxiliar (email_base64_edicaoId → {equipeId, papel, uid})
```

### Chave: por que vai ser BARATO agora

| Feature | Site Antigo (2025) | Site Novo (2026) |
|---|---|---|
| **Banco** | Firebase Realtime Database | Firestore |
| **Modelo de custo** | Bytes trafegados + conexões simultâneas | Nº de leituras/escritas/eliminações |
| **Leitura frequente** | `on()` ouvintes em tempo real poluíam o banco | `onSnapshot` só em **2 lugares** (sala-equipe e questao para verificar status de fase/equipe em tempo real) |
| **Cache** | Inexistente | `persistentLocalCache` + `persistentMultipleTabManager` (Firestore faz cache offline automático) |
| **Consultas** | Múltiplas leituras por segundo | Leituras só quando necessário (onClick, carregamento de página) |
| **Escrita de respostas** | Escrevia a cada interação (provavelmente salvando tudo) | Só salva quando usuário clica em "Salvar rascunho" ou "Entregar questão" |
| **Imagens de documentos** | Storage = mais leituras + banda | Documentos são URLS externas (Google Drive, YouTube, URLs diretas) → **zero custo de download** |
| **Comprovantes professor** | Firebase Storage (download caro) | Atualmente **base64 inline** no Firestore (gratuito, mas ineficiente). Você quer migrar para **Cloudinary** (gratuito até certo limite) |

**Conclusão:** Você saiu de um modelo onde tudo era lido em tempo real (Realtime Database) para um modelo **sob demanda** (Firestore + cache local). As únicas escutas em tempo real (`onSnapshot`) são minimalistas (status da fase, verificação de membro). O resto é leitura única ou sob clique. Isso reduz drasticamente o número de operações faturáveis.

## 3. FLUXO DO USUÁRIO (JORNADA COMPLETA)

### Visitante não logado
```
/ (Landing) → sobre | contato | provas-antigas | biblioteca | calendario | regulamento
           → /login → /cadastro
```

### Fluxo do Estudante
```
1. /cadastro → cria conta (tipo: estudante)
2. /home → vê boas-vindas + avatar + lista de edições
3. Clica na edição → handleEdicaoClick():
   a. Busca equipes da edição onde é membro ativo
   b. Se encontrou → redireciona para /montagem-equipe?equipeId=XXX
   c. Se não → redireciona para /criar-equipe?edicaoId=XXX
4. /criar-equipe → preenche nome equipe, busca escola (INEP), tipo escola, modalidade
5. /montagem-equipe?equipeId=XXX → vê slots (orientador, responsável, 2 alunos)
   - O RESPONSÁVEL (criador) pode adicionar/remover membros pelo email
6. Quando equipe completa (4 membros) → link "Sala de Equipe"
7. /sala-de-equipe?equipeId=XXX → timeline visual das fases
   - Fase "aberta" + equipe aprovada até aquela fase → clicável
   - Clica → /resumo-fase?faseId=XXX&edicaoId=XXX&equipeId=XXX
8. /resumo-fase → lista de questões com status (em branco/rascunho/entregue)
   - Link "Baixar prova em PDF" se fase tem provaPdfUrl
   - Link para tarefa se fase.tarefa.titulo existe
9. Clica questão → /questao?questaoId=XXX&...
   - Vê documentos (imagem, texto, vídeo, PDF, música)
   - Seleciona alternativa (A/B/C/D com pesos)
   - Salva rascunho ou Entrega (não pode desfazer)
   - Navegação ← anterior / próxima →
10. /documento → visualização expandida de documento individual
```

### Fluxo do Professor
```
1. /cadastro → cria conta (tipo: professor)
2. /enviar-documento → envia comprovante de vínculo (PDF ou imagem, max 500KB)
   - Status: pendente → admin aprova/recusa
3. Se documentoStatus !== 'aprovado' → bloqueado, só vê aviso
4. Se aprovado → /home-professor (similar ao estudante)
5. Clica edição → mesmo fluxo de equipe
6. Pode CRIAR equipe (vira professor_orientador automaticamente)
7. Pode estar em MÚLTIPLAS equipes (professores não têm restrição)
8. /montagem-equipe (sem ?equipeId) → MultiTeamView
   - Vê TODAS as equipes que orienta
   - Pode ADICIONAR/REMOVER membros em cada
   - Pode ARRASTAR membros entre equipes (swap)
9. Pode criar NOVA equipe pelo link
```

### Painel Admin
```
/admin → login (admin@dhpb.com + senha)
/admin/dashboard → abas:
  - Edições: CRUD de edições + fases (nome, datas, status: pendente/aberta/finalizada/correcao, peso, notaMaxima, provaPdfUrl)
  - Equipes: lista todas equipes com membros
  - Usuários: lista todos users com status de documento
  - Escolas: busca/filtra escolas importadas
/admin/questoes?faseId=XXX&edicaoId=XXX
  - CRUD de questões (com editor TipTap completo)
  - Alternativas com pesos
  - Documentos com blocos (texto, imagem, vídeo, PDF, música)
  - Tarefa da fase (título + URL)
/admin/documentos → aprova/recusa documentos de professores
/admin/ranking → ranqueia equipes por Df (nota ponderada) + sistema de aprovação por cotas
```

## 4. PADRÃO DE DESIGN (ESTILO VISUAL)

### Paleta de Cores
- **Primária (vinho/bordô):** `#82181A` — usada em headers, botões, links, títulos
- **Hover primária:** `#631214`
- **Fundo:** `#fff` (branco) — todas as páginas são fundo branco
- **Texto:** `#000` (preto), `#2e2e2e`, `#313131`, `#333`, `#555`, `#1a1a1a`
- **Background decorativo:** SVG importados (bg-dhpb.svg fundo com padrão)
- **Cores de status:**
  - Entregue: `#CCFFE6` / verde
  - Rascunho: `#F8E3E3` / rosa claro
  - Pendente/Em branco: `#F7F7F7` / cinza claro
  - Erro: `red-600` / `#82181A`
  - Sucesso: `green-600`

### Tipografia
- **Fonte primária:** Poppins (400, 500, 600, 700)
- **Fonte sistema:** Geist (definida no layout)
- **Tamanhos:** Títulos 1.2rem-4rem; Corpo 0.95rem-1.3rem
- **Títulos em maiúsculo:** uppercase com tracking-wide (admin)
- **Links:** `hover:text-[#82181A] hover:underline`

### Componentes Recorrentes
1. **Header** — Logo + Nav (5 links) + Redes Sociais (Instagram, TikTok, YouTube) + Botão Login/Logout
2. **Footer** — Logo + Redes + Realização (IFPB) + Apoio (ANPUH, Comitê, Gov) + Powered by (Kodeo)
3. **Formulário padrão** — Inputs com `rounded-2xl border border-neutral-300 p-4 pl-6 text-sm`, foco: `focus:border-[#82181A] focus:ring-1 focus:ring-[#82181A]`
4. **Botão primário** — `bg-[#82181A] text-white py-4 font-semibold hover:bg-[#631214]`
5. **Botão outline** — `border-[#82181A] border-[3px] text-[#82181A] px-6 py-2 hover:bg-[#82181A] hover:text-white`
6. **Side-image layout** — Páginas de formulário: lado esquerdo imagem SVG (lg:block lg:w-1/2), lado direito formulário
7. **Timeline de fases** — Cards em grid com bolinha de status (verde=aprovado, vermelho=reprovado, âmbar=aguardando, cinza=bloqueado)
8. **Avatar system** — 5 avatares + 8 cidades premiadas, selecionável via popup
9. **Tabelas admin** — `bg-neutral-50 uppercase text-xs` headers, `border-t border-neutral-100` rows, `rounded-2xl shadow-sm border border-neutral-200`

### SVG Backgrounds (public/)
Usados como side-images decorativas nos formulários:
- bg-login.svg, bg-cadastro.svg, bg-criarequipe.svg, bg-cadastro-escola.svg
- bg-admin.svg, bg-esqueceuasenha.svg, bg-escola.svg
- bg-dhpb.svg (padrão repeat para seções)
- bg-sobre2.svg (hero da página Sobre)
- bg-insta.svg (seção Instagram na página Sobre)

### Imagens Públicas (public/)
- **Logos:** logo.svg, DHPB.svg, ifpb-logo.svg, anpuhpb.svg, comite-logo.svg, logo-gov.svg, kodeo-logo.svg
- **Banners:** banner-nego.svg, banner2-dhpb.svg
- **Avatares:** avatar.svg, avatar2.svg, avatar3.svg, avatar4.svg, avatar5.svg
- **Cidades-Avatar:** cabedelo.svg, campina grande.svg, esperanca.svg, joaopessoa.svg, patos.svg, picui.svg, sape.svg, sossego.svg
- **Livros:** previa-livro1.svg a previa-livro5.svg
- **Outros:** image-removebg-preview.png, logo-instagram-dhpb.jpg, video-dhpb.mp4

## 5. SISTEMA DE PONTUAÇÃO (RANKING)

### Cálculo do Df (Desempenho Final)
```
Para cada fase f:
  ni = soma dos pesos das respostas "entregue" (incluindo tarefa)
  ni_max = notaMaxima da fase
  pi = peso da fase
  di = (ni / ni_max) * pi   [desempenho da fase]

Df = soma de di de todas as fases
```

### Sistema de Aprovação por Cotas (Admin)
- 4 categorias: Médio Pública, Fundamental Pública, Médio Particular, Fundamental Particular
- Admin define número de vagas por categoria
- Sistema ordena equipes por Df da fase anterior e seleciona top N
- Atualiza campo `aprovadoAte` na equipe (ex: "fase2", "fase3", "fase4")

## 6. OBSERVAÇÕES TÉCNICAS

### Imagens de Comprovantes (Atual: Base64)
- **Problema:** Documentos de professores são salvos como base64 inline no Firestore (campo `documento` no user)
- **Limitação:** Máx 500KB por arquivo, Firestore tem limite de 1MB por documento
- **Solução desejada:** Migrar para Cloudinary — upload das imagens/PDFs para Cloudinary e salvar apenas a URL no Firestore

### Coleções Internas de Interesse
- `membro-index` → índice base64(email)_edicaoId para consultas rápidas de "este email está em qual equipe nesta edição?"
- `users/{uid}/participacoes` → cache local das equipes do usuário

### Hooks e Context
- **AuthContext:** `authUser`, `userData`, `loading`, `logout`, `edicoes`, `refreshUserData`
- Carrega dados do user de `users/{uid}` e edições de `edicoes` orderBy createdAt desc

### Padrão de Código
- **'use client'** em TODAS as páginas (não há Server Components)
- **Suspense boundary** em páginas com `useSearchParams()`
- **onSnapshot** usado em: sala-de-equipe, montagem-equipe, questao (status da fase), resumo-fase (status da fase)
- **Imports:** sempre usam `@/` path alias
- **Tratamento de erro:** try/catch silencioso na maioria dos casos (console.log em alguns)
