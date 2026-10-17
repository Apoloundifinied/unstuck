# Tema escuro seguindo o sistema

Implementado em 17/10/2026, preservando o design existente.

## Comportamento

Landing e privacidade carregam `dark.css` somente quando a media query nativa `prefers-color-scheme: dark` corresponde à preferência do visitante. Sem seletor manual, scripts de tema ou preferência armazenada. O navegador reavalia a condição quando o sistema muda. Metadados theme-color também têm variantes clara/escura.

O arquivo original `styles.css` não foi alterado. Layout, fontes locais, dimensões, breakpoints, animações/reduced motion e APIs são os mesmos. O novo arquivo cobre cores das ilustrações, cartões, campos, feedback, navegação e rodapé. Tokens documentados em `08-brand-and-ux.md`.

## Verificação

- 19/19 testes existentes passaram.
- Auditor frontend strict sem findings.
- Contrastes amostrados de corpo, texto secundário, texto discreto, destaque, submit, erro e sucesso: todos acima de 4,5:1; menor amostra 6,51:1. Não equivale a auditoria completa de acessibilidade.
- Navegador: página real com media query nativa aplicou tema escuro (body #101113 e texto #F4F1EB). Prévia clara com folha escura desativada preservou #F5F2EC e #292621 e a composição original.
- Prévia escura mobile: largura efetiva 360 px, sem overflow horizontal. Privacidade: margem lateral 20 px e texto legível.
- Explorador respondeu à seleção de cenário. Campos com fundo #111316 e texto #F4F1EB; feedback de configuração ausente apareceu no teste local, sem cadastro.
- Prévia local usou fixtures somente em `.wrangler/theme-qa/`, ignoradas pelo Git: modo escuro forçado para inspeção, modo claro forçado para comparação e sitekey vazia para não usar o widget de produção no localhost. Nenhuma fixture é enviada à Cloudflare.
- A troca da preferência do sistema durante a sessão não foi automatizada: o controle de navegador não oferece emulação de color-scheme. A seleção automática do modo escuro foi observada no navegador, e o comportamento dinâmico usa apenas a media query nativa.

Sem mudanças em D1, secrets, endpoints ou configuração da Vercel.
