---
name: so-triage
description: Encontrar perguntas do Stack Overflow que valem resposta, filtrando por tags (node.js, php, python) e janela de tempo. Use quando o usuário pedir para procurar perguntas novas, achar o que responder, ou varrer o feed.
---

# Triagem

Achar poucas perguntas boas, não muitas perguntas.

## Buscar

```
npm run feed -- --tags node.js,php,python --hours 12 --max 15
npm run feed -- --tags node.js --hours 6 --unanswered
npm run feed -- --search "texto livre"
```

O feed já descarta fechadas, respondidas e com 3+ respostas, e ordena por views por resposta — proxy de "muita gente com esse problema e ninguém resolveu".

O feed marca cada pergunta:

- **LIVRE** — ninguém respondeu
- **FRACA** — só respostas com 0 ou negativo
- **COBERTA** — tem resposta aceita ou com +2

## Filtrar de verdade

Das candidatas, leia os títulos e escolha no máximo 5 aplicando `kb/so-rules.md`:

- Tem erro específico e código no enunciado?
- Você conseguiria testar a correção localmente?
- Cai em algum padrão já mapeado em `kb/nodejs.md`, `kb/php.md`, `kb/python.md`?

Descarte sem dó: opinativas, sem repro, dump de tarefa, "qual é melhor", pedido de biblioteca.

**COBERTA não é descarte automático, e também não é convite para responder.** Abra a resposta existente com `npm run question -- <id>` e decida: se ela resolve, o caminho é upvote; se falta algo que você tem, é upvote + comentário; se está errada, aí vale resposta. Nunca proponha uma resposta que diria o mesmo que a de cima.

## Apresentar

Uma linha por candidata: id, título curto, o caminho sugerido (responder / complementar / upvote / passar) e **por quê** em meia linha. Depois pergunte em qual trabalhar. Não rascunhe várias de uma vez.
