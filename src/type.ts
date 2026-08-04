
export interface Produto {
  id: string
  nome: string
  preco: number
}

export interface Pedido {
  id: number
  cliente: string
  itens: ItemPedido[]
  status: StatusPedido
  observacoes: string
  criadoEm: string
  atualizadoEm: string
}

export interface NovoPedido {
  cliente: string
  observacoes: string
  itens: Array<{ produto: string; quantidade: number; valorUnitario: number }>
}

export interface AtualizarPedido {
  id: number
  cliente: string
  observacoes: string
  itens: Array<{ produto: string; quantidade: number; valorUnitario: number }>
}

export type StatusPedido = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';

export const STATUS_LABELS: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}






