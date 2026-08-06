import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { AtualizarPedido, ItemPedidoInput, NovoPedido, Pedido, Produto, StatusPedido } from './type'

export class PedidosStore {
  private readonly arquivo: string
  private cache: Pedido[] | null = null
  private ultimoId = 0

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

    this.ultimoId = this.calcularMaiorIdExistente(this.cache)
    return this.cache
  }

  private calcularMaiorIdExistente(pedidos: Pedido[]): number {
    let maior = 0
    for (const pedido of pedidos) {
      maior = Math.max(maior, pedido.id)
      for (const item of pedido.itens) {
        maior = Math.max(maior, item.id)
      }
    }
    return maior
  }

  private proximoId(): number {
    this.ultimoId += 1
    return this.ultimoId
  }

  private montarItens(itens: ItemPedidoInput[]): Produto[] {
    return itens.map((item) => ({
      id: item.id ?? this.proximoId(),
      produto: item.produto.trim(),
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
    }))
  }

  private async salvar(): Promise<void> {
    if (!this.cache) return
    await fs.mkdir(path.dirname(this.arquivo), { recursive: true })
    await fs.writeFile(this.arquivo, JSON.stringify(this.cache, null, 2), 'utf-8')
  }

  async listar(): Promise<Pedido[]> {
    const pedidos = await this.carregar()
    return [...pedidos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }

  async criar(input: NovoPedido): Promise<Pedido> {
    const pedidos = await this.carregar()
    const agora = new Date().toISOString()

    const novoPedido: Pedido = {
      id: this.proximoId(),
      cliente: input.cliente.trim(),
      observacoes: input.observacoes.trim(),
      status: 'pendente',
      itens: this.montarItens(input.itens),
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
    const atualizado: Pedido = {
      ...existente,
      cliente: input.cliente.trim(),
      observacoes: input.observacoes.trim(),
      itens: this.montarItens(input.itens),
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
