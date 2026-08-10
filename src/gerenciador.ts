import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { AtualizarPedido, NovoPedido, Pedido, Produto, StatusPedido } from './type'

export class PedidosStore {
  private readonly arquivo: string
  private cache: Pedido[] | null = null

  constructor(pastaDados: string) {
    this.arquivo = path.join(pastaDados, 'pedidos.json')
  }

  private async carregar(): Promise<Pedido[]> {
    if (this.cache) return this.cache

    try {
      const conteudo = await fs.readFile(this.arquivo, 'utf-8')
      this.cache = JSON.parse(conteudo) as Pedido[]
    } catch {
      this.cache = []
    }

    return this.cache
  }

  private async salvar(): Promise<void> {
    if (!this.cache) return
    await fs.mkdir(path.dirname(this.arquivo), { recursive: true })
    await fs.writeFile(this.arquivo, JSON.stringify(this.cache, null, 2), 'utf-8')
  }

  private proximoIdPedido(pedidos: Pedido[]): number {
    return pedidos.reduce((maior, p) => Math.max(maior, p.id), 0) + 1
  }

  private proximoIdItem(pedidos: Pedido[]): number {
    const maiorExistente = pedidos.reduce((maior, p) => {
      const maiorDoPedido = p.itens.reduce((m, item) => Math.max(m, item.id), 0)
      return Math.max(maior, maiorDoPedido)
    }, 0)
    return maiorExistente + 1
  }

  async listar(): Promise<Pedido[]> {
    const pedidos = await this.carregar()
    return [...pedidos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }

  async criar(input: NovoPedido): Promise<Pedido> {
    const pedidos = await this.carregar()
    const agora = new Date().toISOString()

    let proximoIdItem = this.proximoIdItem(pedidos)
    const itens: Produto[] = input.itens.map((item) => ({
      id: proximoIdItem++,
      produto: item.produto.trim(),
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
    }))

    const novoPedido: Pedido = {
      id: this.proximoIdPedido(pedidos),
      cliente: input.cliente.trim(),
      observacoes: input.observacoes.trim(),
      status: 'pendente',
      itens,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    pedidos.push(novoPedido)
    await this.salvar()
    return novoPedido
  }

  async atualizar(input: AtualizarPedido): Promise<Pedido> {
    const pedidos = await this.carregar()
    const indice = pedidos.findIndex((p) => p.id === input.id)
    if (indice === -1) {
      throw new Error(`Pedido ${input.id} não encontrado`)
    }

    const existente = pedidos[indice]
    let proximoIdItem = this.proximoIdItem(pedidos)

    const itens: Produto[] = input.itens.map((item) => ({
      id: item.id ?? proximoIdItem++,
      produto: item.produto.trim(),
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
    }))

    const atualizado: Pedido = {
      ...existente,
      cliente: input.cliente.trim(),
      observacoes: input.observacoes.trim(),
      itens,
      atualizadoEm: new Date().toISOString(),
    }

    pedidos[indice] = atualizado
    await this.salvar()
    return atualizado
  }

  async atualizarStatus(id: number, status: StatusPedido): Promise<Pedido> {
    const pedidos = await this.carregar()
    const indice = pedidos.findIndex((p) => p.id === id)
    if (indice === -1) {
      throw new Error(`Pedido ${id} não encontrado`)
    }

    pedidos[indice] = {
      ...pedidos[indice],
      status,
      atualizadoEm: new Date().toISOString(),
    }
    await this.salvar()
    return pedidos[indice]
  }

  async excluir(id: number): Promise<void> {
    const pedidos = await this.carregar()
    const indice = pedidos.findIndex((p) => p.id === id)
    if (indice === -1) {
      throw new Error(`Pedido ${id} não encontrado`)
    }

    pedidos.splice(indice, 1)
    await this.salvar()
  }
}