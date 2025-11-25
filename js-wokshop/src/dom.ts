import type { Workshop } from './api';

export function renderList(container: HTMLElement, items: Workshop[] = []) {
  container.innerHTML = ''
  if (!Array.isArray(items) || items.length === 0) {
    container.insertAdjacentHTML('beforeend',
      `<p class="text-slate-400">Nenhum resultado.</p>`)
    return
  }
  const html = items.map(toCardHtml).join('')
  container.insertAdjacentHTML('beforeend', html)
}

export function updateMeta(el: HTMLElement, text = '') { el.textContent = text }

export function renderLoading(container: HTMLElement) {
  const skeleton = Array.from({ length: 6 }).map(() =>
    `<div class="h-28 rounded-2xl bg-white/5 ring-1 ring-white/10 animate-pulse"></div>`
  ).join('')
  container.innerHTML = `<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">${skeleton}</div>`
}

export function debounce(fn: (...args: any[])=> Promise<void>, ms = 350) {  
  let t: number | undefined; 
  return (...args: any[] ) => {clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

function toCardHtml(w: Workshop) {
  const title = escapeHtml(w?.Title ?? 'Sem título')
  const where = w?.IsOnline ? 'Online' : escapeHtml(w?.Location ?? 'Presencial')
  const dt = formatDateRange(w?.StartAt, w?.EndAt)
  const isOnlineDecorator = w?.IsOnline ?  'bg-blue-700' : 'bg-purple-700'

  return /* html */`
    <article class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 shadow-md hover:bg-white/7.5 transition">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs px-2 py-0.5 rounded-full text-slate-200 ring-1 ring-white/10 ${isOnlineDecorator}">${where}</span>
      </div>
      <h3 class="text-lg font-medium mb-1">${title}</h3>
      <p class="text-sm text-slate-400">${dt}</p>
    </article>
  `
}

function formatDateRange(a: string | number | Date, b: string | number | Date) {
  try { return `${new Date(a).toLocaleString()} — ${new Date(b).toLocaleString()}` }
  catch { return '' }
}

function escapeHtml(s = '') { const d = document.createElement('div'); d.textContent = s; return d.innerHTML }
