import { useState } from "react";
import { api, json } from "@/api";
export default function Checkout({
  items,
  onRefresh,
}: {
  items: { id: string; variation: string; qty: number }[];
  onRefresh: () => void;
}) {
  const [error, setError] = useState(""),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false);
  async function verify() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ url: string }>(
        "/api/checkout",
        json("POST", { items }),
      );
      setUrl(result.url);
    } catch (e) {
      setError((e as Error).message);
      onRefresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="checkout">
      <button className="button green" disabled={busy} onClick={verify}>
        {busy ? "Confirmando os itens…" : "Finalizar pelo WhatsApp ↗"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {url && (
        <div className="notice" role="status">
          <p>
            Itens conferidos. Abra a mensagem para revisar e enviar à loja. A
            disponibilidade e a entrega serão confirmadas no atendimento.
          </p>
          <a
            className="button green"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Abrir pedido no WhatsApp ↗
          </a>
        </div>
      )}
    </div>
  );
}
