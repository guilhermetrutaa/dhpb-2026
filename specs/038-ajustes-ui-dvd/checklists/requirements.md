# Checklist de qualidade da spec

- [x] Problema e aceite são testáveis
- [x] As-is foi conferido no código (a medição inicial mostrou `line-clamp` inoperante)
- [x] Escopo negativo lista módulos sensíveis fora desta feature
- [x] Leituras/writes Firestore estão explícitas: nenhuma. `persistirResposta`
      não muda — `enigmas[id].valor` segue igual
- [x] Required reading tem no máximo 6 arquivos (5)
- [x] Constitution aplicável está citada (ponytail: sem dependência nova, sem
      abstração nova além do necessário)
- [x] Não toca pontuação, `membro-index`, `aprovadoAte` nem isolamento do chat
- [x] Sem mudança de schema: `marcado` é derivado, não persistido
- [x] Humanos aprovam a remoção dos rótulos de valor? **Sim** — a equipe escolheu
      "metades clicáveis, sem mostrar valor nenhum"
