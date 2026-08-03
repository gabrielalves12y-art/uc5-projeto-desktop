interface Produtos {
  id: number;
  nome: string;
  preco: number;
  descricao: string;
  categoria: string;
}

interface Cliente {
  id: number;
  nome: string;
  telefone?: string;
  endereco: string;
}

interface Pedido {
  id: number;
  Idcliente: number;
  data: Date;
  Idprodutos: number[];
}

interface Itens_do_pedido {
  id: number;
  Idpedido: number; 
  Idproduto: number;
  quantidade: number;
}

export { Produtos, Cliente, Pedido, Itens_do_pedido };