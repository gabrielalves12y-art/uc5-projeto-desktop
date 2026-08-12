import './style.css'
import { calcularTotalPedido, STATUS_LABELS, PRODUTOS_PREDEFINIDOS } from './type'
import type { Pedido, StatusPedido } from './type'

const corpoTabela = document.getElementById('corpo-tabela-pedidos') as HTMLTableSectionElement
const mensagemListaVazia = document.getElementById('mensagem-lista-vazia') as HTMLParagraphElement
const cardsResumo = document.getElementById('resumo-cards') as HTMLElement

const campoBusca = document.getElementById('filtro-busca') as HTMLInputElement
const campoFiltroStatus = document.getElementById('filtro-status') as HTMLSelectElement

const botaoNovoPedido = document.getElementById('botao-novo-pedido') as HTMLButtonElement
const dialogoPedido = document.getElementById('dialogo-pedido') as HTMLDialogElement
const formularioPedido = document.getElementById('formulario-pedido') as HTMLFormElement
const tituloDialogo = document.getElementById('titulo-dialogo-pedido') as HTMLHeadingElement
const campoCliente = document.getElementById('campo-cliente') as HTMLInputElement
const campoObservacoes = document.getElementById('campo-observacoes') as HTMLTextAreaElement
const listaItens = document.getElementById('lista-itens') as HTMLDivElement
const botaoAdicionarItem = document.getElementById('botao-adicionar-item') as HTMLButtonElement
const totalFormulario = document.getElementById('total-formulario') as HTMLElement
const erroFormulario = document.getElementById('erro-formulario') as HTMLParagraphElement
const botaoCancelarPedido = document.getElementById('botao-cancelar-pedido') as HTMLButtonElement

let pedidos: Pedido[] = []
let idPedidoEmEdicao: number | null = null

interface LinhaItemRefs {
  id?: number
  linha: HTMLDivElement
  selectProduto: HTMLSelectElement
  quantidade: HTMLInputElement
  valorUnitario: HTMLInputElement
}

let linhasItens: LinhaItemRefs[] = []

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor)
}

function formatarData(isoString: string): string {
  return formatadorData.format(new Date(isoString))
}

async function carregarPedidos(): Promise<void> {
  pedidos = await window.api.listarPedidos()
  renderizarResumo()
  renderizarTabela()
}

function pedidosFiltrados(): Pedido[] {
  const busca = campoBusca.value.trim().toLowerCase()
  const status = campoFiltroStatus.value as StatusPedido | 'todos'
  return pedidos.filter((pedido) => {
    const combinaBusca = busca === '' || pedido.cliente.toLowerCase().includes(busca)
    const combinaStatus = status === 'todos' || pedido.status === status
    return combinaBusca && combinaStatus
  })
}

function renderizarResumo(): void {
  const total = pedidos.length
  const valorTotal = pedidos.reduce((soma, p) => soma + calcularTotalPedido(p), 0)
  const contagemPorStatus: Record<StatusPedido, number> = {
    pendente: 0,
    em_andamento: 0,
    concluido: 0,
    cancelado: 0,
  }
  for (const pedido of pedidos) {
    contagemPorStatus[pedido.status] += 1
  }
  const cartoes: Array<{ rotulo: string; valor: string }> = [
    { rotulo: 'Total de pedidos', valor: String(total) },
    { rotulo: 'Valor total', valor: formatarMoeda(valorTotal) },
    { rotulo: 'Pendentes', valor: String(contagemPorStatus.pendente) },
    { rotulo: 'Em andamento', valor: String(contagemPorStatus.em_andamento) },
    { rotulo: 'Concluídos', valor: String(contagemPorStatus.concluido) },
  ]
  cardsResumo.innerHTML = ''
  for (const cartao of cartoes) {
    const elemento = document.createElement('div')
    elemento.className = 'card-resumo'
    elemento.innerHTML = `<span class="valor">${cartao.valor}</span><span class="rotulo">${escaparHtml(cartao.rotulo)}</span>`
    cardsResumo.appendChild(elemento)
  }
}

function renderizarTabela(): void {
  const lista = pedidosFiltrados()
  corpoTabela.innerHTML = ''
  mensagemListaVazia.hidden = lista.length > 0
  for (const pedido of lista) {
    corpoTabela.appendChild(criarLinhaTabela(pedido))
  }
}

