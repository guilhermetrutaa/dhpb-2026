# DHPB 2026 — External Integrations & APIs

Este documento relaciona todos os serviços e APIs externas integradas à plataforma DHPB, suas finalidades, variáveis de ambiente e limitações técnicas.

---

## 1. Google Cloud Firestore & Firebase Auth

* **Finalidade:** Autenticação de usuários e persistência do banco de dados NoSQL.
* **Instâncias:**
  * `NEXT_PUBLIC_FIREBASE_*` (Plataforma Principal DHPB)
  * `NEXT_PUBLIC_SUPPORT_FIREBASE_*` (Chat de Suporte Isolado)
* **Comunicação:**
  * No cliente: Firebase Web SDK v12 via WebChannel com `experimentalForceLongPolling: true` (garante tráfego em redes escolares e proxies).
  * No servidor Next.js: `src/lib/support/server/firestore-rest.js` via REST API com Service Account.
* **Limitações do Spark Free Tier:**
  * 50.000 leituras/dia, 20.000 escritas/dia, 1 GB de armazenamento.
  * O sistema é blindado usando cache estático de escolas e subcoleções desacopladas.

---

## 2. Cloudinary (CDN de Imagens e Documentos)

* **Finalidade:** Armazenamento de comprovantes de professores e imagens de apoio em questões de prova.
* **Contas / Presets:**
  * Principal: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (e preset `dhpb-questoes`).
  * Suporte: `NEXT_PUBLIC_SUPPORT_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_SUPPORT_CLOUDINARY_UPLOAD_PRESET`.
* **Transformações e Otimização em Produção:**
  * Todas as imagens entregues na visualização passam por `@/lib/cloudinary` (`optimizeCloudinaryUrl`), injetando `f_auto,q_auto,c_limit,w_820` (ou `w_640` para prévias).
* **Limitações do Plano Free:**
  * 25 créditos mensais compartilhados (1 crédito = 1 GB de banda OU 1 GB de storage OU 1.000 transformações). A compressão por URL protege a cota mensal.

---

## 3. Groq Cloud AI (Atendimento Automatizado)

* **Finalidade:** Inteligência Artificial que faz o primeiro atendimento ao participante no widget de suporte.
* **Modelos Utilizados:**
  * `llama-3.1-8b-instant` (padrão econômico para triagem rápida).
  * `llama-3.3-70b-versatile` (opção de maior raciocínio).
* **Configuração:**
  * `GROQ_API_KEY`, `GROQ_MODEL`, `AI_PROVIDER=groq`.
  * `max_tokens: 350`, `temperature: 0.2`, `response_format: { type: 'json_object' }`.
* **Comportamento:** Baseia-se exclusivamente no prompt de conhecimento institucional (`src/lib/support/ai/knowledge.js`). Se não souber responder com certeza ou se o usuário pedir atendente humano, aciona `transferir: true`.

---

## 4. Telegram Bot API (Notificação de Atendentes)

* **Finalidade:** Encaminhamento de chamados que precisam de suporte humano para o canal/grupo dos organizadores.
* **Variáveis:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
* **Endpoints:**
  * `/api/support/notify-telegram`: Dispara mensagem com dados do chamado e botão inline `"Assumir atendimento"`.
  * `/api/support/webhook-telegram`: Recebe respostas digitadas pelos atendentes no Telegram e insere no Firestore do chamado.

---

## 5. OneSignal (Web Push Notifications)

* **Finalidade:** Notificações push no navegador para avisos urgentes de abertura de fase, prazos e convocações.
* **Variáveis:** `NEXT_PUBLIC_ONESIGNAL_APP_ID`, `NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID`, `ONESIGNAL_REST_API_KEY`.
* **Componente:** `src/components/OneSignal.jsx` com suporte a tutorial de PWA para dispositivos iOS (`ModalTutorialIos.jsx`).

---

## 6. Tabela de Variáveis de Ambiente

| Variável | Escopo | Obrigatória | Finalidade |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client / Server | Sim | Chave de API do Firebase Principal |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client / Server | Sim | Domínio de Auth do Firebase Principal |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client / Server | Sim | Project ID do Firebase Principal |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client / Server | Sim | Bucket de Storage do Firebase Principal |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client / Server | Sim | Sender ID do Firebase Principal |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client / Server | Sim | App ID do Firebase Principal |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Client | Sim | Nome da nuvem do Cloudinary Principal |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Client | Sim | Upload preset não-assinado (documentos) |
| `NEXT_PUBLIC_SUPPORT_FIREBASE_*` | Client / Server | Sim | Credenciais completas do Firebase de Suporte |
| `NEXT_PUBLIC_SUPPORT_CLOUDINARY_*` | Client | Sim | Cloudinary do Suporte |
| `SUPPORT_SERVICE_ACCOUNT` | Server Only | Sim | JSON da Service Account do Suporte |
| `SUPPORT_SERVICE_ACCOUNT_BASE64` | Server Only | Opcional | Alternativa em Base64 para a Service Account |
| `SUPPORT_ADMIN_EMAILS` | Server Only | Sim | Lista de e-mails com permissão de atendente |
| `GROQ_API_KEY` | Server Only | Sim | Chave de acesso à API do Groq |
| `GROQ_MODEL` | Server Only | Opcional | Modelo Groq (`llama-3.1-8b-instant` default) |
| `TELEGRAM_BOT_TOKEN` | Server Only | Sim | Token do bot do Telegram de suporte |
| `TELEGRAM_CHAT_ID` | Server Only | Sim | ID do grupo/chat receptor das notificações |
| `NEXT_PUBLIC_SITE_URL` | Client / Server | Sim | URL base do site em produção |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Client | Sim | App ID do OneSignal |
| `NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID` | Client | Sim | Web ID Safari do OneSignal |
| `ONESIGNAL_REST_API_KEY` | Server Only | Sim | REST API Key do OneSignal para envios em massa |
