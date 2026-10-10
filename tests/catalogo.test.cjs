const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'js/receitas.js'), 'utf8') + '\nthis.catalogo = RECEITAS;', context);
const receitas = JSON.parse(JSON.stringify(context.catalogo));
const playlistOrder = ['gJESkQtV_LA', 'wjae921V70I', '4uWS0sIRSe8', 'qviffFXr_sg', '2MfibVTCvYM', 'zM8yab1Uy4U', 'oLjTJSwSHR8', 'j25LoMkeFWo', 'qwi2Y8isloI', 'FbzjVvVyCEM', 'oFDbeSacXGY', '7P_4y4j9cWA', 'WAwcloRLMY0', 'j1EUg_IfTh8', 'tApjUXrfQ84', 'VpH7kZchAS4', 'dupbD0MR6Wo', 'LZjqqnymUv4', 'Yyzdcpqct50', 'sVPwjoFjM1k', 'b2xbwfPU4IQ', 'uEQRL_GLC_w', 'AfhwWdJX7Lg', 'lRCLarGbxe0', '8y3AEMvtq68', 'C1dBjcTQNqo', '0A3e0V3nw2A', 'mdPveC7HlFM', 'TH9rWEh8okY', 'F5xDn0DueO4', 'ozdbNFy84bY', 'VX-dMV-HZQQ', 'TmHXy8hkBgw', 'VOlIRFtI4XI', 'KmiFvWdx01M', 'eCazTN5-Rsc', 'dRW3VMfNlaY', 'BkTFTZw9PSE', 'H1od62HtUDM', 'RueGO-RTfZI'];
const recentesIds = ['muffins-amendoa-coco', 'crackers-sementes-sem-farinha', 'torta-abobora-aveia-cottage', 'panquecas-aveia-iogurte', 'bolo-aveia-cacau-iogurte'];

test('uma ficha por vídeo, na ordem da playlist, com variações de aveia e ricota', () => {
  assert.equal(receitas.length, 40);
  assert.equal(new Set(receitas.map(r => r.id)).size, 40);
  assert.deepEqual(new Set(receitas.map(r => r.videoId)), new Set(playlistOrder));
  const recentes = receitas.filter(r => r.categoria === 'Recentes');
  const outros = receitas.filter(r => r.categoria !== 'Recentes');
  const recentesVideoIds = new Set(recentes.map(r => r.videoId));
  assert.deepEqual(recentes.map(r => r.id), recentesIds);
  assert.deepEqual(outros.map(r => r.videoId), playlistOrder.filter(v => !recentesVideoIds.has(v)));
  assert.ok(receitas.every(r => !r.variacoes?.length || ['aveia-assada-maca', 'pao-linhaca', 'pao-ricota-ovo', 'salgadinho-batata-doce', 'granola-crocante', 'barras-granola', 'barras-banana-aveia', 'barras-pasta-amendoim-aveia'].includes(r.id)));
  const variacaoLinhaca = receitas.find(r => r.id === 'pao-linhaca').variacoes[0];
  assert.equal(variacaoLinhaca.id, 'paezinhos-linhaca-gergelim');
  assert.equal(variacaoLinhaca.videoId, 'Q_RQlrHsZgk');
  assert.equal(variacaoLinhaca.fonte.url, 'https://www.youtube.com/watch?v=Q_RQlrHsZgk');
  assert.ok(variacaoLinhaca.ingredientes.length && variacaoLinhaca.preparo.length >= 3 && variacaoLinhaca.nutricao?.origem === 'estimativa');
  const variacaoAveia = receitas.find(r => r.id === 'aveia-assada-maca').variacoes[0];
  assert.equal(variacaoAveia.id, 'cookies-aveia-maca-canela');
  assert.equal(variacaoAveia.videoId, 'FxgVCAD6KyE');
  assert.equal(variacaoAveia.fonte.url, 'https://www.youtube.com/watch?v=FxgVCAD6KyE');
  assert.ok(variacaoAveia.ingredientes.length && variacaoAveia.preparo.length >= 3 && variacaoAveia.nutricao?.origem === 'estimativa');
  const variacaoRicota = receitas.find(r => r.id === 'pao-ricota-ovo').variacoes[0];
  assert.equal(variacaoRicota.id, 'pao-ricota-ovo-recheado');
  assert.equal(variacaoRicota.videoId, 'DDzNylsClC4');
  assert.equal(variacaoRicota.fonte.url, 'https://www.youtube.com/watch?v=DDzNylsClC4');
  assert.ok(variacaoRicota.ingredientes.length && variacaoRicota.preparo.length >= 3 && variacaoRicota.nutricao?.origem === 'estimativa');
  const variacaoBatata = receitas.find(r => r.id === 'salgadinho-batata-doce').variacoes[0];
  assert.equal(variacaoBatata.id, 'biscoito-batata-doce-sem-ovos');
  assert.equal(variacaoBatata.videoId, 'RAaxxbvzCUg');
  assert.equal(variacaoBatata.fonte.url, 'https://www.youtube.com/watch?v=RAaxxbvzCUg');
  assert.ok(variacaoBatata.ingredientes.length && variacaoBatata.preparo.length >= 3 && variacaoBatata.nutricao?.origem === 'estimativa');
  assert.ok(recentes.length <= 5);
  assert.ok(recentes.every(r => r.categoriaBase));
  assert.equal(receitas.find(r => r.id === 'pao-ricota-ovo').categoria, 'Pães e wraps');
  assert.ok(!receitas.find(r => r.id === 'pao-ricota-ovo').categoriaBase);
  assert.equal(receitas.find(r => r.id === 'pao-linhaca').categoria, 'Pães e wraps');
  assert.ok(!receitas.find(r => r.id === 'pao-linhaca').categoriaBase);
  const torta = receitas.find(r => r.id === 'torta-abobora-aveia-cottage');
  assert.equal(torta.videoId, '4uWS0sIRSe8');
  assert.equal(torta.fonte.url, 'https://www.youtube.com/watch?v=4uWS0sIRSe8');
  assert.equal(torta.categoriaBase, 'Doces e lanches');
});