function criarLinhaTabela(pedido: Pedido): HTMLTableRowElement {
  const linha = document.createElement('tr')

  const celulaCliente = document.createElement('td')
  celulaCliente.textContent = pedido.cliente
  linha.appendChild(celulaCliente)

  const celulaItens = document.createElement('td')
  const resumoItens = pedido.itens.map((item) => `${item.quantidade}x ${item.produto}`).join(', ')
  celulaItens.innerHTML = `<span class="itens-pedido-resumo">${escaparHtml(resumoItens)}</span>`
  linha.appendChild(celulaItens)

  const celulaTotal = document.createElement('td')
  celulaTotal.textContent = formatarMoeda(calcularTotalPedido(pedido))
  linha.appendChild(celulaTotal)

  const celulaStatus = document.createElement('td')
  const seletorStatus = document.createElement('select')
  seletorStatus.className = 'seletor-status-tabela'
  for (const status of Object.keys(STATUS_LABELS) as StatusPedido[]) {
    const opcao = document.createElement('option')
    opcao.value = status
    opcao.textContent = STATUS_LABELS[status]
    opcao.selected = status === pedido.status
    seletorStatus.appendChild(opcao)
  }
  seletorStatus.addEventListener('change', () => {
    void alterarStatus(pedido.id, seletorStatus.value as StatusPedido)
  })
  const selo = document.createElement('span')
  selo.className = 'selo-status'
  selo.dataset.status = pedido.status
  selo.textContent = STATUS_LABELS[pedido.status]
  celulaStatus.appendChild(selo)
  celulaStatus.appendChild(document.createElement('br'))
  celulaStatus.appendChild(seletorStatus)
  linha.appendChild(celulaStatus)

  const celulaData = document.createElement('td')
  celulaData.textContent = formatarData(pedido.criadoEm)
  linha.appendChild(celulaData)

  const celulaAcoes = document.createElement('td')
  celulaAcoes.className = 'coluna-acoes'
  const containerAcoes = document.createElement('div')
  containerAcoes.className = 'linha-acoes'

  const botaoEditar = document.createElement('button')
  botaoEditar.className = 'botao botao-secundario botao-icone'
  botaoEditar.type = 'button'
  botaoEditar.textContent = 'Editar'
  botaoEditar.addEventListener('click', () => abrirDialogoEdicao(pedido))

  const botaoExcluir = document.createElement('button')
  botaoExcluir.className = 'botao botao-perigo botao-icone'
  botaoExcluir.type = 'button'
  botaoExcluir.textContent = 'Excluir'
  botaoExcluir.addEventListener('click', () => void excluirPedido(pedido))

  containerAcoes.appendChild(botaoEditar)
  containerAcoes.appendChild(botaoExcluir)
  celulaAcoes.appendChild(containerAcoes)
  linha.appendChild(celulaAcoes)

  return linha
}

function escaparHtml(texto: string): string {
  const div = document.createElement('div')
  div.textContent = texto
  return div.innerHTML
}

async function alterarStatus(id: number, status: StatusPedido): Promise<void> {
  await window.api.atualizarStatusPedido(id, status)
  await carregarPedidos()
}

async function excluirPedido(pedido: Pedido): Promise<void> {
  const confirmou = window.confirm(`Excluir o pedido de "${pedido.cliente}"? Essa ação não pode ser desfeita.`)
  if (!confirmou) return
  await window.api.excluirPedido(pedido.id)
  await carregarPedidos()
}

function criarLinhaItem(valores?: { id?: number; produto: string; quantidade: number; valorUnitario: number }): void {
  const linha = document.createElement('div')
  linha.className = 'linha-item'

  const selectProduto = document.createElement('select')
  selectProduto.required = true

  for (const p of PRODUTOS_PREDEFINIDOS) {
    const opcao = document.createElement('option')
    opcao.value = p.nome
    opcao.textContent = `${p.nome} — ${formatarMoeda(p.valorUnitario)}`
    opcao.dataset.valor = String(p.valorUnitario)
    selectProduto.appendChild(opcao)
  }

  const quantidade = document.createElement('input')
  quantidade.type = 'number'
  quantidade.placeholder = 'Qtd.'
  quantidade.min = '1'
  quantidade.step = '1'
  quantidade.required = true
  quantidade.value = String(valores?.quantidade ?? 1)

  const valorUnitario = document.createElement('input')
  valorUnitario.type = 'number'
  valorUnitario.placeholder = 'Valor unit.'
  valorUnitario.min = '0'
  valorUnitario.step = '0.01'
  valorUnitario.required = true

  const preencherValorPorProduto = (): void => {
    const opcaoSelecionada = selectProduto.selectedOptions[0]
    if (opcaoSelecionada?.dataset.valor) {
      valorUnitario.value = opcaoSelecionada.dataset.valor
    }
    atualizarTotalFormulario()
  }

  if (valores) {
    const opcaoExistente = Array.from(selectProduto.options).find((o) => o.value === valores.produto)
    if (opcaoExistente) {
      selectProduto.value = valores.produto
      valorUnitario.value = String(valores.valorUnitario)
    } else {
      const opcaoCustom = document.createElement('option')
      opcaoCustom.value = valores.produto
      opcaoCustom.textContent = valores.produto
      opcaoCustom.dataset.valor = String(valores.valorUnitario)
      selectProduto.insertBefore(opcaoCustom, selectProduto.firstChild)
      selectProduto.value = valores.produto
      valorUnitario.value = String(valores.valorUnitario)
    }
  } else {
    preencherValorPorProduto()
  }

  selectProduto.addEventListener('change', preencherValorPorProduto)
  quantidade.addEventListener('input', atualizarTotalFormulario)
  valorUnitario.addEventListener('input', atualizarTotalFormulario)

  const botaoRemover = document.createElement('button')
  botaoRemover.type = 'button'
  botaoRemover.textContent = '✕'
  botaoRemover.title = 'Remover item'
  botaoRemover.addEventListener('click', () => {
    if (linhasItens.length <= 1) return
    linhasItens = linhasItens.filter((ref) => ref.linha !== linha)
    linha.remove()
    atualizarTotalFormulario()
  })

  linha.appendChild(selectProduto)
  linha.appendChild(quantidade)
  linha.appendChild(valorUnitario)
  linha.appendChild(botaoRemover)
  listaItens.appendChild(linha)

  linhasItens.push({ id: valores?.id, linha, selectProduto, quantidade, valorUnitario })
  atualizarTotalFormulario()
}

