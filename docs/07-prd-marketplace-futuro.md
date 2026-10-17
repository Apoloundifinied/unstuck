# 07 — PRD futuro: vitrine especializada (NÃO faz parte da waitlist)

**Gate:** só iniciar se 06-monetizacao-e-gates.md for alcançado ou se surgir evidência qualitativa forte documentada.

## Persona 1 — Solicitante com automação real
- "Meu workflow faz a tarefa, mas falha em produção".
- Deseja comparar profissionais pela experiência nos sistemas relevantes, orçamento, prazo e evidência do trabalho.
- Ação esperada: abrir pedido com escopo delimitado; receber até 3 apresentações qualificadas.
- Risco: informações comerciais e credenciais expostas. O produto deve impedir uploads de segredos e orientar a compartilhar acessos seguros apenas depois de contratar, no ambiente apropriado.

## Persona 2 — Especialista n8n independente
- Tem experiência prática e quer apresentar casos de uso sem pagar antes de encontrar uma demanda.
- Precisa mostrar especialidades, estudos de caso, exemplos de execução, disponibilidade e prazo médio; sem alegar credenciais oficiais que não possui.
- Ação esperada: candidatar-se a pedidos relevantes; receber respostas e feedback de conclusão.

## Entidades futuras
`expert_profiles(id,user_id,slug,bio,timezone,verification_state,public_consent_at)`
`offerings(id,expert_id,service,integrations[],starting_price,currency,delivery_window)`
`proofs(id,expert_id,url,type,moderation_state,verified_at)`
`requests(id,buyer_id,scope,service,integrations[],budget_min,budget_max,currency,due_date,status)`
`introductions(id,request_id,expert_id,buyer_accepted_at,expert_accepted_at,status)`
`reports(id,reporter_id,target_type,target_id,reason,reviewed_at)`.

## Vitrine — estrutura de card orientada a decisões
- Título: "Fix Stripe webhook failures in n8n" em vez de "Automation specialist".
- Especialidades: Stripe, Webhooks, idempotência, retries, logs.
- Prova: link público para repo, demonstração ou case aprovado com evidência identificável (sem dados confidenciais).
- Disponibilidade atualizada manualmente, faixa de preço e idioma/fuso.
- Status de verificação: "Portfolio reviewed" somente se revisado; jamais imitar certificação oficial do n8n.
- CTA: solicitar apresentação, com consentimento dos dois lados. Sem endereço de email público por padrão.

## Fluxos
1. Buyer pesquisa por integração + problema e registra escopo.
2. Plataforma retorna ofertas disponíveis e profissionais filtrados (ordem neutra por compatibilidade, não pay-to-win oculto).
3. Buyer envia intenção de contato a até 3 especialistas; especialista aceita/recusa.
4. Pagamento é combinado fora da plataforma na fase inicial; informar claramente que não há garantia/escrow.
5. Após encerramento, coletar feedback voluntário com prevenção de avaliações falsas.

## Políticas antes de abrir
- Solicitações reais somente; proibir spam, clonagem de portfólios, falsas avaliações, workflows que violam políticas de provedores e pedido público de API keys.
- Lógica de moderação de conteúdo, denúncias e suspensão; contato para proteção de dados.
- Termos de uso, regra sobre disputas, limitação de responsabilidade e política para menores de idade e responsáveis legais, conforme legislação pertinente.
- Equilíbrio de oferta/demanda: limite de especialistas ativos conforme volume de oportunidades, listas de espera separadas por nicho.

## Não confundir roadmap com produto entregue
A UI da waitlist exibe o conceito e um exemplo fictício identificado. Todas as entidades acima são propostas, não schemas implantados. Não há avaliações nem especialistas ativos no MVP 0.
