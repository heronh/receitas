# Receitas da playlist

Página estática com as 38 receitas da [playlist Receitas](https://www.youtube.com/playlist?list=PLQMMYgYzynIQ) (49 vídeos; receitas parecidas ficam como variação). A ordem segue a playlist consultada em 08/10/2026. Mantém o estilo da página anterior: índice com âncoras, busca, filtros no cabeçalho e listas de compras com marcações salvas no navegador.

## Abrir localmente

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8765`. Também é possível abrir `index.html` diretamente; copiar e compartilhar dependem das permissões do navegador. A página não depende de serviços externos para exibir as receitas.

## Editar o conteúdo

- `data/receitas.json`: fichas, fontes, ingredientes, porções, dicas e pesos usados no cálculo.
- `data/nutrientes.json`: valores por 100 g, com referência TACO e complementos editoriais identificados.
- `data/fontes-videos.json`: inventário consultado, IDs, links e canais.
- `scripts/gerar_receitas.py`: gera `js/receitas.js`, incluindo listas de compras e estimativas nutricionais. Execute `python3 scripts/gerar_receitas.py` após editar os dados.
- `js/app.js`, `index.html` e `css/styles.css`: comportamento e apresentação.

Compras são derivadas da mesma lista de ingredientes para evitar divergências. Água fica fora das compras. Ingredientes opcionais continuam marcados como opcionais. Marcações são locais ao navegador e não são enviadas a servidores.

O coletor preexistente `scripts/coletar_playlist.py` e seu workflow permanecem separados: geram inventário em `data/playlist.json`, mas não sobrescrevem as fichas revisadas. Vídeos novos exigem revisão antes de entrar na página.

## Fontes e estimativas

Foram consultadas as descrições públicas dos 20 vídeos. Quando disponíveis, também as receitas escritas de Cook'n Enjoy, The Protein Chef e The Cooking Foodie, indicadas nas descrições. As requisições de legendas retornaram vazias; nenhuma receita foi apresentada como transcrição.

Três fichas exigem atenção editorial:

- **Ovo e ricota:** título informa os ingredientes, mas a descrição não dá medidas ou preparo. A ficha propõe proporções e método.
- **Pato com mel e Porto:** ingredientes principais confirmados; medidas e preparo adaptados da referência anterior do projeto.
- **Bolacha de grão-de-bico:** descrição não informa a fórmula. A ficha preserva uma adaptação da receita anterior do projeto, sem afirmar que coincide com a receita do vídeo.

Outras conversões, tempos e rendimentos estimados estão indicados nas próprias fichas. Nenhuma preparação foi testada na cozinha. As dicas de textura são sugestões culinárias; os prazos de congelamento são sugestões de qualidade, não resultados de testes de validade.

### Nutrição

Quatro receitas usam valores declarados pelos autores: bombons (por 20 g), crackers (valores por unidade multiplicados por 5), wrap de cottage integral (receita inteira) e pizza (1/6). As demais somam os pesos dos ingredientes divididos pelas porções declaradas. Calorias calculadas são arredondadas a 5 kcal, macros a 0,1 g.

A fonte principal é a [TACO, 4ª edição, NEPA/Unicamp](https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf). Seus registros usados estão identificados pelo número do alimento. Itens sem correspondência adequada usam aproximações editoriais genéricas, explicitadas no JSON, e não são atribuídos à TACO. Não há análise laboratorial nem cálculo de sódio. Marcas, porções, gordura descartada e evaporação alteram os valores. Aves e peixes usam pesos crus; não se desconta a gordura deixada na panela. As exceções e acompanhamentos excluídos aparecem em cada ficha.

Referências para conservação e temperatura: [USDA/FSIS](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety) e [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures).

## Testar

Node.js 22 ou superior e Python 3 são suficientes para testar dados e regenerar o catálogo:

```sh
npm test
python3 scripts/gerar_receitas.py
git diff --exit-code -- js/receitas.js
```

O último comando deve ser usado depois de salvar a versão gerada no Git, para confirmar que gerar novamente não muda o arquivo.

Para testes reais de navegador:

```sh
npm install
npx playwright install chromium
npm run test:browser
```

Pode-se usar Chrome já instalado definindo `CHROME_PATH=/caminho/do/chrome`. `SCREENSHOT_DIR` escolhe onde salvar as capturas; por padrão, usa uma pasta temporária. O servidor de teste abre apenas em `127.0.0.1` e é encerrado ao terminar.

Veja [plano](docs/PLANO.md) e [resultado da validação](docs/VALIDACAO.md).
