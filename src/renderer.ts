import './style.css'

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>;
    };
  }
}

const appElement = document.getElementById('app') as HTMLDivElement

appElement.innerHTML = `
  <h1>Sistema de gerenciamento de pedidos</h1>
  <button id="btn-gerenciamento">Gerenciar pedidos</button>
  <p id="resposta">Aguardando interação...</p>
`

const button = document.getElementById('btn-gerenciamento') as HTMLButtonElement
const resposta = document.getElementById('resposta') as HTMLParagraphElement

button.addEventListener('click', async () => {
  resposta.textContent = 'Enviando resposta...'
  try {
    const retorno = await window.api.ping()
    resposta.textContent = `Resposta: ${retorno}`
  } catch (erro) {
    resposta.textContent = 'Erro ao enviar resposta.'
    console.error(erro)
  }
})

// Necessario para que o TypeScript trate este arquivo como modulo ES,
// tornando o 'declare global {}' acima valido.
export {}
