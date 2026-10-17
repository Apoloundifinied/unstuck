# 03 — Arquitetura, escolhas e diagrama

```text
Browser — Cloudflare Worker Static Assets (HTML/CSS/JS)
   ├── POST /api/subscribe
   │       ├── validação de origin/body/email/consent
   │       ├── honeypot e Turnstile (siteverify, server-side)
   │       ├── geração de token aleatório + SHA-256 hash
   │       └── D1: INSERT OR IGNORE (email, role) UNIQUE
   └── POST /api/profile
           ├── UUID + token da inscrição
           ├── consulta do hash no D1
           ├── validação whitelist por papel
           └── D1: UPDATE campos opcionais
```

## Escolha por fase

| Item mencionado no plano OXTY | Waitlist pública | Motivo |
|---|---|---|
| `Bun.serve` puro | Não na produção | Precisaria de host sempre online com armazenamento persistente. Pode servir ferramentas locais, não é requisito. |
| Elysia | Não | Duas rotas simples não justificam framework. |
| `bun:sqlite` | Não na produção serverless | Banco em arquivo local não acompanha deploy efêmero. D1 mantém SQL/SQLite com persistência. |
| `fs.watch` + `.md` | Não | Arquivos de empresa/agentes são convenção de outro sistema; cadastros precisam de banco e integridade. |
| SSE | Não | A waitlist não possui eventos que exijam streaming. |
| `POST /heartbeat` | Não | Não temos agentes conectados, nem presença online a monitorar. |
| HTML/CSS/JS puro | Sim | Mais barato, fácil de testar, rápido e bom para SEO. |
| `bun build --compile` | Não | Usuários visitarão um website, não instalarão aplicativo Windows. |

## Infraestrutura
- Cloudflare Workers serve API e assets numa única origem HTTPS.
- D1 com migrações versionadas e UNIQUE `(email, role)`.
- Turnstile verifica token no servidor; sem chave válida a API não grava.
- A interface não recebe database id secreto nem token privado Turnstile.
- `sessionStorage` conserva temporariamente token da etapa 2 até completar; não é autenticação permanente.
- Sem autenticação de administrador neste estágio. Para análise dos registros, consultar o D1 via painel/CLI autorizado, sem endpoint público de exportação.

## Alternativas
- Stack do arquivo original: Vercel API + Neon PostgreSQL pode ser preservada numa infraestrutura comercial elegível, mas não depender de Vercel Hobby num produto comercial.
- `Bun.serve` + `bun:sqlite` é alternativa válida somente com VPS/host sempre ligado e **volume persistente + backup**; custo e manutenção tornam-na menos adequada à restrição R$0.
- Workers KV seria mais fraco para consultas relacionais e índices por papel/serviço.

## Transição para o marketplace (MVP 1)
Modelos necessários: `expert_profiles`, `service_offerings`, `requests`, `introductions`, `reports`, `verification_evidence`. Adicionar consentimento separado antes de publicar portfólios e qualquer dado de contato. Autenticação, denúncias, moderação e política anti-fraude são pré-requisitos. Não armazenar chaves de API de terceiros. Ainda não criar essas tabelas no MVP 0.

## Escala e operação
Limitador de tráfego adicional (WAF/Turnstile) antes de divulgar amplamente; captcha não garante ausência de abuso. Verificar métricas de D1/Workers, respostas 4xx/5xx e restrições de quotas.