test('filtro de categoria aceita a categoria da ficha ou a categoriaBase', () => {
  const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const categoriasUsadas = app.match(/const categoriasUsadas = ([\s\S]*?);/);
  const combina = app.match(/if \(f\?\.tipo === "categoria" && ([^)]+)\) return false;/);
  assert.ok(categoriasUsadas && /r\.categoria === c \|\| r\.categoriaBase === c/.test(categoriasUsadas[1]));
  assert.ok(combina && /r\.categoria !== f\.valor && r\.categoriaBase !== f\.valor/.test(combina[1]));
  const torta = receitas.find(r => r.id === 'torta-abobora-aveia-cottage');
  assert.equal(torta.categoria, 'Recentes');
  assert.equal(torta.categoriaBase, 'Doces e lanches');
  const aceita = (r, valor) => r.categoria === valor || r.categoriaBase === valor;
  assert.ok(aceita(torta, 'Recentes') && aceita(torta, 'Doces e lanches'));
  const pao = receitas.find(r => r.id === 'pao-linhaca');
  assert.equal(pao.categoria, 'Pães e wraps');
  assert.ok(aceita(pao, 'Pães e wraps'));
  const categorias = ['Recentes', 'Pratos principais', 'Entradas e pastas', 'Pães e wraps', 'Biscoitos e crackers', 'Doces e lanches'];
  const chips = categorias.filter(c => receitas.some(r => r.categoria === c || r.categoriaBase === c));
  assert.ok(chips.includes('Pães e wraps'));
  for (const base of new Set(receitas.map(r => r.categoriaBase).filter(Boolean))) {
    assert.ok(chips.includes(base), base);
  }
});

