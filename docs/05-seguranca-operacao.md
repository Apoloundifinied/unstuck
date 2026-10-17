# 05 — Segurança, privacidade e operação

## Bloqueios absolutos de deploy
1. Revogar/rotacionar qualquer credencial presente no RAR de origem; **nenhum arquivo `.env.local`, `credentials.json`, tokens ou dumps reais deve ser exportado**.
2. Configurar `database_id` do D1 e rodar migrações, confirmar variáveis reais do Turnstile.
3. Informar o email real do operador em `public/config.js`; revisar política com responsabilidades, controlador, retenção, direito de excluir e transferências.
4. Fazer testes de ponta a ponta em deploy de teste. Testes simulados não validam Turnstile em domínio real.
5. Confirmar os limites da hospedagem gratuita e ajustar políticas antes de uso comercial.

## Controles implementados
- Validação de método, JSON e máximo de corpo; email normalizado; papéis enumerados.
- Restrição por Origin em navegadores e Turnstile server-side, honeypot simples.
- Token de edição randômico de 256 bits (armazenado somente hash); opcional passo 2 limitado por enum e tamanho.
- SQL parametrizado, constraint única email+papel, logs de erro sem PII.
- CSP restritiva, `nosniff`, `X-Frame-Options` e `Referrer-Policy` na resposta estática.
- O site não permite upload de workflows, links executáveis, acesso a contas n8n ou execução de código.

## Riscos residuais
- Não há rate limit IP/conta customizado; configurar regras de WAF/rate limiting conforme cotas e plano. Turnstile isolado não resolve abuso sofisticado.
- Sem verificação de email: números da waitlist podem ter endereços inválidos ou de terceiros. Antes de enviar mensagens, verificar titularidade/consentimento usando mecanismo opt-in.
- Recuperação da etapa 2 depende de `sessionStorage`; perder o token não permite edição sem suporte.
- D1 mantém email até exclusão. Criar runbook de atendimento e rotina de expurgo por data.
- Campos livres podem receber dados pessoais/segredos apesar do aviso. Criar revisão e expurgo se houver relatos.
- Tokens ou IDs expostos por XSS são risco: não exibir HTML de campos controlados por usuário, CSP e evitar scripts terceiros.

## Checklist funcional
- [ ] Novo comprador e novo especialista são gravados.
- [ ] Mesmo email + papel retorna duplicate (não cria registro adicional).
- [ ] Mesmo email em papéis distintos funciona.
- [ ] Null/arrays/JSON inválido não causam falha não tratada.
- [ ] Captcha ausente/inválido retorna erro; sem config falha fechado.
- [ ] Token incorreto não altera perfil; campos inválidos não são aceitos.
- [ ] Layout 360, 768 e 1280 px; teclado e leitor de tela; reduced motion.
- [ ] Remover dados sob solicitação mediante verificação do titular.
- [ ] Configurar backups/exportações permitidas para evitar perda de leads.

## Processo de exclusão
Receber pedido por email, verificar titularidade do endereço, executar remoção via D1 com permissão de operador (`DELETE FROM waitlist WHERE email = ?`) e confirmar sem compartilhar dados de terceiros. Documentar o processo antes do primeiro cadastro público.
