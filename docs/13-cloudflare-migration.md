# Migração de produção — Vercel para Cloudflare

Autorizada pelo operador em 17/10/2026: substituir a hospedagem Vercel pela Cloudflare.

## Recursos criados e publicação

- Conta Cloudflare autenticada e confirmada pelo Wrangler.
- Worker `unstuck-n8n-waitlist`, frontend e API na mesma origem.
- URL: https://unstuck-n8n-waitlist.unstuck-n8n-waitlist.workers.dev/
- D1 `unstuck-waitlist`, ID `56a01069-a257-466e-a4b3-2fcc94936b73`, região ENAM. Migração 0001 aplicada com sucesso. Consulta remota inicial confirmou zero registros.
- Widget Turnstile Managed `unstuck-waitlist`, restrito ao hostname exato de produção. Secret gravada diretamente no Worker por stdin, sem exibição nem arquivo versionado. Sitekey pública em `public/config.js`.
- `TURNSTILE_HOSTNAMES` contém somente o hostname de produção. Sem localhost.
- Contato público informado pelo operador: robsonldasilva72@gmail.com, também disponível no HTML da privacidade sem depender de JavaScript.
- Canonical/OG atualizados para a nova origem; testes correspondentes atualizados.
- Versão Cloudflare completa publicada: `be89803c-c970-439c-b20a-a4e4d4889b27`. A consulta de deployments confirmou sua ativação a 100%.

## Verificação e limites

- 19 testes passando após as alterações.
- Worker e D1 publicados com sucesso pela API de gerenciamento; isso não prova disponibilidade HTTPS para visitantes.
- URL pública inicialmente falhou no handshake TLS no Node, curl e navegador (`ERR_SSL_VERSION_OR_CIPHER_MISMATCH`). O subdomínio workers.dev foi registrado durante o primeiro deploy. A causa pode ser emissão/propagação do certificado, mas não foi confirmada pelo status de um certificado. Não desabilitar validação TLS nem contornar intersticiais do navegador.
- Nenhum cadastro real foi enviado; E2E de cadastro, duplicidade, replay e atualização de perfil permanece pendente de HTTPS e widget funcionando no navegador.
- Na verificação posterior, HTTPS passou a funcionar sem nenhuma flexibilização de TLS: landing e privacidade 200 com CSP e canonical Cloudflare; GET da API 405; captcha inválido 403 `captcha`; origem externa no perfil 403 `origin`. Widget carregou seu iframe no navegador; foram observadas mensagens de console originadas da própria challenge Cloudflare. Não foi resolvido CAPTCHA pelo agente.
- Texto de privacidade continua marcado como draft; contato preenchido não constitui revisão jurídica. Retenção/exclusão, rate limiting e verificação de email continuam pendentes antes da divulgação pública.

## Vercel e conclusão da troca

A API de rotas do projeto Vercel retornou 403 de autorização de escopo. Não foram alteradas permissões nem extraídas credenciais para contornar isso. O projeto antigo não foi apagado ou pausado.

`vercel.json` prepara um redirecionamento 308, preservando o caminho, da publicação Vercel para a Cloudflare. Ele só deve chegar à produção Vercel depois de a URL Cloudflare passar nos testes públicos. Enquanto estiver apenas na branch de migração, a main/Vercel antiga permanece como retorno.

Checklist de migração:

1. HTTPS e respostas 200 com CSP: verificados na landing e privacidade.
2. GET `/api/subscribe` retorna 405 JSON: verificado.
3. Origem externa em perfil e token inválido no subscribe retornam 403: verificados.
4. Teste com token fresco e email controlado para 201/persistência, duplicate 200 e replay 403: pendente; interação CAPTCHA fica com o operador quando solicitada. Não divulgar a captação antes desse teste e dos demais requisitos de lançamento.
5. Integrar a branch de migração para que o Git deploy da Vercel ative o redirecionamento; confirmar o 308 e a chegada à Cloudflare. Não apagar a Vercel: mantê-la somente para o redirecionamento evita quebrar links já compartilhados.

Não houve migração de registros: a Vercel anterior não tinha API funcional e o D1 criado começou vazio. Não foi adquirido ou configurado domínio próprio. O plano de staging permanece disponível separadamente e nenhum recurso staging foi criado.
