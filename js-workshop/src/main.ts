import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

import { searchWorkshops } from './api.js'
import { renderList, updateMeta, renderLoading, debounce } from './dom.js'

import type { NewWorkshop, Workshop } from './api.js';
import { createWorkshop } from './api.js';

const form = document.getElementById('search-form') as HTMLFormElement;
const input = document.getElementById('q') as HTMLInputElement;
const results = document.getElementById('results') as HTMLElement;
const meta = document.getElementById('meta') as HTMLElement;

// Converte 'YYYY-MM-DDTHH:mm' local para ISO (UTC ou local → decida e mantenha consistente)
function toIsoFromLocal(input: string): string {
  if (!input) throw new Error('Data/hora inválida.');
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new Error('Formato de data/hora inválido.');
  return d.toISOString();
}

// Lê e valida o formulário; retorna NewWorkshop ou lança Error com mensagem amigável
function parseNewWorkshopFromForm(): NewWorkshop {
  // Captura os elementos do formulário
  const titleInput = document.getElementById('title') as HTMLInputElement;
  const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
  const startAtInput = document.getElementById('startAt') as HTMLInputElement;
  const endAtInput = document.getElementById('endAt') as HTMLInputElement;
  const isOnlineInput = document.getElementById('isOnline') as HTMLInputElement;
  const locationInput = document.getElementById('location') as HTMLInputElement;
  const capacityInput = document.getElementById('capacity') as HTMLInputElement;

  // 1) Valida title: string não vazia (tamanho mínimo: 5)
  const title = titleInput?.value.trim() || '';
  if (title.length < 5) {
    throw new Error('O título deve ter pelo menos 5 caracteres.');
  }

  // Valida description: string não vazia
  const description = descriptionInput?.value.trim() || '';
  if (!description) {
    throw new Error('A descrição é obrigatória.');
  }

  // 2) Valida e converte startAt e endAt
  const startAtValue = startAtInput?.value || '';
  const endAtValue = endAtInput?.value || '';

  if (!startAtValue) {
    throw new Error('A data/hora de início é obrigatória.');
  }
  if (!endAtValue) {
    throw new Error('A data/hora de término é obrigatória.');
  }

  let startAt: string;
  let endAt: string;

  try {
    startAt = toIsoFromLocal(startAtValue);
  } catch (e) {
    throw new Error('Data/hora de início inválida.');
  }

  try {
    endAt = toIsoFromLocal(endAtValue);
  } catch (e) {
    throw new Error('Data/hora de término inválida.');
  }

  // Valida que startAt < endAt
  if (new Date(startAt) >= new Date(endAt)) {
    throw new Error('A data de início deve ser anterior à data de término.');
  }

  // 3) isOnline: boolean do checkbox
  const isOnline = isOnlineInput?.checked || false;

  // 4) location: se isOnline=false, exigir preenchido; senão, null
  const locationValue = locationInput?.value.trim() || '';
  let location: string | null = null;

  if (!isOnline) {
    if (!locationValue) {
      throw new Error('O local é obrigatório para workshops presenciais.');
    }
    location = locationValue;
  }

  // 5) capacity: number >= 1 (se fornecido)
  let capacity: number | undefined = undefined;
  const capacityValue = capacityInput?.value;

  if (capacityValue) {
    const capacityNum = parseInt(capacityValue, 10);
    if (isNaN(capacityNum) || capacityNum < 1) {
      throw new Error('A capacidade deve ser um número maior ou igual a 1.');
    }
    capacity = capacityNum;
  }

  // 6) Retorna objeto NewWorkshop
  return {
    title,
    description,
    startAt,
    endAt,
    isOnline,
    location: isOnline ? undefined : location!,
    capacity,
  };
}

// function toast(text: string, kind = 'info') {
//   const bg = { info: '#3b82f6', ok: '#10b981', warn: '#f59e0b', err: '#ef4444' }[kind] ?? '#3b82f6'
//   Toastify({ text, gravity: 'top', position: 'right', backgroundColor: bg, duration: 2400 }).showToast()
// }

function toast(text: string, kind: 'info' | 'ok' | 'warn' | 'err' = 'info') {
  const bg: Record<string, string> = {
    info: '#3b82f6', ok: '#10b981', warn: '#f59e0b', err: '#ef4444'
  };
  Toastify({ text, gravity: 'top', position: 'right', backgroundColor: bg[kind], duration: 2400 }).showToast();
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
//form.addEventListener('submit', (e) => { e.preventDefault(); runSearch(input.value) })

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const payload = parseNewWorkshopFromForm();
    
    // Chama a API para criar o workshop
    await createWorkshop(payload);
    
    // Limpa o formulário
    form.reset();
    
    // Feedback positivo
    toast('Workshop inserido com sucesso!', 'ok');
    
    // Recarrega a lista de workshops para mostrar o novo item
    // Assume que existe uma função para buscar/renderizar a lista
    // Se você tiver uma função como loadWorkshops() ou searchWorkshops(), chame aqui
    // Exemplo: await loadWorkshops();
    
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'Erro ao inserir';
    toast(msg, 'err');
  }
});

// Busca reativa com debounce
const debounced = debounce(() => runSearch(input.value), 500)
input.addEventListener('input', debounced)


