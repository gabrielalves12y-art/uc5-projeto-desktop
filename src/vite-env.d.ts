/// <reference types="vite/client" />

import type { PedidosApi } from './preload'

declare global {
  interface Window {
    api: PedidosApi
  }
}

export {}
