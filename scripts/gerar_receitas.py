#!/usr/bin/env python3
"""Gera o catálogo estático e as compras a partir das fichas editoriais.

Sem rede e sem dependências externas. O coletor da playlist não sobrescreve
as fichas: medidas e adaptações exigem revisão editorial.
"""
import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATEGORIAS = ['Recentes', 'Pratos principais', 'Entradas e pastas', 'Pães e wraps', 'Biscoitos e crackers', 'Doces e lanches']

def gerar():
    receitas = json.loads((ROOT / 'data/receitas.json').read_text())
    nutrientes = json.loads((ROOT / 'data/nutrientes.json').read_text())['alimentos']
    saida = []
    for original in receitas:
        r = deepcopy(original)
        r['compras'] = [
            {'secao': g['titulo'], 'itens': [i for i in g['itens'] if not i.startswith('Água:')]}
            for g in r['ingredientes']
        ]
        r['compras'] = [g for g in r['compras'] if g['itens']]
        if r.get('nutricaoAutor'):
            r['nutricao'] = {**r['nutricaoAutor'], 'origem': 'autor'}
        else:
            total = {k: 0 for k in ['kcal', 'prot', 'carb', 'gord', 'fibras']}
            for alimento, gramas in r['baseNutricional'].items():
                for k in total:
                    total[k] += nutrientes[alimento]['por100g'][k] * gramas / 100
            # Arredondar calorias a 5 kcal evita precisão incompatível com as hipóteses.
            valores = {k: round(v / r['porcoes'], 1) for k, v in total.items()}
            valores['kcal'] = int(round(total['kcal'] / r['porcoes'] / 5) * 5)
            r['nutricao'] = {**valores, 'origem': 'estimativa', 'nota': r.get('notaNutricional') or 'Estimativa pelos ingredientes e pela porção indicada. Marcas, umidade e tamanho final alteram os valores; opcionais não incluídos.'}
        for k in ['baseNutricional', 'nutricaoAutor', 'notaNutricional']:
            r.pop(k, None)
        saida.append(r)
    return ('// Gerado por scripts/gerar_receitas.py. Edite data/receitas.json.\n'
            + '// Recentes fica no início. Essas fichas guardam categoriaBase para voltar à categoria editorial.\n'
            + 'const CATEGORIAS = ' + json.dumps(CATEGORIAS, ensure_ascii=False) + ';\n\n'
            + 'const RECEITAS = ' + json.dumps(saida, ensure_ascii=False, indent=2) + ';\n')

if __name__ == '__main__':
    (ROOT / 'js/receitas.js').write_text(gerar(), encoding='utf-8')
    print('Catálogo gerado: 20 receitas, compras e nutrição por porção.')
