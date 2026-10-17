# Hardening — QA local em 17/10/2026

Base: d42790c. Implementação: 4869220, branch `hardening/session-2`.

## Ambiente e desbloqueio do runtime

Node 24.21.0, dependências instaladas com `npm ci`, Wrangler 4.151.1 e workerd 1.20261012.1. Sem alteração do lockfile.

O runtime inicialmente falhou com `CreateDirectory: #5 Acesso negado.; path = miniflare-email-store`. Foi possível iniciá-lo no Windows usando uma pasta temporária dentro do projeto. No PowerShell, a partir da raiz do clone:

```powershell
New-Item -ItemType Directory -Force .wrangler/tmp | Out-Null
$env:TEMP = (Resolve-Path .wrangler/tmp).Path
$env:TMP = $env:TEMP
$env:WRANGLER_SEND_METRICS = 'false'
npm.cmd run dev -- --local --ip 127.0.0.1 --port 8787
```

As variáveis valem somente para o processo/sessão; `.wrangler/` permanece ignorado. Não foi necessário instalar WSL. O ambiente de execução do agente também precisou permitir a leitura da árvore do projeto para a compilação.

## Verificações realizadas

- 17/17 testes passando após instalar as dependências.
- HTTP real pelo Wrangler: landing, privacidade, CSS das fontes e CSS da privacidade retornaram 200 com CSP restritiva e X-Frame-Options DENY. Asset inexistente retornou 404 com os mesmos cabeçalhos; GET da API retornou 405 JSON.
- Navegador: landing inspecionada em larguras efetivas de conteúdo de 360, 768 e 1280 px, sem overflow horizontal nessas medições. A interface de viewport do navegador foi calibrada pela largura observada no DOM, pois a escala do navegador difere dos valores solicitados.
- Privacidade inspecionada em modo estreito e desktop; medição sem overflow horizontal em 360 e 768 px. CSS extraído aplicado (padding vertical de 65 px em modo estreito e 90 px no desktop).
- Tipografia renderizada e fontes locais solicitadas pelo navegador com respostas 200/304, incluindo DM Sans, DM Mono e Instrument Serif normal/itálico. Console sem erros ou avisos nas observações da landing e privacidade.
- Navegação por Tab mostrou foco visível no link da marca.
- Explorador: selecionar “Build from scratch” atualizou o título para “I need a working lead pipeline.”
- Formulário preenchido com endereço fictício `qa@example.com`: sem sitekey, exibiu “Registration is not configured yet. The site owner must set up Turnstile.” Não foi criado cadastro nem removida a proteção.
- Nenhuma mudança funcional necessária no hardening após esta verificação.

## Pendências explícitas

- A privacidade já tinha espaçamento horizontal reduzido/zero no corpo em modo estreito; a extração preservou as regras originais. Ajuste visual recomendado no PR 2.
- Reduced motion possui regras em CSS/JS, mas não foi exercitado com preferência do sistema nesta rodada. Não houve auditoria completa com leitor de tela ou zoom de 200%.
- D1 local não recebeu migração, e cadastro, duplicidade, replay e perfil continuam cobertos por simulações, sem E2E com Turnstile real.
- Sem deploy, alteração de banco remoto ou credenciais reais. A passagem de assets pelo Worker consome quota por pedido.
