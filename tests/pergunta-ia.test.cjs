const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const inicio = app.indexOf('const LIMITE_URL_IA');
const fim = app.indexOf('const htmlIngredientes');
assert.ok(inicio > 0 && fim > inicio);
const sandbox = vm.createContext({});
vm.runInContext(
  app.slice(inicio, fim) + '\nthis.api = { LIMITE_URL_IA, textoPerguntaIa, urlPerguntaIa };',
  sandbox
);
const { LIMITE_URL_IA, textoPerguntaIa, urlPerguntaIa } = sandbox.api;

const catalogo = vm.createContext({});
vm.runInContext(
  fs.readFileSync(path.join(root, 'js/receitas.js'), 'utf8') + '\nthis.catalogo = RECEITAS;',
  catalogo
);
const receitas = catalogo.catalogo;

const PREFIXO = 'Tenho uma dúvida sobre esta receita:';
const SUFIXO = 'Minha dúvida:';

const decodificar = (url) => {
  assert.ok(url.startsWith('https://chatgpt.com/?q='), url.slice(0, 40));
  return decodeURIComponent(url.slice('https://chatgpt.com/?q='.length));
};

test('cada ficha tem o botão que abre a pergunta no ChatGPT', () => {
  assert.match(app, /<a class="botao" data-ia href="\$\{escapar\(urlPerguntaIa\(r\)\)\}" target="_blank" rel="noopener">Perguntar à IA sobre esta receita<\/a>/);
  assert.equal(LIMITE_URL_IA, 6000);
  assert.equal(receitas.length, 44);

  let cortadas = 0;
  for (const receita of receitas) {
    const url = urlPerguntaIa(receita);
    const texto = decodificar(url);
    const completa = 'https://chatgpt.com/?q=' + encodeURIComponent(textoPerguntaIa(receita, true));
    const semPreparo = 'https://chatgpt.com/?q=' + encodeURIComponent(textoPerguntaIa(receita, false));
    assert.equal(texto.startsWith(PREFIXO + '\n'), true, receita.id);
    assert.equal(texto.endsWith(SUFIXO), true, receita.id);
    assert.ok(texto.includes(receita.titulo), receita.id);
    for (const item of receita.ingredientes.flatMap((g) => g.itens)) {
      assert.ok(texto.includes(item), `${receita.id}: ${item}`);
    }
    if (completa.length <= LIMITE_URL_IA) {
      assert.equal(url, completa, receita.id);
      assert.ok(texto.includes('\nPreparo:\n'), receita.id);
      assert.ok(texto.includes(receita.preparo[0]), receita.id);
    } else {
      cortadas += 1;
      assert.equal(url, semPreparo, receita.id);
      assert.equal(texto.includes('\nPreparo:\n'), false, receita.id);
    }
  }
  assert.equal(cortadas, receitas.filter((r) => {
    const completa = 'https://chatgpt.com/?q=' + encodeURIComponent(textoPerguntaIa(r, true));
    return completa.length > LIMITE_URL_IA;
  }).length);
});

test('URL acima de 6000 caracteres perde o preparo e conserva título e ingredientes', () => {
  const receita = {
    titulo: 'Bolo de teste',
    ingredientes: [{ titulo: 'Massa', itens: ['3 bananas maduras', '2 ovos'] }],
    preparo: ['Misture tudo. ' + 'Continue mexendo. '.repeat(800)],
  };
  const completa = 'https://chatgpt.com/?q=' + encodeURIComponent(textoPerguntaIa(receita, true));
  assert.ok(completa.length > LIMITE_URL_IA);
  const url = urlPerguntaIa(receita);
  const texto = decodificar(url);
  assert.equal(url, 'https://chatgpt.com/?q=' + encodeURIComponent(textoPerguntaIa(receita, false)));
  assert.ok(texto.includes('Bolo de teste'));
  assert.ok(texto.includes('3 bananas maduras'));
  assert.ok(texto.includes('2 ovos'));
  assert.equal(texto.includes('Misture tudo.'), false);
  assert.equal(texto.includes('\nPreparo:\n'), false);
  assert.ok(texto.startsWith(PREFIXO + '\n'));
  assert.ok(texto.endsWith(SUFIXO));
});
