# 02 — Escopo do MVP e critérios de aceite

## MVP 0: waitlist pública funcional (entregue no pacote)
- Landing em inglês, mobile-first, visual e marca reaproveitados do `B2B.rar`.
- Cadastro rápido com papel `buyer`/`expert`, email, consentimento explícito, proteção Turnstile e honeypot.
- Dados opcionais após confirmação, adequados ao papel.
- UTM e referrer para atribuição básica, e link de compartilhamento.
- Dedupe por email+papel, banco persistente D1, status de sucesso e privacidade acessível.
- Não publicar métricas de usuários nem perfis fictícios. Conteúdo demonstrativo rotulado.

## Dados do comprador
Serviço, integração, orçamento em USD (faixa), horizonte temporal, descrição não sensível (500 caracteres). **Nunca** API keys, workflow JSON, credenciais, datasets de clientes.

## Dados do especialista
Serviço, integração, link HTTPS para portfólio, disponibilidade, faixa de preço ou valor por projeto. Não declarar expertise verificada antes de validação humana.

## Não implementar nesta fase
Login, chat, pagamento, escrow, avaliações, feed de pedidos público, busca em tempo real, scraping de Reddit, execução de workflows, API n8n, SSE, heartbeat, dashboard de 30 agentes, WebSocket, exe Windows, assinatura R$9.

## MVP 1 (somente depois do gate comercial)
- Diretório pesquisável de especialistas que optaram por tornar informações públicas.
- Página de profissional com provas verificáveis, serviços, disponibilidade e integração.
- Pedido estruturado e filtro por orçamento, prazo, integração e tarefa.
- Contato explícito; limite de candidatos por demanda para evitar corrida ao menor preço.
- Moderação e denúncia; provas de trabalho reais; proteção contra anúncios enganosos.

## Contratos de API do MVP 0
`POST /api/subscribe` JSON `{email, role, consent:true, website:'', turnstileToken, utm_source?, utm_medium?, utm_campaign?, referrer?}`. Sucesso novo: 201 `{ok:true,id,token}`. Repetido: 200 `{ok:true,duplicate:true}`. Sem captcha: 400. Não configurado: 503.

`POST /api/profile` JSON `{id,token, service?,integration?,budget?,timeline?,context_note?,proof_url?,availability?,rate?}`; campos validados pelo papel armazenado. Sucesso 200 `{ok:true}`; 403 em token inválido. Etapa opcional, sem login; token aleatório armazenado só como hash.

## Critérios de aceite técnico
- Nenhum email salvo sem consentimento e captcha válido.
- Testes negativos para body inválido, origin inválida, duplicidade e token inválido.
- Privacidade/contato reais e processo de remoção antes do deploy público.
- Prevenir publicação acidental de segredos/credenciais; manter logs sem PII.
- Executar testes manuais mobile, teclado, captchas e deploy real.
