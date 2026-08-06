export interface Produto {
  id: number
  produto: string
  quantidade: number
  valorUnitario: number
}

export interface Pedido {
  id: number
  cliente: string
  itens: Produto[]
  status: StatusPedido
  observacoes: string
  criadoEm: string
  atualizadoEm: string
}

export interface ItemPedidoInput {
  id?: number
  produto: string
  quantidade: number
  valorUnitario: number
}

export interface NovoPedido {
  cliente: string
  observacoes: string
  itens: ItemPedidoInput[]
}

export interface AtualizarPedido {
  id: number
  cliente: string
  observacoes: string
  itens: ItemPedidoInput[]
}

export type StatusPedido = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'

export const STATUS_LABELS: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export function calcularTotalPedido(pedido: Pick<Pedido, 'itens'>): number {
  return pedido.itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0)
}




