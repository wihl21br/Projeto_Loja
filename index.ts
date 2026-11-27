import principal from "./index.html";
import loja from "./loja.html";
import adminis from "./Loja_administrador.html";
import { db } from "./db";

const loggedUsers: any = {};

function VerifAdmin(req: any) {
  const uuid = req.cookies.get("ses");
  const user = uuid ? loggedUsers[uuid] : null;
  return user && user.id_importancia === 1;
}

const srv = Bun.serve({
  port: 3000,
  routes: {
    "/": principal,
    "/loja": loja,
    "/admin": adminis,
    "/cadastro": {
      POST: async (req) => {
        const body = await req.body?.json();
        const config = db.query("SELECT admin_criado FROM configuracoes WHERE id=1").get() as { admin_criado: number } | null;
        const importancia = !config || config.admin_criado === 0 ? 1 : 2;
        const query = db.query(`
          INSERT INTO usuarios(nome, email, password_hash, telefone, id_importancia)
          VALUES(:nome, :email, :password_hash, :telefone, :id_importancia)
        `);
        const passwordHash = await Bun.password.hash(body.password);
        const dbResp = query.run({":nome": body.nome,":email": body.email,":password_hash": passwordHash,":telefone": body.telefone || "",":id_importancia": importancia,
        });

        if (importancia === 1) {
          db.query("UPDATE configuracoes SET admin_criado=1 WHERE id=1").run();
        }

        return Response.json({
          message: "cadastrar",
          dbResp,
        });
      },
    },
    "/login": {
      POST: async (req) => {
        const body = await req.body?.json();
        const query = db.query(`SELECT * FROM usuarios WHERE nome=:nome LIMIT 1`,);
        const data: any = query.get({ ":nome": body.nome });

        if (!data) {
          return Response.json(
            { msg: "usuário não encontrado" },
            { status: 404 },
          );
        }

        const isMatch = await Bun.password.verify(
          body.password,
          data.password_hash,
        );
        if (!isMatch) {
          return Response.json({ msg: "senha incorreta" }, { status: 401 });
        }

        const uuid = crypto.randomUUID();
        delete data.password_hash;
        loggedUsers[uuid] = data;
        req.cookies.set("ses", uuid);
        return Response.json({ ok: true, id_importancia: data.id_importancia });
      },
    },
    "/user/:id": {
      GET: (req) => {
        const uuid = req.cookies.get("ses");
        const logado = uuid ? loggedUsers[uuid] : null;
        if (!logado) {
        return Response.redirect("/")
        }
        const userId = req.params.id;
        if (logado.id_importancia !== 1 && String(logado.id) !== userId) {
          return Response.json({ msg: "Sem permissão" }, { status: 403 });
        }
        const user = db.query( "SELECT id, nome, email, telefone, id_importancia FROM usuarios WHERE id = :id",).get({ ":id": userId });
        if (!user) {
          return Response.json(
            { msg: "Usuário não encontrado" },
            { status: 404 },
          );
        }
        return Response.json(user);
      },
    },
    "/produtos": {
      GET: () => {
        const products = db.query("SELECT * FROM produtos").all();
        return Response.json(products);
      },
      POST: async (req) => {
        if (!VerifAdmin(req)) {
          return Response.json({ msg: "Sem permissão" }, { status: 403 });
        }
        const body = await req.body?.json();
        const query = db.query(`
            INSERT INTO produtos(nome, descricao, preco, data_validade, data_cadastro, estoque, imagem, categoria)
            VALUES(:nome, :descricao, :preco, :data_validade, :data_cadastro, :estoque, :imagem, :categoria)
          `);

        const dbResp = query.run({":nome": body.nome,":descricao": body.descricao || "",":preco": Number(body.preco),":data_validade": body.data_validade || null,":data_cadastro": new Date().toISOString(),":estoque": Number(body?.estoque || 0),":imagem": body.imagem || null,":categoria": body.categoria || null,
        });

        return Response.json(
          { message: "Produto cadastrado", dbResp },
          { status: 201 },
        );
      },
      DELETE: async (req) => {
        if (!VerifAdmin(req)) {
          return Response.json({ msg: "Sem permissão" }, { status: 403 });
        }
        const body = await req.body?.json();
        const query = db.query("DELETE FROM produtos WHERE id = :id");
        const dbResp = query.run({ ":id": body.id });
        return Response.json({ message: "Produto excluído", dbResp });
      },
    },
  },
});

console.log(`Servidor em ${srv.url}`);
