---
name: so-publish
description: Executar ações públicas no Stack Overflow na conta do Caio — publicar resposta, editar resposta existente, comentar ou dar upvote. Use somente quando ele aprovar explicitamente a ação.
---

# Agir na conta do Caio

Tudo aqui é público e sai com o nome dele. Dá para apagar, mas o histórico fica e a reputação já aconteceu.

## Pré-requisitos, todos obrigatórios

1. O Caio aprovou **esta ação específica** nesta conversa. Aprovação de um rascunho anterior não vale para o próximo.
2. `npm run me` retorna a conta certa.
3. Para resposta: `npm run publish -- <id> --preview` rodou e o lint saiu sem `BLOQUEIO`.
4. A pergunta não está fechada (o script checa de novo antes de postar).

Se algum item falhar, pare e diga qual.

## Comandos

```
npm run publish -- <id> --yes                          # nova resposta
npm run edit -- <answer_id> --yes --comment "resumo"   # editar resposta publicada
npm run comment -- <post_id> --yes --body "texto"      # comentar (50 rep, 600 chars)
npm run vote -- <answer_id> --yes                      # upvote (15 rep)
npm run vote -- <id> --question --yes                  # upvote na pergunta
```

Quando ele aprova em linguagem natural — "yes", "publica", "manda", "pode ir" —, **execute o comando você mesmo**. Não devolva o comando para ele copiar; ele já aprovou.

`--yes` reflete a aprovação dele, não a sua conveniência. Sem aprovação na conversa, não rode.

Nunca use `--force`. Ele existe para o Caio decidir sozinho, não para o agente contornar o lint.

## Escolher a ação certa

Antes de publicar resposta nova, confirme que ela seria a melhor da página. Se a pergunta já tem resposta correta, o caminho é upvote, ou upvote + comentário quando você tem um complemento real. Ver `kb/so-rules.md`.

## Depois

- O link vai para `drafts/<id>/posted.json` e `answers.jsonl`. Rode `npm run timeline` e mostre ao Caio.
- Se a API recusar por qualidade ou velocidade: **não tente de novo**. Relate e pare. Retry em loop é o padrão que o Stack Overflow trata como abuso.
- Lembre o Caio de acompanhar os comentários nas horas seguintes. Feedback do autor vira edição, não uma resposta nova.

## Ritmo

Volume baixo, qualidade alta. Várias ações em sequência curta chamam revisão automática. Se ele pedir uma rajada, avise uma vez.
