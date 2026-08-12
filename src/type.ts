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

export interface ProdutoPredefinido {
  id: number
  nome: string
  categoria: string
  valorUnitario: number
}

export const PRODUTOS_PREDEFINIDOS: ProdutoPredefinido[] = [
  { id: 1, nome: 'Café', categoria: 'Bebidas Quentes', valorUnitario: 2.5 },
  { id: 2, nome: 'Chá', categoria: 'Bebidas Quentes', valorUnitario: 2.0 },
  { id: 3, nome: 'Suco', categoria: 'Bebidas Frias', valorUnitario: 2.5 },
  { id: 4, nome: 'Refrigerante', categoria: 'Bebidas Frias', valorUnitario: 5.0 },
  { id: 5, nome: 'Água', categoria: 'Bebidas Frias', valorUnitario: 2.0 },
  { id: 6, nome: 'Sanduíche', categoria: 'Lanches', valorUnitario: 12.0 },
  { id: 7, nome: 'Coxinha', categoria: 'Lanches', valorUnitario: 3.0 },
  { id: 8, nome: 'Salsichão', categoria: 'Lanches', valorUnitario: 4.0 },
  { id: 9, nome: 'Hambúrguer', categoria: 'Lanches', valorUnitario: 5.0 },
  { id: 10, nome: 'Fatia de Bolo', categoria: 'Lanches', valorUnitario: 2.0 },
  { id: 11, nome: 'Torta', categoria: 'Lanches', valorUnitario: 3.5 },
  {id: 12, nome: 'Fatia de Pizza', categoria: 'Lanches', valorUnitario: 4.0 },
  { id: 13, nome: 'Salada', categoria: 'Lanches', valorUnitario: 6.0 },
]

export function calcularTotalPedido(pedido: Pick<Pedido, 'itens'>): number {
  return pedido.itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0)
}