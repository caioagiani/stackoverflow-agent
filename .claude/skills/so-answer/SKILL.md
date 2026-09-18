---
name: so-answer
description: Rascunhar uma resposta para uma pergunta do Stack Overflow. Use sempre que o usuário colar um link ou id de pergunta do stackoverflow.com, ou pedir para responder/analisar uma pergunta da comunidade.
---

# Rascunhar resposta

Entrada: link ou id de uma pergunta. Saída: um rascunho em `drafts/<id>/answer.md` que o usuário aprova antes de publicar.

Nunca publique nesta skill. Publicar é a skill `so-publish`, e só com OK explícito do usuário na conversa.

## 1. Puxar a pergunta

```
npm run question -- <id ou url>
```

Salva `drafts/<id>/question.md` com enunciado, comentários e respostas existentes em markdown.

## 2. Escolher o caminho

Leia `kb/so-rules.md` e escolha um dos quatro, explicitamente:

| situação | caminho |
| --- | --- |
| sem resposta, ou as existentes estão erradas | responder |
| já tem resposta certa e você concorda | `npm run vote -- <answer_id> --yes` e nada mais |
| resposta certa mas incompleta, e você tem o que falta | upvote + `npm run comment` com o complemento |
| falta repro, opinativa, duplicata, fechada, ou você não consegue validar | passar |

Se o caminho não for "responder", **diga ao usuário em duas linhas qual é e por quê, e pare**. Não rascunhe por obrigação, e não escreva uma resposta que diria o mesmo que a que já está lá.

Uma resposta nova só se justifica se for a melhor da página.

## 3. Entender de verdade

- Leia `kb/<linguagem>.md` (nodejs, php, python) e procure o sintoma. A maioria das perguntas cai num padrão já mapeado.
- Use a tool MCP `so_search` para achar a pergunta canônica sobre o assunto. Se for duplicata clara, volte ao passo 2.
- Confirme comportamento na doc oficial quando a resposta depender de versão. Não confie em memória para flags, nomes de API e defaults.

## 4. Testar antes de afirmar

Se dá para rodar, rode. Use o scratchpad da sessão, nunca o diretório do projeto.

```
node /tmp/.../repro.mjs
php /tmp/.../repro.php
python3 /tmp/.../repro.py
```

Reproduza o erro do autor, aplique a correção, confirme que passou. Se não deu para testar, o rascunho diz explicitamente o que não foi testado.

## 5. Escrever

Abra `kb/voice.md` e siga à risca. O resumo operacional:

- Primeira linha é a causa ou a correção. Sem preâmbulo, sem cumprimento, sem eco do enunciado.
- Diff mínimo, nomes de variáveis do autor preservados.
- Sem fecho, sem resumo, sem emoji, sem bullet com negrito na frente.
- Contrações e frases de tamanhos diferentes.
- Inglês em `stackoverflow.com`.

Escreva em `drafts/<id>/answer.md`.

## 6. Checar

```
npm run publish -- <id> --preview
```

Roda o lint anti-LLM e renderiza pelo próprio Stack Overflow sem publicar. Qualquer `BLOQUEIO` significa reescrever — não usar `--force`.

## 7. Entregar ao usuário

Mostre no terminal, em blocos curtos:

1. O rascunho inteiro.
2. O que foi verificado rodando código, e o que não foi.
3. Por que essa abordagem e não a alternativa óbvia.
4. Riscos: voto para fechar, resposta concorrente, premissa do autor sendo contestada.

Não publique aqui. Quando ele aprovar — "yes", "publica", "manda" —, execute `npm run publish -- <id> --yes` você mesmo, sem devolver o comando para ele copiar.
