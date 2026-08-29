# DHPB 2026 — Known Issues & Technical Limitations

Este documento registra problemas conhecidos, limitações técnicas e pontos de atenção arquitetural identificados na base de código, sem qualquer alteração de código.

---

## 1. Problemas e Limitações Identificados

### 1.1. Autenticação do Painel de Suporte sem Tela de Login Tradicional
* **Localização:** `src/app/admin/suporte/page.jsx` e `src/app/admin/suporte/chamados/[id]/page.jsx`.
* **Descrição:** O painel administrativo do chat de suporte não possui uma tela de login dedicada. Ele é protegido primariamente pelo isolamento de URL (divulgada apenas no grupo privado do Telegram de atendentes) e validação de claims no backend `/api/support/auth`. O nome do atendente é salvo no `localStorage`.
* **Impacto:** Se a URL vazar, um usuário leigo poderia tentar acessar a interface de suporte (embora a emissão de custom token exija e-mail em `SUPPORT_ADMIN_EMAILS`).
* **Observação:** Esta foi uma decisão deliberada da equipe organizadora para simplificar o fluxo dos voluntários de atendimento.

### 1.2. Criação Manual de Índices Compostos no Firestore de Suporte
* **Localização:** `src/lib/support/server/firestore-rest.js` / Console Firebase.
* **Descrição:** A consulta de chamados por `uid ASC + criadoEm DESC` exige um índice composto no Firestore. Como a Service Account não possui a permissão `datastore.indexes.create`, novos índices compostos devem ser gerados manualmente clicando no link fornecido pelo log do Firebase.

### 1.3. Limpeza de Assets Órfãos no Cloudinary
* **Localização:** `src/app/admin/questoes/page.jsx` e `src/app/enviar-documento/page.jsx`.
* **Descrição:** Quando uma imagem de questão ou documento de professor é substituído ou deletado, a URL é atualizada no Firestore, mas a exclusão física do arquivo antigo no Cloudinary via API `destroy` ainda não ocorre de forma automatizada por webhook ou trigger.
* **Impacto:** Acúmulo gradual de imagens antigas no storage do Cloudinary ao longo dos anos.

### 1.4. Monitoramento da Cota Gratuita (Spark Tier)
* **Descrição:** O projeto foi projetado para operar 100% no Spark Free Tier (50k reads / 20k writes diários).
* **Ponto de Atenção:** Durante a 1ª Fase Online (dias 10 a 15 de Setembro de 2026), com ~8.000 alunos acessando, qualquer alteração no código que reintroduza queries não-indexadas ou loops de `getDocs` pode esgotar a cota diária em poucos minutos.

### 1.5. Bloqueio de Push Notification em Localhost
* **Localização:** `src/components/OneSignal.jsx`.
* **Descrição:** O OneSignal SDK falha por design quando executado em `localhost` ou `http://` sem SSL.
* **Solução em Código:** O código contém um bypass explícito para ignorar a inicialização do OneSignal e os modais bloqueadores quando `window.location.hostname === 'localhost'`, garantindo que o desenvolvimento local não seja interrompido.
