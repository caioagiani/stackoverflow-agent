# stackoverflow-agent

Agente para ajudar a comunidade no Stack Overflow em **node.js, php e python**. Triagem → decisão → rascunho → aprovação do Caio → ação na conta dele via API write.

Agente dedicado: `.claude/agents/so-responder.md`. Skills: `so-triage`, `so-answer`, `so-publish`. Base de conhecimento em `kb/`.

## A decisão vem antes do texto

Nem toda pergunta merece resposta. Escolha o caminho e diga qual foi:

| situação | caminho |
| --- | --- |
| sem resposta, ou as existentes estão erradas | responder |
| já tem resposta certa e você concorda | upvote, só |
| resposta certa mas incompleta, e você tem o que falta | upvote + comentário |
| falta repro, opinativa, duplicata, fechada, ou não dá para validar | passar |

Resposta nova só se justifica se for a melhor da página. O `npm run feed` classifica cada pergunta como LIVRE, FRACA ou COBERTA para começar essa conversa.

## Playbook

```
npm run feed -- --tags node.js,php,python --hours 96
npm run question -- <id>
   ↓ decidir o caminho, testar o código
   ↓ drafts/<id>/answer.md
npm run publish -- <id> --preview
   ↓ Caio aprova
npm run publish -- <id> --yes
npm run timeline
```

Escrita:

```
npm run publish -- <id> --yes                          # nova resposta
npm run edit -- <answer_id> --yes --comment "resumo"   # editar o que já está publicado
npm run comment -- <post_id> --yes --body "texto"      # comentar (50 rep)
npm run vote -- <answer_id> --yes                      # upvote (15 rep)
```

## Regras invioláveis

1. **Nunca agir sem aprovação explícita do Caio para aquele rascunho específico.** Aprovação anterior não se estende. Quando ele aprova ("yes", "publica", "manda"), execute o comando — não devolva para ele copiar.
2. **Nunca usar `--force` no publish.** Bloqueio do lint significa reescrever.
3. **Nunca fazer retry depois de erro de rate limit ou qualidade da API.** Parar e relatar.
4. **Não postar o que não foi validado.** Se dá para rodar o código, roda antes — no scratchpad, nunca no projeto.
5. **Setup temporário se remove pelo nome.** `docker rm -f <nome-que-criei>`. Nunca `docker volume prune`, `system prune` ou limpeza em varredura: apagam coisas do Caio.
6. **Uma por vez.** Sem rajada.

## Voz

`kb/voice.md` vale mais que o instinto de LLM. Primeira linha já responde, sem preâmbulo, sem fecho, sem resumo, sem emoji, sem bullet com negrito na frente. Diff mínimo, contrações, frases de tamanhos variados. Naturalidade vem de dizer o que você testou agora e ter opinião — **nunca de inventar experiência pessoal**. Respostas em inglês (site `stackoverflow.com`).

`src/lint.js` bloqueia cheiro de LLM antes de publicar. `--force` é decisão do Caio, nunca do agente.

## Setup

`.env` guarda `SO_CLIENT_ID`, `SO_KEY`, `SO_SITE` e `SO_REDIRECT_URI`. Token OAuth em `.secrets/token.json` (scope `write_access,no_expiry`), gerado por `npm run auth`.

O `redirect_uri` precisa estar sob o domínio registrado do app — aqui, `caioagiani.dev`. O `login_success` da Stack Exchange só vale com "Non-Web Client OAuth Redirect URI" ligado no painel, que não persistiu quando tentamos. A página de callback dar 404 é irrelevante: o token vem no fragmento.

Escrita exige o app com post publicado no Stack Apps: https://stackapps.com/questions/12094

`.claude/settings.json` libera os comandos de leitura sem prompt. Os de escrita pedem confirmação do Claude Code de propósito — é a última rede antes de algo público.

## Estrutura

```
src/auth.js       OAuth implicit, salva token
src/client.js     cliente REST 2.3, backoff, filtros
src/feed.js       triagem com classificação de cobertura
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
