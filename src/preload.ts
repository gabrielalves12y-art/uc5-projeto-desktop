import { contextBridge, ipcRenderer } from 'electron'
import type { AtualizarPedido, NovoPedido, Pedido, StatusPedido } from './types'

const api = {
  listarPedidos: (): Promise<Pedido[]> => ipcRenderer.invoke('pedidos:listar'),

  criarPedido: (input: NovoPedido): Promise<Pedido> => ipcRenderer.invoke('pedidos:criar', input),

  atualizarPedido: (input: AtualizarPedido): Promise<Pedido> =>
    ipcRenderer.invoke('pedidos:atualizar', input),

  atualizarStatusPedido: (id: number, status: StatusPedido): Promise<Pedido> =>
    ipcRenderer.invoke('pedidos:atualizar-status', id, status),

  excluirPedido: (id: number): Promise<void> => ipcRenderer.invoke('pedidos:excluir', id),
}

contextBridge.exposeInMainWorld('api', api)

export type PedidosApi = typeof api

