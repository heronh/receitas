const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'js/receitas.js'), 'utf8') + '\nthis.catalogo = RECEITAS;', context);
const receitas = JSON.parse(JSON.stringify(context.catalogo));
const videos = ['zM8yab1Uy4U', 'j25LoMkeFWo', 'qwi2Y8isloI', 'FbzjVvVyCEM', 'oFDbeSacXGY', '7P_4y4j9cWA', 'WAwcloRLMY0', 'j1EUg_IfTh8', 'dupbD0MR6Wo', 'Yyzdcpqct50', 'b2xbwfPU4IQ', 'AfhwWdJX7Lg', '8y3AEMvtq68', '0A3e0V3nw2A', 'mdPveC7HlFM', 'TH9rWEh8okY', 'VX-dMV-HZQQ', 'KmiFvWdx01M', 'eCazTN5-Rsc', 'dRW3VMfNlaY', 'BkTFTZw9PSE', 'RueGO-RTfZI'];

test('uma ficha por vídeo, na ordem da playlist, com a variação de aveia e maçã', () => {
  assert.equal(receitas.length, 22);
  assert.deepEqual(receitas.map(r => new URL(r.fonte.url).searchParams.get('v')), videos);
  assert.equal(new Set(receitas.map(r => r.id)).size, 22);
  assert.ok(receitas.every(r => !r.variacoes?.length || r.id === 'aveia-assada-maca'));
  const variacao = receitas.find(r => r.id === 'aveia-assada-maca').variacoes[0];
  assert.equal(variacao.id, 'cookies-aveia-maca-canela');
  assert.equal(variacao.videoId, 'FxgVCAD6KyE');
  assert.equal(variacao.fonte.url, 'https://www.youtube.com/watch?v=FxgVCAD6KyE');
  assert.ok(variacao.ingredientes.length && variacao.preparo.length >= 3 && variacao.nutricao?.origem === 'estimativa');
  assert.ok(!receitas.some(r => r.videoId === 'oLjTJSwSHR8' || r.fonte.url.includes('oLjTJSwSHR8')));
  const recentes = receitas.filter(r => r.categoria === 'Recentes');
  assert.ok(recentes.length <= 5);
  assert.ok(recentes.every(r => r.categoriaBase));
  for (const id of ['pao-aveia-iogurte-grego', 'bolo-aveia-cacau-banana']) {
    assert.equal(receitas.find(r => r.id === id).categoria, 'Recentes');
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
