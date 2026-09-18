# Regras do jogo no Stack Overflow

O que faz uma resposta ser votada, ignorada ou apagada. Ler antes de rascunhar.

---

## A pergunta já tem resposta boa

Esse é o caso mais comum e o mais fácil de errar. Mais uma resposta dizendo a mesma coisa não ajuda ninguém: divide os votos, empurra a página para baixo e costuma levar downvote.

Como decidir:

- **Tem resposta aceita e correta** → não responda. Se ela te ensinou algo, dê upvote e siga.
- **Tem resposta com +2 ou mais, correta** → não responda. Upvote.
- **A resposta certa está incompleta e você tem o que falta** → upvote nela **e** comente o complemento. O crédito continua sendo de quem chegou primeiro, e a informação fica no lugar certo.
- **A resposta aceita está errada, ou quebrou numa versão nova** → aí sim vale resposta nova, dizendo claramente o que mudou. Não ataque o autor da outra.
- **Só respostas com 0 ou negativo, nenhuma resolve** → responda.

O complemento vira comentário, não resposta. Se o complemento for grande demais para 600 caracteres e mudar a solução de fato, então era resposta — mas confira de novo se não é só entusiasmo.

Upvote exige 15 de reputação, comentário exige 50.

---

## Quando NÃO responder

Vale mais deixar passar do que postar lixo. Pule a pergunta se:

- **Falta informação essencial.** Sem o erro real, sem o código, sem a versão. Isso é comentário, não resposta.
- **É duplicata clara.** A resposta certa é votar para fechar apontando a original. Postar de novo fragmenta o conteúdo e costuma levar downvote.
- **É opinativa.** "Qual framework é melhor", "recomende uma biblioteca". Fecha como opinion-based.
- **Pede que façam o trabalho.** Dump de requisito de tarefa sem tentativa.
- **Está fechada.** O `publish.js` bloqueia isso sozinho, mas cheque antes de gastar tempo.
- **Você não sabe validar a resposta.** Se não dá para testar nem tem certeza, não poste. Errar no SO custa reputação e, pior, engana quem chega pelo Google depois.
- **Já tem resposta aceita e correta.** Só vale postar se você acrescenta algo de fato diferente (caso que a aceita não cobre, API que mudou de versão).

## Quando vale responder

- Erro específico com mensagem e código presentes.
- Pergunta com 0-2 respostas, criada nas últimas horas, com views subindo.
- Assunto onde você consegue rodar o código e confirmar.
- Resposta aceita antiga que quebrou em versão nova — vale resposta nova dizendo o que mudou.

---

## Formatação

- Cerca de código com a linguagem: ` ```js `, ` ```php `, ` ```python `.
- Mensagem de erro em bloco de código, não em citação nem em itálico.
- Nomes de arquivo, flags e funções em `crase`.
- Sem screenshot de código, nunca.
- Link direto pra doc oficial na linha em que ele importa, não uma lista de links no fim.
- Se copiou trecho de outra fonte, cite e linke. Conteúdo do SO é CC BY-SA; copiar sem atribuir é motivo de remoção.

---

## Política de conteúdo gerado por IA

O SO restringe conteúdo gerado por IA, e a aplicação é feita por moderadores humanos e por heurística. O que mantém isso seguro e honesto:

1. **Você lê e valida toda resposta antes de publicar.** O agente rascunha; quem assina é você.
2. **Não publique o que você não conseguiria defender num comentário de follow-up.** Se alguém perguntar "por que não usar X?", você precisa saber responder.
3. **Volume baixo.** Respostas esparsas e boas. Rajada de respostas em minutos é o padrão que dispara revisão.
4. **Todo post criado pela API write sai com link para o post do app no Stack Apps.** Isso é público e proposital — é o canal declarado. Não tente contornar.

Se uma resposta só existe porque a API conseguiu postar, ela não deveria existir.

---

## Limites técnicos de escrita

- Corpo mínimo aceito pela API: 30 caracteres.
- A API roda as mesmas checagens de qualidade do site. Se o site mostraria CAPTCHA ou aviso de "low quality", a chamada falha.
- Existe rate limit de escrita por usuário. Se der erro de velocidade, **pare** — não faça retry em loop. Isso é o comportamento que o SO classifica como abuso.
- `answers/render` valida e renderiza sem publicar. Use sempre antes.
- Escrita exige token com scope `write_access` e app com post registrado no Stack Apps.

---

## Depois de publicar

- Volte nos comentários. Pergunta de follow-up sem resposta é o que transforma uma boa resposta em downvote.
- Se estiver errado, edite ou apague. Editar é normal e esperado.
- Não peça upvote, não peça aceite.
