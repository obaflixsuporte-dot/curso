const GATEWAY = "https://app.omegapayments.com.br/api/v1/gateway/";

async function get(resource, filters, allowed) {
  const publicKey = process.env.OMEGAPAY_PUBLIC_KEY;
  const secretKey = process.env.OMEGAPAY_SECRET_KEY;
  if (!publicKey || !secretKey) throw new Error("OmegaPay: credenciais ausentes");

  const url = new URL(resource, GATEWAY);
  for (const [key, value] of Object.entries(filters)) {
    if (!allowed.includes(key) || typeof value !== "string" || !value.trim() || value.length > 256) {
      throw new TypeError("OmegaPay: filtro inválido");
    }
    url.searchParams.set(key, value);
  }

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "x-public-key": publicKey, "x-secret-key": secretKey },
      redirect: "error", signal: AbortSignal.timeout(5000),
    });
  } catch { throw new Error("OmegaPay: falha de conexão"); }
  if (!response.ok) throw new Error(`OmegaPay: HTTP ${response.status}`);
  try { return await response.json(); }
  catch { throw new Error("OmegaPay: resposta JSON inválida"); }
}

export const getProducer = () => get("producer", {}, []);

/** @param {{ transactionId?: string, subscriptionId?: string, orderId?: string, clientIdentifier?: string, clientEmail?: string }} [filters] */
export const listSubscriptions = (filters = {}) =>
  get("subscriptions", filters, ["transactionId", "subscriptionId", "orderId", "clientIdentifier", "clientEmail"]);

/** @param {{ id?: string, clientIdentifier?: string }} [filters] */
export const listTransactions = (filters = {}) => get("transactions", filters, ["id", "clientIdentifier"]);

/** @param {{ id?: string, clientIdentifier?: string }} [filters] */
export const listTransfers = (filters = {}) => get("transfers", filters, ["id", "clientIdentifier"]);
