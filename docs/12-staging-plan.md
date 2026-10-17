# Staging Cloudflare — pacote preparado, publicação pendente

## Alvos propostos

- Conta: a única conta retornada pelo Wrangler autenticado; confirmar o nome no terminal antes de qualquer criação.
- Worker: `unstuck-n8n-waitlist-staging`, com frontend e API na mesma origem `workers.dev`.
- D1: `unstuck-waitlist-staging`, novo e separado de produção.
- Turnstile Managed: `unstuck-waitlist-staging`, restrito ao hostname exato do Worker de staging.
- Configuração: `wrangler.staging.toml`, independente de `wrangler.toml`.

O operador concluiu o login e a autenticação foi confirmada. A listagem D1 da conta estava vazia. Nenhum recurso remoto foi criado nesta preparação.

## Preparação local

Copiar o conteúdo de `public/` para `.wrangler/staging/public/`. Essa cópia é ignorada pelo Git; configurar nela somente a sitekey pública de staging. Não alterar o frontend da Vercel para usar um backend de outra origem. Refazer a cópia quando o frontend mudar e reaplicar a configuração pública de staging.

```powershell
New-Item -ItemType Directory -Force .wrangler/staging/public | Out-Null
Copy-Item -Path public/* -Destination .wrangler/staging/public -Recurse -Force
npx wrangler deploy --config wrangler.staging.toml --dry-run --outdir .wrangler/staging/bundle
```

O dry-run compila sem upload; não prova conexão com D1 ou validação Turnstile. Configuração incompleta mantém o cadastro bloqueado. Não executar deploy real com os placeholders.

Verificação em 17/10/2026: dry-run concluído com sucesso pelo Wrangler 4.151.1, 27 arquivos estáticos lidos e bundle de 8,31 KiB (2,88 KiB gzip), sem upload. A configuração de produção e os arquivos públicos originais não foram alterados.

## Execução remota após autorização dos alvos

1. Criar o D1 proposto e preencher somente seu ID em `wrangler.staging.toml`.
2. Aplicar `0001_waitlist.sql` usando explicitamente a configuração e o banco de staging.
3. Publicar o Worker de staging inicialmente fail-closed para obter a URL exata; confirmar que nenhuma rota de domínio próprio ou Vercel foi alterada.
4. Criar o widget Managed para esse hostname. Gravar a secret diretamente no gerenciamento de secrets do Worker, sem exibi-la em chat/logs nem colocá-la em argumentos ou arquivos versionados. Configurar a sitekey pública somente na cópia de assets de staging e o hostname em `TURNSTILE_HOSTNAMES`.
5. Publicar a configuração completa; verificar CSP e mesma origem da API.
6. Testar 201 com email controlado, persistência no D1, duplicidade com token novo, replay 403, perfis buyer/expert e origem divergente 403. Não usar dados de terceiros. O fluxo de CAPTCHA pode exigir interação do operador no navegador.

Staging não é liberação para captação pública: contato real, privacidade revisada, exclusão/retenção e rate limiting continuam pendentes. Não anunciar a URL de staging. Após os testes, decidir sobre manter ou remover os registros de teste e os recursos; não apagar recursos sem autorização.

## Limite da autorização atual

Login e inspeção foram concluídos. Criação de Worker/D1/widget, migração remota e publicação serão executadas somente após confirmação desses alvos e efeitos. Nenhuma mudança na produção Vercel é necessária para este staging.
