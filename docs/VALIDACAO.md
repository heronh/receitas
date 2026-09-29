# Validação — 29/09/2026

## Antes das alterações

- Chrome carregou a referência: 38 fichas, 38 links no índice.
- Os três primeiros testes foram escritos antes da troca do catálogo e falharam como esperado: quantidade diferente de 20; informações incompletas; falta de nota de origem.

## Catálogo atualizado

- 20 fichas, uma para cada ID da playlist, mantendo a ordem.
- IDs únicos, imagens locais existentes, ingredientes e compras consistentes.
- Todas as fichas têm descrição, preparo, dicas, conservação, rendimento, porção e fonte.
- Quatro receitas com valores declarados pelos autores; 16 com cálculo por ingredientes.
- Cálculos comparados independentemente com os pesos e porções do JSON.
- Sem filtros de “emagrecimento” ou alegações indevidas de ausência de açúcar.

## Navegador

Teste automatizado em Chrome usando Playwright:

- Todos os 20 links do índice chegam à ficha sem esconder o título atrás do cabeçalho.
- Filtro de pratos principais: seis fichas; filtro vegano: quatro.
- Busca por `SALMAO` encontra `Salmão`; busca combinada com categoria e estado vazio funcionam.
- Link direto revela a receita mesmo quando havia filtro incompatível.
- Compras persistem ao recarregar. Copiar omite itens comprados e inclui rendimento; compartilhar usa cópia como alternativa; limpar remove marcações.
- Armazenamento local com dados inválidos e hash malformado não quebram a página.
- Nenhum ID duplicado, recurso local ausente ou erro JavaScript.
- Sem rolagem horizontal da página em 320, 390, 768 e 1280 px.
- Capturas de índice e ficha revisadas em desktop, celular e modo escuro.
- Navegação por teclado alcança os filtros.

## Limites

Validação de software e consistência editorial; não houve teste culinário nem análise nutricional laboratorial. As três fichas com metadados insuficientes permanecem identificadas como adaptações sugeridas, especialmente a bolacha de grão-de-bico, cuja fórmula do vídeo não foi recuperada.
