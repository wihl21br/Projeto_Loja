const frmLogin = document.querySelector(".formLogin");
const frmCadastro = document.querySelector(".formCadastro");
const divProdutos = document.querySelector(".vitrineItems");
const divInformacao = document.querySelector("#informacao");
let produtosGlobais = [];

const listaCarrinho = document.querySelector("#lista-carrinho");
const totalCarrinho = document.querySelector("#total-carrinho");
const btnLimparCarrinho = document.querySelector("#btn-limpar-carrinho");
const btnFinalizar = document.querySelector("#btn-finalizar");

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

// fetch POST para o login
if (frmLogin) {
  frmLogin.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: frmLogin.nome.value,
        password: frmLogin.password.value,
      }),
    });
    if (response.status === 404) return alert("Usuário não encontrado");
    if (response.status === 401) return alert("Senha incorreta");

    if (response.ok) {
      const data = await response.json();
      window.location.href = data.id_importancia === 1 ? "/admin" : "/loja";
      return;
    }
    alert("Erro ao fazer login");
  });
}

// fetch POST para o cadastro
if (frmCadastro) {
  frmCadastro.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const response = await fetch("/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: frmCadastro.nome.value,
        email: frmCadastro.email.value,
        password: frmCadastro.password.value,
        telefone: frmCadastro.telefone.value,
      }),
    });

    if (response.ok) {
      frmCadastro.reset();
      return alert("Cadastro realizado com sucesso!");
    }

    alert("Erro ao realizar cadastro");
  });
}

async function carregarProdutos() {
  if (!divProdutos) return;
  const response = await fetch("/produtos");
  if (!response.ok) return;
  produtosGlobais = await response.json();
  mostrarVitrine(produtosGlobais);
}

// Mostrando vitrine
function mostrarVitrine(produtos) {
  divProdutos.innerHTML = "";
  if (produtos.length === 0) {
    divProdutos.innerHTML = "<p>Nenhum produto cadastrado no momento.</p>";
    return;
  }
  
  const ehAdmin = document.querySelector("#frmProduto"); // só o admin vê o botão Excluir
  produtos.forEach((produto) => {
    divProdutos.innerHTML += `
      <div class="card-produto">
        ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}" />` : ""}
        <h3>${produto.nome}</h3>
        <p><strong>R$ ${Number(produto.preco).toFixed(2)}</strong></p>
        <button class="btn-info" data-id="${produto.id}">Mais Informações</button>
        ${!ehAdmin ? `<button class="btn-comprar" data-id="${produto.id}">Adicionar ao Carrinho</button>` : ""}
        ${ehAdmin ? `<button class="btn-excluir" data-id="${produto.id}">Excluir</button>` : ""}
      </div>
    `;
  });
}

if (divProdutos) {
  divProdutos.addEventListener("click", async (ev) => {
    const idProduto = Number(ev.target.getAttribute("data-id"));
    if (ev.target.classList.contains("btn-comprar")) {
      const produto = produtosGlobais.find((p) => p.id === idProduto);
      if (produto) {
        adicionarAoCarrinho(produto);
      }
    }
    if (ev.target.classList.contains("btn-info")) {
      const produto = produtosGlobais.find((p) => p.id === idProduto);
      if (produto && divInformacao) {
        divInformacao.innerHTML = `
          <div class="detalhes-card">
            <h3>Detalhes: ${produto.nome}</h3>
            <p><strong>Preço:</strong> R$ ${Number(produto.preco).toFixed(2)}</p>
            <p><strong>Estoque:</strong> ${produto.estoque}</p>
            <p><strong>Descrição:</strong> ${produto.descricao || "Sem descrição."}</p>
            <p><strong>Validade:</strong> ${produto.data_validade || "Não informada"}</p>
            <button id="fechar-info">Fechar</button>
          </div>
        `;

        //Botão para fechar/limpar os detalhes
        document.getElementById("fechar-info").addEventListener("click", () => {
          divInformacao.innerHTML = "";
        });
      }
    }

    // excluir um produto
    if (ev.target.classList.contains("btn-excluir")) {
      const response = await fetch(`/produtos`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: idProduto })
      });
      if (response.ok) {
        alert("Excluído com sucesso");
        carregarProdutos();
      } else {
        alert("Erro ao excluir produto");
      }
    }
  });
}

carregarProdutos();

const frmProduto = document.querySelector("#frmProduto");
if (frmProduto) {
  frmProduto.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const response = await fetch("/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: frmProduto.nome.value,
        preco: frmProduto.preco.value,
        estoque: frmProduto.estoque.value,
        descricao: frmProduto.descricao.value,
        data_validade: frmProduto.data_validade.value,
        imagem: frmProduto.imagem.value,
      }),
    });

    if (response.ok) {
      alert("Produto cadastrado com sucesso!");
      frmProduto.reset();
      carregarProdutos();
      return;
    }

    alert("Erro ao cadastrar produto");
  });
}



function adicionarAoCarrinho(produto) {
  const itemExistente = carrinho.find((item) => item.id === produto.id);
  const qtdAtual = itemExistente ? itemExistente.quantidade : 0;
if (qtdAtual >= produto.estoque) return alert("Não há mais estoque deste produto");
  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      quantidade: 1
    });
  }

  salvarEAtualizarCarrinho();
}

function removerDoCarrinho(idProduto) {
  carrinho = carrinho.filter((item) => item.id !== idProduto);
  salvarEAtualizarCarrinho();
}

function salvarEAtualizarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  renderizarCarrinho();
}

function renderizarCarrinho() {
  if (!listaCarrinho) return;
  listaCarrinho.innerHTML = "";
  let total = 0;
  if (carrinho.length === 0) {
    listaCarrinho.innerHTML = "<p>O carrinho está vazio.</p>";
    totalCarrinho.textContent = "0.00";
    return;
  }

  carrinho.forEach((item) => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;

    listaCarrinho.innerHTML += `
      <div class="item-carrinho" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>${item.nome} (${item.quantidade}x) - R$ ${subtotal.toFixed(2)}</span>
        <button class="btn-remover" data-id="${item.id}">Remover</button>
      </div>
    `;
  });

  totalCarrinho.textContent = total.toFixed(2);
}

if (btnLimparCarrinho) {
  btnLimparCarrinho.addEventListener("click", () => {
    carrinho = [];
    salvarEAtualizarCarrinho();
  });
}

if (btnFinalizar) {
  btnFinalizar.addEventListener("click", () => {
    if (carrinho.length === 0) return alert("Seu carrinho está vazio!");
    alert(`Compra finalizada! Total: R$ ${totalCarrinho.textContent}`);
    carrinho = [];
    salvarEAtualizarCarrinho();
  });
}
renderizarCarrinho();