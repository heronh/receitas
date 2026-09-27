(() => {
  "use strict";

  const CHAVE_STORAGE = "receitas:compras:v1";
  const TAGS_FILTRO = ["Emagrecimento", "Low-carb", "Sem glúten", "Vegana"];

  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  const el = {
    topo: $("#topo"),
    contagem: $("#contagem"),
    busca: $("#busca"),
    filtros: $("#filtros"),
    indiceLista: $("#indice-lista"),
    vazio: $("#vazio"),
    receitas: $("#receitas"),
    voltar: $("#voltar"),
    aviso: $("#aviso"),
  };

  const estado = { filtro: null, termo: "" };

  const escapar = (texto) =>
    String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const normalizar = (texto) =>
    String(texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  /* Armazenamento das marcações */

  const lerMarcacoes = () => {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || {};
    } catch {
      return {};
    }
  };

  let marcacoes = lerMarcacoes();

  const salvarMarcacoes = () => {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(marcacoes));
    } catch {
      /* navegação privada sem storage: as marcações valem só nesta sessão */
    }
  };

  const itemMarcado = (receitaId, item) => (marcacoes[receitaId] || []).includes(item);

  const definirMarcado = (receitaId, item, marcado) => {
    const lista = new Set(marcacoes[receitaId] || []);
    if (marcado) lista.add(item);
    else lista.delete(item);
    if (lista.size) marcacoes[receitaId] = [...lista];
    else delete marcacoes[receitaId];
    salvarMarcacoes();
  };

  /* Renderização */

  const htmlNutricao = (n) => {
    if (!n) return "";
    if (typeof n === "string") {
      return `<p class="receita__rendimento"><strong>Nutrição:</strong> ${escapar(n)}</p>`;
    }
    const campos = [
      [n.kcal, "kcal"],
      [`${n.prot} g`, "prot."],
      [`${n.carb} g`, "carb."],
      [`${n.gord} g`, "gord."],
    ];
    if (n.fibras !== undefined) campos.push([`${n.fibras} g`, "fibras"]);
    const classe = campos.length === 5 ? "nutricao nutricao--5" : "nutricao";
    return `<ul class="${classe}" aria-label="Informação nutricional por porção">${campos
      .map(([valor, rotulo]) => `<li><strong>${escapar(valor)}</strong><span>${rotulo}</span></li>`)
      .join("")}</ul>`;
  };

  const htmlLista = (itens, classe = "ingredientes") =>
    `<ul class="${classe}">${itens.map((i) => `<li>${escapar(i)}</li>`).join("")}</ul>`;

  const htmlIngredientes = (grupos) =>
    grupos
      .map(
        (g) =>
          `${g.titulo ? `<h4 class="bloco__subtitulo">${escapar(g.titulo)}</h4>` : ""}${htmlLista(g.itens)}`
      )
      .join("");

  const htmlVariacoes = (variacoes) =>
    `<section class="bloco">
      <h3 class="bloco__titulo">Variações</h3>
      <div class="variacoes">
        ${variacoes
          .map((v) => {
            const nome = v.titulo || v.nome || "";
            const descricao = v.descricao || v.destaque;
            const ingredientes = v.ingredientes?.length
              ? htmlIngredientes(v.ingredientes)
              : v.itens?.length
                ? htmlLista(v.itens)
                : "";
            const passos = v.preparo?.length ? v.preparo : v.passos || [];
            return `<article class="variacao">
              <h4 class="variacao__nome">${escapar(nome)}</h4>
              ${descricao ? `<p class="variacao__descricao">${escapar(descricao)}</p>` : ""}
              ${v.rendimento ? `<p class="receita__rendimento"><strong>Rendimento:</strong> ${escapar(v.rendimento)}</p>` : ""}
              ${ingredientes}
              ${passos.length ? `<ol class="variacao__passos">${passos.map((p) => `<li>${escapar(p)}</li>`).join("")}</ol>` : ""}
              ${v.dicas?.length ? htmlLista(v.dicas, "dicas") : ""}
              ${htmlNutricao(v.nutricao)}
              ${v.fonte ? `<p class="fonte"><a href="${escapar(v.fonte.url)}" target="_blank" rel="noopener">${escapar(v.fonte.texto)}</a></p>` : ""}
            </article>`;
          })
          .join("")}
      </div>
    </section>`;

  const htmlCompras = (r) => {
    const secoes = r.compras
      .map(
        (s, si) => `<h4 class="compras__secao">${escapar(s.secao)}</h4>
        <ul class="compras__lista">
          ${s.itens
            .map((item, ii) => {
              const id = `c-${r.id}-${si}-${ii}`;
              return `<li class="compras__item">
                <label for="${id}">
                  <input type="checkbox" id="${id}" data-item="${escapar(item)}"${itemMarcado(r.id, item) ? " checked" : ""}>
                  <span>${escapar(item)}</span>
                </label>
              </li>`;
            })
            .join("")}
        </ul>`
      )
      .join("");

    return `<section class="compras" data-compras="${r.id}" aria-labelledby="compras-${r.id}">
      <div class="compras__topo">
        <h3 class="compras__titulo" id="compras-${r.id}">Lista de compras</h3>
        <span class="compras__progresso" data-progresso></span>
      </div>
      ${secoes}
      <div class="compras__acoes">
        <button type="button" class="botao botao--primario" data-acao="copiar">Copiar lista</button>
        <button type="button" class="botao" data-acao="compartilhar">Compartilhar</button>
        <button type="button" class="botao botao--texto" data-acao="limpar">Limpar marcações</button>
      </div>
    </section>`;
  };

  const htmlReceita = (r, numero) => `<article class="receita" id="${r.id}" data-receita="${r.id}">
    <header class="receita__cabecalho">
      <div class="icone"><img src="${r.icone}" alt="" width="96" height="96" loading="lazy"></div>
      <div>
        <span class="receita__categoria">${numero}. ${escapar(r.categoria)}</span>
        <h2 class="receita__titulo">${escapar(r.titulo)}</h2>
        ${r.tags.length ? `<ul class="tags">${r.tags.map((t) => `<li class="tag">${escapar(t)}</li>`).join("")}</ul>` : ""}
      </div>
    </header>

    <p class="receita__destaque">${escapar(r.destaque)}</p>
    ${r.rendimento ? `<p class="receita__rendimento"><strong>Rendimento:</strong> ${escapar(r.rendimento)}</p>` : ""}
    ${htmlNutricao(r.nutricao)}

    <section class="bloco">
      <h3 class="bloco__titulo">Ingredientes</h3>
      ${htmlIngredientes(r.ingredientes)}
    </section>

    <section class="bloco">
      <h3 class="bloco__titulo">Modo de preparo</h3>
      <ol class="preparo">${r.preparo.map((p) => `<li>${escapar(p)}</li>`).join("")}</ol>
    </section>

    ${r.variacoes?.length ? htmlVariacoes(r.variacoes) : ""}

    ${
      r.dicas?.length || r.fonte
        ? `<section class="bloco">
            ${r.dicas?.length ? `<h3 class="bloco__titulo">Dicas</h3>${htmlLista(r.dicas, "dicas")}` : ""}
            ${r.fonte ? `<p class="fonte"><a href="${escapar(r.fonte.url)}" target="_blank" rel="noopener">${escapar(r.fonte.texto)}</a></p>` : ""}
          </section>`
        : ""
    }

    ${r.compras?.length ? htmlCompras(r) : ""}
  </article>`;

  const htmlCard = (r, numero) => `<li data-card="${r.id}">
    <a class="card" href="#${r.id}">
      <div class="icone"><img src="${r.icone}" alt="" width="96" height="96"></div>
      <div class="card__texto">
        <span class="card__num">${numero} · ${escapar(r.categoria)}</span>
        <h2 class="card__titulo">${escapar(r.titulo)}</h2>
        <p class="card__destaque">${escapar(r.destaque)}</p>
      </div>
    </a>
  </li>`;

  const htmlFiltros = () => {
    const chip = (rotulo, filtro) =>
      `<button type="button" class="chip" data-filtro="${escapar(JSON.stringify(filtro))}" aria-pressed="false">${escapar(rotulo)}</button>`;
    const categoriasUsadas = CATEGORIAS.filter((c) => RECEITAS.some((r) => r.categoria === c));
    const tagsUsadas = TAGS_FILTRO.filter((t) => RECEITAS.some((r) => r.tags.includes(t)));
    return [
      chip("Todas", null),
      ...categoriasUsadas.map((c) => chip(c, { tipo: "categoria", valor: c })),
      ...tagsUsadas.map((t) => chip(t, { tipo: "tag", valor: t })),
    ].join("");
  };

  /* Busca e filtros */

  const textoBusca = new Map(
    RECEITAS.map((r) => [
      r.id,
      normalizar(
        [
          r.titulo,
          r.destaque,
          r.categoria,
          ...r.tags,
          ...r.ingredientes.flatMap((g) => g.itens),
          ...(r.variacoes || []).flatMap((v) => [
            v.nome,
            v.titulo,
            v.descricao,
            v.destaque,
            ...(v.itens || []),
            ...((v.ingredientes || []).flatMap((g) => [g.titulo, ...(g.itens || [])])),
            ...(v.passos || []),
            ...(v.preparo || []),
          ]),
        ].join(" ")
      ),
    ])
  );

  const combina = (r) => {
    const f = estado.filtro;
    if (f?.tipo === "categoria" && r.categoria !== f.valor) return false;
    if (f?.tipo === "tag" && !r.tags.includes(f.valor)) return false;
    if (!estado.termo) return true;
    const texto = textoBusca.get(r.id);
    return estado.termo.split(/\s+/).every((palavra) => texto.includes(palavra));
  };

  const aplicarFiltros = () => {
    let visiveis = 0;
    RECEITAS.forEach((r) => {
      const ok = combina(r);
      if (ok) visiveis++;
      $(`[data-card="${r.id}"]`, el.indiceLista).hidden = !ok;
      $(`[data-receita="${r.id}"]`, el.receitas).hidden = !ok;
    });
    el.vazio.hidden = visiveis > 0;
    el.contagem.textContent =
      visiveis === RECEITAS.length ? `${RECEITAS.length} receitas` : `${visiveis} de ${RECEITAS.length}`;

    const filtroAtual = JSON.stringify(estado.filtro);
    el.filtros.querySelectorAll(".chip").forEach((c) => {
      c.setAttribute("aria-pressed", String(c.dataset.filtro === filtroAtual));
    });
  };

  /* Lista de compras */

  const itensDaLista = (secao) => [...secao.querySelectorAll("input[type=checkbox]")];

  const atualizarProgresso = (secao) => {
    const itens = itensDaLista(secao);
    const marcados = itens.filter((i) => i.checked).length;
    $("[data-progresso]", secao).textContent =
      marcados === itens.length ? "Tudo pronto!" : `${marcados} de ${itens.length} no carrinho`;
  };

  const textoDaLista = (receita, somentePendentes) => {
    const linhas = [`Lista de compras: ${receita.titulo}`];
    receita.compras.forEach((s) => {
      const itens = s.itens.filter((i) => !somentePendentes || !itemMarcado(receita.id, i));
      if (!itens.length) return;
      linhas.push("", s.secao.toUpperCase(), ...itens.map((i) => `- ${i}`));
    });
    return linhas.join("\n");
  };

  let temporizadorAviso;
  const avisar = (mensagem) => {
    el.aviso.textContent = mensagem;
    el.aviso.classList.add("aviso--visivel");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => el.aviso.classList.remove("aviso--visivel"), 2200);
  };

  const copiarTexto = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = texto;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.remove();
      return ok;
    }
  };

  const listaPendente = (receita) => {
    const pendentes = receita.compras.some((s) => s.itens.some((i) => !itemMarcado(receita.id, i)));
    return textoDaLista(receita, pendentes);
  };

  const acoes = {
    async copiar(receita) {
      const ok = await copiarTexto(listaPendente(receita));
      avisar(ok ? "Lista copiada" : "Não foi possível copiar");
    },
    async compartilhar(receita) {
      const texto = listaPendente(receita);
      if (navigator.share) {
        try {
          await navigator.share({ title: `Lista de compras: ${receita.titulo}`, text: texto });
          return;
        } catch (erro) {
          if (erro.name === "AbortError") return;
        }
      }
      const ok = await copiarTexto(texto);
      avisar(ok ? "Lista copiada para compartilhar" : "Não foi possível compartilhar");
    },
    limpar(receita, secao) {
      delete marcacoes[receita.id];
      salvarMarcacoes();
      itensDaLista(secao).forEach((i) => (i.checked = false));
      atualizarProgresso(secao);
      avisar("Marcações removidas");
    },
  };

  /* Inicialização */

  const receitaPorId = new Map(RECEITAS.map((r) => [r.id, r]));

  el.filtros.innerHTML = htmlFiltros();
  el.indiceLista.innerHTML = RECEITAS.map((r, i) => htmlCard(r, i + 1)).join("");
  el.receitas.innerHTML = RECEITAS.map((r, i) => htmlReceita(r, i + 1)).join("");
  el.receitas.querySelectorAll("[data-compras]").forEach(atualizarProgresso);
  aplicarFiltros();

  el.filtros.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    estado.filtro = JSON.parse(chip.dataset.filtro);
    aplicarFiltros();
  });

  el.busca.addEventListener("input", () => {
    estado.termo = normalizar(el.busca.value.trim());
    aplicarFiltros();
  });

  el.receitas.addEventListener("change", (e) => {
    const input = e.target;
    if (input.type !== "checkbox") return;
    const secao = input.closest("[data-compras]");
    definirMarcado(secao.dataset.compras, input.dataset.item, input.checked);
    atualizarProgresso(secao);
  });

  el.receitas.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-acao]");
    if (!botao) return;
    const secao = botao.closest("[data-compras]");
    acoes[botao.dataset.acao](receitaPorId.get(secao.dataset.compras), secao);
  });

  const atualizarAlturaTopo = () => {
    document.documentElement.style.setProperty("--topo-h", `${el.topo.offsetHeight}px`);
  };
  atualizarAlturaTopo();
  if ("ResizeObserver" in window) new ResizeObserver(atualizarAlturaTopo).observe(el.topo);

  const atualizarVoltar = () => {
    el.voltar.hidden = window.scrollY < 600;
  };
  window.addEventListener("scroll", atualizarVoltar, { passive: true });
  atualizarVoltar();

  if (location.hash) {
    const alvo = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (alvo) alvo.scrollIntoView();
  }

  el.voltar.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0 });
    history.replaceState(null, "", location.pathname + location.search);
  });
})();
