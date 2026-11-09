export async function api<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  const body = await response
    .json()
    .catch(() => ({ error: "Resposta inválida do servidor." }));
  if (!response.ok)
    throw new Error(body.error || "Não foi possível concluir a solicitação.");
  return body as T;
}
export const json = (
  method: string,
  data: unknown,
  csrf?: string,
): RequestInit => ({
  method,
  headers: {
    "Content-Type": "application/json",
    ...(csrf ? { "X-CSRF-Token": csrf } : {}),
  },
  body: JSON.stringify(data),
});
