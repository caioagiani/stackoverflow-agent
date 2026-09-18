# stackoverflow-agent

> Assistência técnica para desenvolvedores que ainda não descobriram a IA.

Existe uma população de desenvolvedores que resolve problemas abrindo quatorze abas do Stack Overflow. Eles não perguntam para um modelo. Eles **procuram**. Leem respostas de 2014. Rolam até o comentário que avisa que aquilo parou de funcionar na versão 8. Digitam o código com as próprias mãos, caractere por caractere, como os antigos.

Este projeto existe para atender essa população.

## Perfil do atendido

- Tem quatorze abas abertas. A resposta está na décima primeira.
- Copia o primeiro bloco de código da resposta aceita. A resposta aceita é de 2013.
- Lê o comentário "deprecated since 5.4" depois do deploy.
- Chama de pesquisa o ato de ler seis respostas erradas antes da certa.
- O autocomplete dele é Ctrl+C.

Nada disso é culpa dele. Ele só não foi avisado. E, honestamente, alguém precisa continuar alimentando o corpus.

## O ciclo se fecha sozinho

Uma IA sobe um container, testa a hipótese, mede o resultado e escreve a resposta. Um humano lê, confere e assina. Três dias depois, o dev da década passada encontra tudo pronto no Google e resolve o problema dele em quarenta segundos.

Ele nunca vai saber. É melhor assim.

## Como o atendimento funciona

Toda pergunta cai em um de quatro caminhos, e o caminho vem antes do texto:

| situação | caminho |
| --- | --- |
| sem resposta, ou as existentes estão erradas | responder |
| já tem resposta certa e concordamos com ela | upvote, e nada mais |
| resposta certa mas incompleta | upvote + comentário com o que falta |
| falta repro, é opinativa, duplicata, ou não dá pra validar | passar |

Uma resposta nova só se justifica quando seria a melhor da página. Empatar com o que já existe polui a pergunta e rende downvote — o que, convenhamos, seria irônico.

```
npm run feed -- --tags node.js,php,python --hours 96
npm run question -- <id>
   ↓ decidir o caminho
   ↓ testar o código de verdade
   ↓ drafts/<id>/answer.md
npm run publish -- <id> --preview      # lint anti-LLM + render pelo próprio SO
   ↓ aprovação humana explícita
npm run publish -- <id> --yes
```

## O trabalho que ninguém pediu

Dois exemplos reais, porque a piada só funciona se o trabalho embaixo dela for sério.

**Por que um `CAST()` deixava uma query do MariaDB 100x mais rápida.** A resposta aceita dizia que era character set do servidor. O autor da pergunta testou e não era. Então: subimos MariaDB 11.8 num container, recriamos a tabela de 100 mil linhas, rodamos `EXPLAIN` com e sem `CAST`, e descobrimos que o culpado não era o `CAST` — era o `?`. Um único placeholder de prepared statement já impede o otimizador de empurrar a condição pra dentro da view materializada. Confirmado desligando `condition_pushdown_for_derived` e vendo as duas versões ficarem igualmente lentas.

**Se `atexit` serve pra fechar conexão de banco num WSGI.** Não serve. Mandamos `SIGTERM` num processo Python de verdade pra ver. `atexit` roda no Ctrl+C e não roda no `SIGTERM` — que é exatamente o sinal que o Apache usa pra parar um worker.

Nos dois casos, o tempo de investigação passou do tempo que o autor gastou escrevendo a pergunta. Alguém vai copiar o bloco de código sem ler o parágrafo que explica o porquê. Está tudo bem.

## O que ele não faz

Esta parte não é sátira.

- **Não publica sozinho.** Cada rascunho precisa de aprovação explícita, e a aprovação vale só pra aquele texto. Mudou o texto, pede de novo.
- **Não contorna o lint.** `src/lint.js` detecta cheiro de LLM — preâmbulo, simetria, hedge, bullet com negrito na frente. Bloqueio significa reescrever, não forçar.
- **Não faz retry** depois de erro de rate limit ou de qualidade da API. Para e relata.
- **Não posta o que não foi testado.** Se dava pra rodar e não rodou, isso é dito em voz alta.
- **Não inventa experiência.** Nada de "já passei por isso em produção". O que dá naturalidade é dizer o que foi testado agora e ter opinião.

> Se uma resposta só existe porque a API conseguiu postar, ela não deveria existir.
> — `kb/so-rules.md`

## Instalação

```bash
npm install
cp .env.example .env     # SO_CLIENT_ID, SO_KEY, SO_SITE, SO_REDIRECT_URI
npm run auth             # OAuth implicit, scope write_access,no_expiry
npm run me               # confere token e reputação
```

Escrita pela API exige app registrado com post publicado no Stack Apps. Todo post criado por ela sai com link para esse registro — é público e proposital.

## Comandos

```bash
npm run feed -- --tags node.js,php,python --hours 96   # triagem com classificação de cobertura
npm run question -- <id>                               # pergunta, comentários e respostas existentes
npm run publish -- <id> --preview                      # lint + render, sem publicar
npm run publish -- <id> --yes                          # publica (após aprovação)
npm run edit -- <answer_id> --yes --comment "resumo"   # edita resposta publicada
npm run comment -- <post_id> --yes --body "texto"      # comenta (50 rep)
npm run vote -- <answer_id> --yes                      # upvote (15 rep)
npm run timeline                                       # histórico com score atual
```

## Estrutura

```
src/auth.js       OAuth implicit, salva token
src/client.js     cliente REST 2.3, backoff, filtros
src/feed.js       triagem, marca cada pergunta como LIVRE / FRACA / COBERTA
src/question.js   pergunta + respostas + comentários em markdown
src/lint.js       detector de cheiro de LLM
src/publish.js    render, checagens e POST answers/add
src/edit.js       edita resposta já publicada
src/comment.js    comenta em pergunta ou resposta
src/vote.js       upvote e undo
src/timeline.js   histórico com score atual, gera TIMELINE.md
kb/               voz, regras do SO, padrões por linguagem
drafts/<id>/      question.md, answer.md, posted.json
answers.jsonl     registro append-only do que foi publicado
```

Node 20+, sem dependências de runtime. Roda local.

## Licença

MIT.

---

Nenhum desenvolvedor da década passada foi consultado durante a escrita deste README.
