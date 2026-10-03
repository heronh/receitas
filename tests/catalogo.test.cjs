const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'js/receitas.js'), 'utf8') + '\nthis.catalogo = RECEITAS;', context);
const receitas = JSON.parse(JSON.stringify(context.catalogo));
const playlistOrder = ['qviffFXr_sg', 'zM8yab1Uy4U', 'oLjTJSwSHR8', 'j25LoMkeFWo', 'qwi2Y8isloI', 'FbzjVvVyCEM', 'oFDbeSacXGY', '7P_4y4j9cWA', 'WAwcloRLMY0', 'j1EUg_IfTh8', 'tApjUXrfQ84', 'VpH7kZchAS4', 'dupbD0MR6Wo', 'LZjqqnymUv4', 'Yyzdcpqct50', 'sVPwjoFjM1k', 'b2xbwfPU4IQ', 'uEQRL_GLC_w', 'AfhwWdJX7Lg', '8y3AEMvtq68', 'C1dBjcTQNqo', '0A3e0V3nw2A', 'mdPveC7HlFM', 'TH9rWEh8okY', 'F5xDn0DueO4', 'ozdbNFy84bY', 'VX-dMV-HZQQ', 'KmiFvWdx01M', 'eCazTN5-Rsc', 'dRW3VMfNlaY', 'BkTFTZw9PSE', 'H1od62HtUDM', 'RueGO-RTfZI'];
const recentesIds = ['panquecas-aveia-iogurte', 'pao-linhaca', 'cookies-aveia-canela-castanha', 'aveia-assada-maca', 'bombons-maca-amendoim'];

test('uma ficha por vídeo, na ordem da playlist, com variações de aveia e ricota', () => {
  assert.equal(receitas.length, 33);
  assert.equal(new Set(receitas.map(r => r.id)).size, 33);
  assert.deepEqual(new Set(receitas.map(r => r.videoId)), new Set(playlistOrder));
  const recentes = receitas.filter(r => r.categoria === 'Recentes');
  const outros = receitas.filter(r => r.categoria !== 'Recentes');
  const recentesVideoIds = new Set(recentes.map(r => r.videoId));
  assert.deepEqual(recentes.map(r => r.id), recentesIds);
  assert.deepEqual(outros.map(r => r.videoId), playlistOrder.filter(v => !recentesVideoIds.has(v)));
  assert.ok(receitas.every(r => !r.variacoes?.length || ['aveia-assada-maca', 'pao-ricota-ovo', 'salgadinho-batata-doce', 'granola-crocante', 'barras-granola', 'barras-banana-aveia', 'barras-pasta-amendoim-aveia'].includes(r.id)));
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