test('cada ficha permite cozinhar e comprar, com porção e origem das informações', () => {
  for (const r of receitas) {
    assert.ok(r.destaque && r.rendimento && r.porcao && r.proveniencia?.nota, r.id);
    assert.ok(r.ingredientes.length && r.preparo.length >= 3 && r.dicas.length >= 2, r.id);
    assert.ok(r.conservacao?.geladeira && r.conservacao?.congelador, r.id);
    assert.ok(fs.existsSync(path.join(root, r.icone)), r.id);
    for (const item of r.ingredientes.flatMap(g => g.itens)) {
      if (!item.startsWith('Água:')) assert.ok(r.compras.some(g => g.itens.includes(item)), `${r.id}: ${item}`);
    }
    for (const campo of ['kcal','prot','carb','gord']) assert.ok(Number.isFinite(r.nutricao[campo]) && r.nutricao[campo] >= 0, `${r.id}: ${campo}`);
    assert.ok(['autor','estimativa'].includes(r.nutricao.origem), r.id);
    assert.ok(r.nutricao.nota, r.id);
  }
});

test('pães, biscoitos, pastas e doces informam validade em temperatura ambiente', () => {
  const categorias = new Set(['Pães e wraps', 'Biscoitos e crackers', 'Entradas e pastas', 'Doces e lanches']);
  const exigir = (item, id) => {
    assert.ok(item.conservacao?.ambiente, `${id}: ambiente`);
    assert.ok(item.conservacao?.geladeira, `${id}: geladeira`);
    assert.ok(item.conservacao?.congelador, `${id}: congelador`);
  };
  for (const r of receitas) {
    const cat = r.categoria === 'Recentes' ? r.categoriaBase : r.categoria;
    if (!categorias.has(cat)) continue;
    exigir(r, r.id);
    for (const variacao of r.variacoes || []) exigir(variacao, variacao.id);
  }
  const salgadinho = receitas.find(r => r.id === 'salgadinho-batata-doce');
  assert.ok(!/local seco/.test(salgadinho.conservacao.geladeira));
  assert.match(salgadinho.conservacao.ambiente, /local seco/);
});

test('diferenças entre títulos e ingredientes não geram alegações falsas', () => {
  const frango = receitas.find(r => r.fonte?.url.includes('dupbD0MR6Wo'));
  assert.ok(frango?.proveniencia.nota.includes('muçarela'));
  assert.ok(receitas.every(r => !r.tags.includes('Emagrecimento') && !r.tags.includes('Sem açúcar')));
});

test('nutrição calculada é reproduzível e respeita as porções', () => {
  const base = JSON.parse(fs.readFileSync(path.join(root, 'data/receitas.json')));
  const nutrientes = JSON.parse(fs.readFileSync(path.join(root, 'data/nutrientes.json'))).alimentos;
  base.forEach((r, index) => {
    const n = receitas[index].nutricao;
    if (r.nutricaoAutor) {
      for (const campo of ['kcal','prot','carb','gord']) assert.equal(n[campo], r.nutricaoAutor[campo]);
      assert.equal(n.origem, 'autor');
      return;
    }
    assert.ok(r.porcoes > 0 && Object.keys(r.baseNutricional).length > 0);
    for (const campo of ['kcal','prot','carb','gord','fibras']) {
      const total = Object.entries(r.baseNutricional).reduce((sum, [alimento, gramas]) => sum + nutrientes[alimento].por100g[campo] * gramas / 100, 0);
      assert.ok(Math.abs(n[campo] - total / r.porcoes) <= (campo === 'kcal' ? 2.51 : 0.051), `${r.id}: ${campo}`);
    }
    for (const variacao of r.variacoes || []) {
      assert.ok(variacao.porcoes > 0 && Object.keys(variacao.baseNutricional).length > 0, variacao.id);
      const publicada = receitas[index].variacoes.find(item => item.id === variacao.id).nutricao;
      for (const campo of ['kcal','prot','carb','gord','fibras']) {
        const total = Object.entries(variacao.baseNutricional).reduce((sum, [alimento, gramas]) => sum + nutrientes[alimento].por100g[campo] * gramas / 100, 0);
        assert.ok(Math.abs(publicada[campo] - total / variacao.porcoes) <= (campo === 'kcal' ? 2.51 : 0.051), `${variacao.id}: ${campo}`);
      }
    }
  });
});
