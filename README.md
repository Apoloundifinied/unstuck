# Unstuck — n8n Services Waitlist (MVP 0)

Projeto derivado da **waitlist Unstuck/B2B.rar**. Reaproveita identidade, CSS, logo, formulário de duas etapas, fluxo de consentimento e lógica anti-bot; substitui foco, textos, pesquisa de mercado e persistência.

**Este é um piloto de pesquisa de mercado, não um marketplace funcional.** Não há autenticação, transações, chat, perfis públicos nem emprego garantido. O produto não executa n8n nem recebe tokens de workflows.

## Stack de produção

- **Cloudflare Workers** (roteador/API) e **Static Assets** (landing HTML/CSS/JS).
- **Cloudflare D1** (SQLite gerenciado com armazenamento persistente), em vez de `bun:sqlite` efêmero em serverless.
- **Cloudflare Turnstile**, honeypot, validação de entrada e token de edição com hash SHA-256.
- Sem React, frameworks de backend, ferramentas pagas ou dependência de LLM.
- **Bun** pode ser usado para instalar/executar scripts de desenvolvimento, mas o runtime de produção é Workers, não `Bun.serve`.

## Primeiro uso

1. Instale Node.js 20+ (ou Bun para package management). Execute `npm install`.
2. Crie um banco D1: `npx wrangler d1 create unstuck-waitlist`. **Substitua** `COLE_O_DATABASE_ID_D1_AQUI` em `wrangler.toml` pelo ID retornado.
3. Execute `npm run db:local` e `npm run db:remote` (após confirmar banco e conta).
4. No painel Cloudflare, crie um widget Turnstile gerenciado para os domínios aprovados (produção e localhost/127.0.0.1). Coloque apenas a **site key pública** em `public/config.js`. O campo `action` usado no widget e servidor é `waitlist_signup`.
5. Armazene a secret key privada no Worker como `TURNSTILE_SECRET` (por exemplo, `wrangler secret put TURNSTILE_SECRET` usando o executável autenticado e Worker corretos). Configure `TURNSTILE_HOSTNAMES` com somente os hostnames de produção autorizados, sem `localhost`. Para testes locais, use `.dev.vars`, com chave de TESTE e `TURNSTILE_HOSTNAMES=localhost,127.0.0.1`. Consulte `docs/09-turnstile-spin.md` para a configuração segura e checklist.
6. Configure um email de contato real em `public/config.js` (`CONTACT_EMAIL`), revise a política de privacidade e verifique se está de acordo com sua situação jurídica.
7. `npm run dev` para prévia local ou `npm run deploy` após validar os requisitos de privacidade e os termos da hospedagem.
8. Rode `npm test` antes de publicar. Testes usam banco simulado, não acessam a Cloudflare.

**Atenção:** `npm run db:remote` modifica o banco D1 remoto e `npm run deploy` publica a aplicação. Não execute sem aprovação. Nenhuma conta foi criada e nenhum deploy foi realizado neste pacote.

## Antes de publicar

- [ ] Revogar/rotacionar credenciais presentes no RAR original (não foram copiadas).
- [ ] D1 ID real; migrações aplicadas; Turnstile público/privado configurados.
- [ ] Contato real e política revisada; pedido de exclusão e envio de e-mail viáveis.
- [ ] Testes e QA mobile, acessibilidade, duplicidade, anti-bot, erros de rede.
- [ ] Verificar quais subreddits permitem divulgação e obter permissão quando necessário.
- [ ] Nada de claims de clientes, ratings ou resultados fictícios apresentados como reais.

## Arquivos

- `docs/00-visao.md`: posicionamento, oferta/demanda, diferencial.
- `docs/01-mercado.md`: pesquisa, concorrência e hipóteses.
- `docs/02-mvp.md`: escopo, dados e critérios de aceite.
- `docs/03-arquitetura.md`: decisões técnicas e alternativas.
- `docs/04-lancamento-reddit.md`: validação e distribuição.
- `docs/05-seguranca-operacao.md`: segurança, LGPD e checklist.
- `docs/06-monetizacao-e-gates.md`: preço, sinais e critérios de interrupção.
- `docs/07-prd-marketplace-futuro.md`: telas, entidades e fluxo do marketplace posterior, ainda NÃO implementado.
- `migrations/0001_waitlist.sql`: banco D1.
- `src/worker.js`: API (`POST /api/subscribe`, `POST /api/profile`).
- `public/`: landing e política em inglês.
- `tests/`: testes de contratos básicos.

Fonte de mercado consultada em 16/10/2026. As citações completas estão em `docs/01-mercado.md`.

## 2026-10-16 — Studio redesign

The public homepage was redesigned around a warm editorial identity, a gently animated 3D-style workflow illustration, an interactive request explorer (three selectable scenarios), and an honest sample directory. The two-step buyer/expert waitlist and Cloudflare Worker/D1 APIs are preserved.

- Design system and Reddit-first rationale: `docs/08-brand-and-ux.md`.
- For **frontend-only preview**, run `python -m http.server 8080 --directory public` then open `http://localhost:8080` (no Wrangler required).
- For working registration, configure D1 and Turnstile as described above and start the Worker locally or deploy after testing. Without Turnstile configured, registration correctly reports a configuration error.
- The concept interactions do not match buyers with real specialists. No fake profiles, ratings or prices are presented as real.

## Turnstile Spin — integração preparada, conta pendente

O frontend e o Worker foram alinhados ao contrato Spin: ação `waitlist_signup`, validação por hostname exato, token de até 2048 caracteres, validação canônica no backend e rejeição de erro/replay (testada por simulação). Não foi criado widget na conta Cloudflare, nem recuperado/gravadado qualquer segredo real, e nenhuma integração real foi executada por falta de credenciais e hostname de produção confirmado. Consulte `docs/09-turnstile-spin.md` antes de ativar.

## Hardening ? Sess?o 2 (2026-10-17)

- Fontes WOFF2 servidas em `public/fonts/`, com licen?as e hashes de proced?ncia; landing e privacidade dispensam Google Fonts em runtime.
- CSS da privacidade extra?do para `public/privacy.css`, compat?vel com `style-src 'self'`.
- `run_worker_first = true` garante a aplica??o dos cabe?alhos do Worker tamb?m aos assets. Isso faz cada pedido de asset invocar o Worker e consumir a quota correspondente; considerar antes de publicar. Refer?ncia: https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- Copie `.dev.vars.example` para `.dev.vars` e preencha somente com a secret de teste local. O exemplo ? rastre?vel; arquivos privados continuam ignorados.
- `npm test` executa os contratos de API, CSP/cabe?alhos, roteamento de assets, fontes e gitignore, sem instalar depend?ncias nem acessar servi?os externos. Exige Node 20+ e Git.
- Pr?via est?tica n?o aplica cabe?alhos do Worker. Valida??o real de CSP e Turnstile requer Wrangler em ambiente compat?vel (WSL2/Linux se o workerd falhar no Windows), D1 e widget de teste; n?o substitua por chave de produ??o.
