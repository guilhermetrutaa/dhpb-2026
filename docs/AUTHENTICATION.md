# DHPB 2026 — Authentication & Authorization

Este documento detalha o funcionamento da autenticação de usuários, os papéis de acesso, a proteção de rotas e os mecanismos de segurança aplicados.

---

## 1. Mecanismos de Autenticação

1. **Plataforma Principal:**
   * **Provedor:** Firebase Authentication nativo (E-mail e Senha).
   * **Cadastro:** Realizado em `/cadastro`, exigindo E-mail, Nome, Sobrenome, Senha ($\ge 6$ caracteres) e seleção do Tipo de Conta (`estudante` ou `professor`).
   * **Login:** Realizado em `/login`, persistindo a sessão via Firebase Web SDK.
   * **Recuperação de Senha:** Em `/recuperar-senha`, enviando e-mail de redefinição padrão do Firebase Auth.

2. **Sistema de Suporte (Cross-Project):**
   * O chat de suporte roda em uma instância isolada do Firebase.
   * A autenticação é delegada através da rota `/api/support/auth`:
     * O frontend envia o ID Token da sessão principal.
     * O servidor valida a assinatura do token usando `jose` contra os certificados públicos do Google.
     * Se válido, gera um Custom Token no Firebase de Suporte com claims de `usuario` ou `admin` (baseado na variável `SUPPORT_ADMIN_EMAILS`).

---

## 2. Tipos de Usuários e Permissões

| Papel | Definição no Banco | Permissões e Rotas Permitidas |
|---|---|---|
| **Estudante** | `users/{uid}.tipo === 'estudante'` | Acesso a `/home`, `/criar-equipe`, `/montagem-equipe`, `/sala-de-equipe`, `/resumo-fase`, `/questao`. Não pode enviar documentos de professor. Limite de 1 equipe por edição. |
| **Professor** | `users/{uid}.tipo === 'professor'` | Acesso a `/enviar-documento` e `/home-professor`. Acesso às edições e montagem de equipes **somente se** `users/{uid}.documentoStatus === 'aprovado'`. Pode orientar e gerenciar múltiplas equipes na mesma edição. |
| **Admin Principal** | `admin-authenticated` no `localStorage` | Acesso completo a `/admin/dashboard`, `/admin/questoes`, `/admin/documentos`, `/admin/ranking`, `/admin/medalhas`. Protegido por tela de login `/admin`. |
| **Admin / Atendente de Suporte** | E-mail listado em `SUPPORT_ADMIN_EMAILS` | Acesso a `/admin/suporte` e `/admin/suporte/chamados/[id]`. Acesso aos chamados em tempo real e respostas pelo chat ou Telegram. |

---

## 3. Matriz de Proteção de Rotas

Todas as telas que exigem autenticação implementam verificação reativa com o `useAuth()` e redirecionamento caso o estado não seja atendido:

```
Rota                    Condição de Acesso                             Redirecionamento se Inválido
/home                   authUser logado                                /login
/home-professor         authUser logado && tipo === 'professor'        /login (ou bloqueio se doc pendente)
/enviar-documento       authUser logado && tipo === 'professor'        /login
/criar-equipe           authUser logado && questionário respondido     /login ou /home
/montagem-equipe        authUser logado && membro ativo da equipe      /home
/sala-de-equipe         authUser logado && membro da equipe            /home
/resumo-fase            authUser logado && fase aberta/correção        /home ou /home-professor
/questao                authUser logado && fase aberta && membro       /home ou /home-professor
/admin/*                localStorage('admin-authenticated') === 'true' /admin
```

---

## 4. Práticas de Segurança e Cuidados para Novos Agentes

1. **Nunca confiar exclusivamente no `localStorage` para mutações críticas:**
   * Operações de alteração de dados no Firestore devem sempre utilizar o `authUser.uid` do Firebase Auth para garantir a identidade do autor.
2. **Tokens de Service Account:**
   * A chave `SUPPORT_SERVICE_ACCOUNT` nunca é exposta no bundle do cliente. É utilizada exclusivamente no servidor via `firestore-rest.js` e `firebase-admin.js`.
3. **Trava de Unicidade de Membros:**
   * Ao adicionar integrantes a uma equipe em `/montagem-equipe` ou `/criar-equipe`, a gravação atômica na coleção `membro-index` impede condições de corrida e inscrições duplicadas de estudantes.
