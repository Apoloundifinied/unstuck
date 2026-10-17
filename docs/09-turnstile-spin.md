# Cloudflare Turnstile Spin — Unstuck

## Estado

- [x] Código analisado: site vanilla HTML, cliente em `public/app.js`, API em `src/worker.js`.
- [x] Superfície escolhida: **apenas waitlist**, `#waitlist-form` → `POST /api/subscribe`. A etapa opcional `POST /api/profile` usa um token de edição gerado após a inscrição; não cria uma segunda challenge.
- [x] `action` estável em ambos os lados: `waitlist_signup`.
- [x] Backend faz POST para `https://challenges.cloudflare.com/turnstile/v0/siteverify`, com `secret`, `response` e `remoteip` quando disponível.
- [x] Falha fechada se `success !== true`, ação ou hostname diferir, token vazio ou maior que 2048 caracteres, hostname de deployment não permitido, ou problema de rede.
- [x] Testes unitários com API simulada: caminho válido, replay, token faltante ou excessivo, hostname/ação incorretos, erro de rede, configuração incompleta.
- [ ] Criar/selecionar widget na conta Cloudflare e configurar credenciais reais (pendente de autenticação e domínio aprovado).
- [ ] Verificar widget/sitekey/domínios reais no Cloudflare.
- [ ] Testar um token fresco no navegador contra a API real e confirmar que o replay falha.
- [ ] Validar a instância de produção; nenhuma publicação realizada.

## Configuração para o usuário (não inserir segredo no chat)

1. Confirme o domínio definitivo de lançamento. Um widget gerenciado pode conter o domínio, `localhost` e `127.0.0.1`; NÃO coloque os hostnames locais no allowlist **do Worker de produção**.
2. Em **Cloudflare Dashboard > Turnstile > Set up with Spin**, crie o widget `unstuck-waitlist` em modo Managed, ou, com Wrangler autenticado, use `wrangler turnstile widget create unstuck-waitlist --domain SEU_DOMINIO --domain localhost --domain 127.0.0.1 --mode managed`. Não copie segredos para tickets, logs ou chat.
3. Copie a **sitekey pública** para `public/config.js`: `TURNSTILE_SITE_KEY: 'SITEKEY_PUBLICA'`. A chave pública pode estar no repositório.
4. Grave a secret privada por meio do gerenciamento de secrets do Worker já existente, usando binding `TURNSTILE_SECRET` (não o antigo `TURNSTILE_SECRET_KEY`). Confirme conta, Worker e ambiente antes de executar comandos de escrita. Evite colocar valor secreto em argumentos de comando.
5. Configure a variável não secreta `TURNSTILE_HOSTNAMES` na configuração de produção, com a lista exata de hostnames servidos pelo frontend (`unstuck.exemplo.com` ou domínio Workers real), separados por vírgula. Use **somente** nomes de produção.
6. Para executar localmente, copie `.dev.vars.example` para `.dev.vars` e configure a chave de teste. No frontend use a sitekey de teste correspondente. Localmente `TURNSTILE_HOSTNAMES=localhost,127.0.0.1`. Para o hostname `localhost`, abra a página via `http://localhost:8787`, não `file://`.
7. Execute `npm test` (simulado), rode `npm run db:local`, inicie `npm run dev` e envie inscrição válida com token fresco. Reenvie o **mesmo token** e confirme que o segundo envio é bloqueado com `captcha`.
8. Se o Wrangler falhar com erro nativo `miniflare-email-store` no Windows, isso é um problema do runtime local; o frontend pode ser visualizado por HTTP estático, mas isso **não valida** o Turnstile end-to-end. Use ambiente Linux/WSL2 ou Worker confirmado para validar a API real.

## Comportamento

- **Endpoint protegido**: `POST /api/subscribe`.
- **Widget**: renderização explícita Turnstile via script oficial; ação `waitlist_signup`.
- **Backend**: validação por `success`, `action`, `hostname` exato e lista permitida; falhas retornam `403 {ok:false,error:'captcha'}`.
- **Siteverify**: token de uso único, expira em cinco minutos (gerenciado pela Cloudflare).
- **Etapa de perfil**: token opaco de edição com hash e associação à inscrição já validada.

Fontes: https://developers.cloudflare.com/turnstile/spin/ e https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
