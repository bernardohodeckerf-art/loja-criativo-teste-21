import { useEffect, useState } from "react";
import { Check, Flower2, LogOut, Plus, Trash2, Upload, X } from "lucide-react";
import { api, json } from "@/api";
import { categories, Product } from "@/data";
type Session = {
  authenticated: boolean;
  username?: string;
  csrf?: string;
  configured?: boolean;
};
export default function Admin({ onChange }: { onChange: () => void }) {
  const [session, setSession] = useState<Session | null>(null),
    [products, setProducts] = useState<Product[]>([]),
    [edit, setEdit] = useState<Product | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  useEffect(() => {
    api<Session>("/api/auth/session")
      .then(setSession)
      .catch((e) => setError(e.message));
  }, []);
  const load = () =>
    api<Product[]>("/api/admin/products")
      .then(setProducts)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (session?.authenticated) void load();
  }, [session?.authenticated]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      setSession(
        await api<Session>(
          "/api/auth/login",
          json("POST", {
            username: data.get("username"),
            password: data.get("password"),
          }),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await api("/api/auth/logout", json("POST", {}, session?.csrf));
      setSession({ authenticated: false, configured: true });
      setProducts([]);
      setEdit(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setError("");
    try {
      await api(
        "/api/admin/products" + (edit.version ? "/" + edit.id : ""),
        json(edit.version ? "PUT" : "POST", edit, session?.csrf),
      );
      setEdit(null);
      setNotice("Produto salvo na loja.");
      await load();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(p: Product) {
    if (!window.confirm("Excluir " + p.name + "?")) return;
    setError("");
    try {
      await api(
        "/api/admin/products/" + p.id,
        json("DELETE", { version: p.version }, session?.csrf),
      );
      await load();
      onChange();
      setNotice("Produto excluído.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function photos(files: FileList | null) {
    if (!files?.length || !edit) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      Array.from(files).forEach((f) => body.append("photos", f));
      const result = await api<{ photos: string[] }>("/api/admin/photos", {
        method: "POST",
        headers: { "X-CSRF-Token": session?.csrf || "" },
        body,
      });
      setEdit((p) =>
        p
          ? {
              ...p,
              photos: [...p.photos, ...result.photos].slice(0, 8),
              photo: p.photo || result.photos[0],
            }
          : p,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  if (!session)
    return (
      <section className="section page">
        <h1>Administração</h1>
        <p role="status">{error || "Conectando ao painel…"}</p>
      </section>
    );
  if (!session.authenticated)
    return (
      <section className="section page admin-login">
        <div>
          <Flower2 size={35} />
          <span className="eyebrow">ESPAÇO DAS FLORES · ACESSO RESTRITO</span>
          <h1>Bem-vinda ao seu jardim.</h1>
          <p>Entre para cuidar dos produtos e das fotos da loja.</p>
          {session.configured === false && (
            <div className="notice">
              O acesso administrativo ainda precisa ser configurado pelo
              responsável pelo servidor. Siga a seção de login no README.
            </div>
          )}
          <form onSubmit={login}>
            <label>
              Usuário
              <input
                name="username"
                required
                autoComplete="username"
                maxLength={80}
              />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                maxLength={200}
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button
              className="button green"
              disabled={busy || session.configured === false}
            >
              {busy ? "Entrando…" : "Entrar no painel"}
            </button>
          </form>
        </div>
      </section>
    );
  return (
    <section className="section page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">PAINEL DA LOJA · {session.username}</span>
          <h1>Seu jardim, seus cuidados.</h1>
        </div>
        <button className="text-link dark" onClick={logout}>
          <LogOut size={16} /> Sair
        </button>
      </div>
      <p>
        Os produtos são salvos no servidor e ficam disponíveis para todos os
        visitantes.
      </p>
      {!edit && error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <button
        className="button green"
        onClick={() => {
          setError("");
          setEdit({
            id: "produto-" + crypto.randomUUID(),
            name: "",
            description: "",
            category: "Buquês",
            price: null,
            stock: 1,
            featured: false,
            active: true,
            variation: "Natural",
            photo: "",
            photos: [],
          });
        }}
      >
        <Plus size={16} /> Novo produto
      </button>
      {products.map((p) => (
        <div className="admin-row" key={p.id}>
          {p.photo && <img src={p.photo} alt="" width={50} height={60} />}
          <span>
            <b>{p.name}</b>
            <small>
              {p.category} · {p.active ? "Ativo" : "Inativo"} ·{" "}
              {p.featured ? "Destaque" : ""}
            </small>
          </span>
          <button
            onClick={() => {
              setError("");
              setEdit({ ...p });
            }}
          >
            Editar
          </button>
          <button aria-label={"Excluir " + p.name} onClick={() => remove(p)}>
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      {edit && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Editar produto"
        >
          <form className="question" onSubmit={save}>
            <button
              className="close"
              type="button"
              aria-label="Fechar editor"
              onClick={() => setEdit(null)}
              disabled={busy || uploading}
            >
              <X />
            </button>
            <h2>Cuide de cada detalhe.</h2>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="form-grid">
              <label>
                Nome
                <input
                  required
                  maxLength={140}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </label>
              <label>
                Categoria
                <select
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Descrição
                <textarea
                  required
                  maxLength={5000}
                  value={edit.description}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                />
              </label>
              <label>
                Preço (vazio = consulte)
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={edit.price ?? ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      price:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Estoque
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  required
                  value={edit.stock}
                  onChange={(e) =>
                    setEdit({ ...edit, stock: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Variações separadas por vírgula
                <input
                  required
                  maxLength={1000}
                  value={edit.variation}
                  onChange={(e) =>
                    setEdit({ ...edit, variation: e.target.value })
                  }
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={edit.active}
                  onChange={(e) =>
                    setEdit({ ...edit, active: e.target.checked })
                  }
                />
                Ativo na loja
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={edit.featured}
                  onChange={(e) =>
                    setEdit({ ...edit, featured: e.target.checked })
                  }
                />
                Destaque na home
              </label>
            </div>
            <div className="photo-upload">
              <label>
                <Upload size={17} /> Fotos do produto (PNG, JPEG ou WebP)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploading || edit.photos.length >= 8}
                  onChange={(e) => photos(e.target.files)}
                />
              </label>
              <p>
                {uploading
                  ? "Otimizando as fotos…"
                  : "Até 8 fotos por produto. Clique em uma foto para usá-la como capa."}
              </p>
              <div className="admin-photos">
                {edit.photos.map((photo) => (
                  <div key={photo}>
                    <button
                      type="button"
                      className={edit.photo === photo ? "selected" : ""}
                      aria-label={
                        edit.photo === photo ? "Foto de capa" : "Usar como capa"
                      }
                      onClick={() => setEdit({ ...edit, photo })}
                    >
                      <img src={photo} alt="Foto do produto" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remover foto"
                      onClick={() => {
                        const remaining = edit.photos.filter(
                          (p) => p !== photo,
                        );
                        setEdit({
                          ...edit,
                          photos: remaining,
                          photo:
                            edit.photo === photo
                              ? remaining[0] || ""
                              : edit.photo,
                        });
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="button green"
              type="submit"
              disabled={busy || uploading}
            >
              {busy ? (
                "Salvando…"
              ) : (
                <>
                  Salvar produto <Check size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