function atualizarTotalFormulario(): void {
  const total = linhasItens.reduce((soma, ref) => {
    const qtd = Number(ref.quantidade.value) || 0
    const val = Number(ref.valorUnitario.value) || 0
    return soma + qtd * val
  }, 0)
  totalFormulario.textContent = formatarMoeda(total)
}

function limparFormulario(): void {
  campoCliente.value = ''
  campoObservacoes.value = ''
  listaItens.innerHTML = ''
  linhasItens = []
  erroFormulario.hidden = true
  erroFormulario.textContent = ''
  criarLinhaItem()
}

function abrirDialogoCriacao(): void {
  idPedidoEmEdicao = null
  tituloDialogo.textContent = 'Novo pedido'
  limparFormulario()
  dialogoPedido.showModal()
  campoCliente.focus()
}

function abrirDialogoEdicao(pedido: Pedido): void {
  idPedidoEmEdicao = pedido.id
  tituloDialogo.textContent = 'Editar pedido'
  limparFormulario()
  campoCliente.value = pedido.cliente
  campoObservacoes.value = pedido.observacoes
  listaItens.innerHTML = ''
  linhasItens = []
  for (const item of pedido.itens) {
    criarLinhaItem(item)
  }
  dialogoPedido.showModal()
  campoCliente.focus()
}

function coletarItensDoFormulario(): Array<{ id?: number; produto: string; quantidade: number; valorUnitario: number }> {
  return linhasItens.map((ref) => ({
    id: ref.id,
    produto: ref.selectProduto.value.trim(),
    quantidade: Number(ref.quantidade.value),
    valorUnitario: Number(ref.valorUnitario.value),
  }))
}

function validarFormulario(itens: Array<{ produto: string; quantidade: number; valorUnitario: number }>): string | null {
  if (!campoCliente.value.trim()) return 'Informe o nome do cliente.'
  if (itens.length === 0) return 'Adicione ao menos um item ao pedido.'
  for (const item of itens) {
    if (!item.produto) return 'Todo item precisa de um produto selecionado.'
    if (!Number.isFinite(item.quantidade) || item.quantidade <= 0) return 'A quantidade deve ser maior que zero.'
    if (!Number.isFinite(item.valorUnitario) || item.valorUnitario < 0) return 'O valor unitário não pode ser negativo.'
  }
  return null
}

async function salvarPedido(): Promise<void> {
  const itens = coletarItensDoFormulario()
  const mensagemErro = validarFormulario(itens)
  if (mensagemErro) {
    erroFormulario.textContent = mensagemErro
    erroFormulario.hidden = false
    return
  }
  try {
    if (idPedidoEmEdicao) {
      await window.api.atualizarPedido({
        id: idPedidoEmEdicao,
        cliente: campoCliente.value,
        observacoes: campoObservacoes.value,
        itens,
      })
    } else {
      await window.api.criarPedido({
        cliente: campoCliente.value,
        observacoes: campoObservacoes.value,
        itens,
      })
    }
    dialogoPedido.close()
    await carregarPedidos()
  } catch (erro) {
    erroFormulario.textContent = erro instanceof Error ? erro.message : 'Não foi possível salvar o pedido.'
    erroFormulario.hidden = false
  }
}

const botaoTema = document.getElementById('botao-tema') as HTMLButtonElement

function aplicarTema(escuro: boolean): void {
  document.documentElement.dataset.tema = escuro ? 'escuro' : ''
  botaoTema.textContent = escuro ? '☀️' : '🌑'
  botaoTema.title = escuro ? 'Alternar modo claro' : 'Alternar modo noturno'
  localStorage.setItem('tema', escuro ? 'escuro' : 'claro')
}

function inicializarTema(): void {
  const temaSalvo = localStorage.getItem('tema')
  const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches
  aplicarTema(temaSalvo === 'escuro' || (!temaSalvo && prefereEscuro))
}

botaoTema.addEventListener('click', () => {
  aplicarTema(document.documentElement.dataset.tema !== 'escuro')
})

botaoNovoPedido.addEventListener('click', abrirDialogoCriacao)
botaoAdicionarItem.addEventListener('click', () => criarLinhaItem())
botaoCancelarPedido.addEventListener('click', () => dialogoPedido.close())

formularioPedido.addEventListener('submit', (evento) => {
  evento.preventDefault()
  void salvarPedido()
})

campoBusca.addEventListener('input', renderizarTabela)
campoFiltroStatus.addEventListener('change', renderizarTabela)

inicializarTema()
void carregarPedidos()
