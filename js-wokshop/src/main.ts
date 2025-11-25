import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

import { searchWorkshops } from './api.js'
import { renderList, updateMeta, renderLoading, debounce } from './dom.js'

const form = document.getElementById('search-form') as HTMLFormElement;
const input = document.getElementById('q') as HTMLInputElement;
const results = document.getElementById('results') as HTMLElement;
const meta = document.getElementById('meta') as HTMLElement;

function toast(text: string, kind = 'info') {
  const bg = { info: '#3b82f6', ok: '#10b981', warn: '#f59e0b', err: '#ef4444' }[kind] ?? '#3b82f6'
  Toastify({ text, gravity: 'top', position: 'right', backgroundColor: bg, duration: 2400 }).showToast()
}

async function runSearch(term: string) {
  const q = term.trim()
  if (!q) {
    updateMeta(meta, 'Digite um termo para buscar.')
    renderList(results, [])
    toast('Campo de busca vazio.', 'warn')
    return
  }

  updateMeta(meta, 'Carregando…')
  renderLoading(results)

  try {
    const items = await searchWorkshops(q)
    renderList(results, items)
    updateMeta(meta, `Encontrados ${items?.length ?? 0} resultado(s) para “${q}”.`)
    toast('Busca concluída.', 'ok')
  } catch (err) {
    console.error(err)
    renderList(results, [])
    updateMeta(meta, '')
    toast('Erro ao buscar. Confira console/Network.', 'err')
  }
}

// Submit on-demand
form.addEventListener('submit', (e) => { e.preventDefault(); runSearch(input.value) })

// Busca reativa com debounce
const debounced = debounce(() => runSearch(input.value), 500)
input.addEventListener('input', debounced)
