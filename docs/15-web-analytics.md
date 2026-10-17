# Cloudflare Web Analytics — integração publicada

Data: 17/10/2026. Host alvo: `unstuck-n8n-waitlist.unstuck-n8n-waitlist.workers.dev`.

## Objetivo e implementação

Medir visitas, páginas vistas, referenciadores e desempenho no painel Cloudflare Web Analytics. Os números não equivalem a uma identificação exata de pessoas, e bloqueadores de conteúdo podem impedir beacons. Não há reconstrução de visitas anteriores à instalação. Web Analytics não oferece custom events nem registra query strings/UTMs segundo a documentação consultada.

`public/analytics.js` carrega o beacon oficial uma única vez, somente quando `WEB_ANALYTICS_TOKEN` contém um identificador público de site válido. O token deve ser gerado para o hostname exato no painel e inserido em `public/config.js`; não é API key nem secret do Turnstile. Nenhum email, resposta de formulário ou ID de inscrição é repassado pelo loader.

As duas páginas carregam o loader após a configuração pública. A CSP permite somente o arquivo `https://static.cloudflareinsights.com/beacon.min.js` adicional no script-src e o endpoint de origem `https://cloudflareinsights.com` no connect-src. Outras restrições, inclusive fontes locais e Turnstile, permanecem. O aviso de privacidade foi atualizado para descrever a análise agregada sem cookies de rastreamento.

## Estado e verificação

- 22 testes passaram: 19 anteriores mais token ausente/inválido, carregamento único e integração das duas páginas. Teste CSP atualizado para validar as exceções exatas.
- O operador forneceu o snippet público e seu identificador foi instalado em `WEB_ANALYTICS_TOKEN`.
- Publicado na Cloudflare em 17/10/2026, versão `5c5726d1-61ff-48c7-ad7e-a319a323f637`.
- Navegador de produção: loader presente e exatamente um script beacon com o token fornecido, tanto na landing como na privacidade. Navegação entre páginas executada para permitir o envio dos beacons de saída. Sem erros de console relacionados a cloudflareinsights, CSP ou CORS nas observações. Mensagens da challenge Turnstile são independentes e não foram apresentadas como falha do analytics.
- A recepção/agregação de números no painel ainda depende de confirmação do operador: não foi acessado um painel autenticado nem consultada a contagem.
- Wrangler autenticado não oferece comando Web Analytics; não foram extraídas suas credenciais nem ampliadas permissões para chamar APIs.
- Painel aberto em `https://dash.cloudflare.com/0f5d7a1f9de1123d487ec002a8e82664/web-analytics`. Ele solicitou login. Durante o login a aba foi para accounts.google.com e a revisão automática negou a leitura desse destino. Não foi tentado contorno. O operador deve concluir a autenticação e retornar ao painel Cloudflare para continuar.

## Conferência pelo operador

1. No painel Web Analytics da conta, selecionar o hostname exato do Unstuck.
2. Abrir o site em um navegador sem bloqueio do beacon e navegar para outra página, permitindo o envio das métricas finais.
3. Conferir no painel a recepção dos dados, considerando seu tempo de processamento. Não confundir o gráfico de requests do Worker (inclui CSS, scripts, fontes e bots) com visitas do Web Analytics.
4. Considerar que as visitas do próprio operador e do QA também podem aparecer. A coleta não recupera o histórico anterior à ativação.

## Fontes oficiais consultadas

- https://developers.cloudflare.com/web-analytics/faq/
- https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/
- https://developers.cloudflare.com/web-analytics/get-started/
