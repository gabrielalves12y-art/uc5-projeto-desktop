import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'node:path'
import { PedidosStore } from './gerenciador'
import type { AtualizarPedido, NovoPedido, StatusPedido } from './type'

const pedidosStore = new PedidosStore(app.getPath('userData'))

function criarJanela(): void {
  const janela = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Gerenciamento de Pedidos',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    janela.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    janela.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Meu sistema de gerenciamento de pedidos',
      submenu: [
        {
          label: 'Visualizar pedidos',
          click: () => {
            console.log('Visualizar pedidos clicado')
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Sair' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
      ],
    },
  ])

  Menu.setApplicationMenu(menu)
}

ipcMain.handle('pedidos:listar', async () => {
  return pedidosStore.listar()
})

ipcMain.handle('pedidos:criar', async (_evento, input: NovoPedido) => {
  if (!input.cliente?.trim()) {
    throw new Error('Informe o cliente do pedido.')
  }
  if (!input.itens?.length) {
    throw new Error('O pedido precisa de ao menos um item.')
  }
  return pedidosStore.criar(input)
})

ipcMain.handle('pedidos:atualizar', async (_evento, input: AtualizarPedido) => {
  if (!input.cliente?.trim()) {
    throw new Error('Informe o cliente do pedido.')
  }
  if (!input.itens?.length) {
    throw new Error('O pedido precisa de ao menos um item.')
  }
  return pedidosStore.atualizar(input)
})

ipcMain.handle('pedidos:atualizar-status', async (_evento, id: number, status: StatusPedido) => {
  return pedidosStore.atualizarStatus(id, status)
})

ipcMain.handle('pedidos:excluir', async (_evento, id: number) => {
  await pedidosStore.excluir(id)
})

app.whenReady().then(() => {
  createMenu()
  criarJanela()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      criarJanela()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})