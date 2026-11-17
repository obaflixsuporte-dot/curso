import { randomUUID } from "node:crypto";
import { listTransactions } from "./omegapay-api.js";

const RECEIVE = "https://app.omegapayments.com.br/api/v1/gateway/pix/receive";
const bounded = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const ORDER = /^aula47_[a-f0-9]{32}$/;
const AMOUNT = 47;

export const newLessonPixIdentifier = () => `aula47_${randomUUID().replaceAll("-", "")}`;

/** Reconsulta o estado atual para que um aviso repetido ou antigo não libere um Pix estornado. */
export async function checkLessonPix(transactionId) {
  const tx = await listTransactions({ id: transactionId });
  if (tx?.id !== transactionId || typeof tx.clientIdentifier !== "string" || !ORDER.test(tx.clientIdentifier) ||
    tx.currency !== "BRL" || tx.paymentMethod !== "PIX" || tx.purchaseType !== "ONCE" ||
    tx.amount !== AMOUNT || tx.chargeAmount !== AMOUNT) return "unrelated";
  const states = ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CHARGED_BACK", "EXPIRED"];
  if (!states.includes(tx.status)) throw new Error("OmegaPay: status Pix desconhecido");
  if (tx.status === "COMPLETED" && !Number.isFinite(Date.parse(tx.payedAt))) {
    throw new Error("OmegaPay: transação concluída sem data de pagamento");
  }
  return tx.status;
}

/**
 * Gera apenas o Pix da aula de entrada. O pedido fornece um identificador estável
 * para que o chamador possa reconciliar uma resposta perdida sem abrir outra cobrança.
 * @param {{ identifier: string, client: { name: string, email: string, phone?: string, document?: string } }} order
 */
export async function createLessonPix(order) {
  const publicKey = process.env.OMEGAPAY_PUBLIC_KEY;
  const secretKey = process.env.OMEGAPAY_SECRET_KEY;
  const callback = new URL(process.env.OMEGAPAY_PIX_CALLBACK_URL || "https://invalid.example");
  if (!publicKey || !secretKey || !process.env.OMEGAPAY_PIX_CALLBACK_URL || callback.protocol !== "https:" || callback.username || callback.password) {
    throw new Error("OmegaPay: Pix sem configuração");
  }
  const { identifier, client } = order ?? {};
  if (typeof identifier !== "string" || !ORDER.test(identifier) ||
    !bounded(client?.name, 200) || !bounded(client.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email.trim()) ||
    (client.phone !== undefined && !bounded(client.phone, 32)) || (client.document !== undefined && !bounded(client.document, 32))) {
    throw new TypeError("OmegaPay: dados do pedido inválidos");
  }
  const customer = { name: client.name.trim(), email: client.email.trim().toLowerCase() };
  if (client.phone !== undefined) customer.phone = client.phone.trim();
  if (client.document !== undefined) customer.document = client.document.trim();
  const body = {
    identifier,
    amount: AMOUNT,
    client: customer,
    products: [{ id: "aula-47", name: "Seu primeiro vídeo com IA", price: AMOUNT, quantity: 1, physical: false }],
    callbackUrl: callback.href,
  };
  let response;
  try {
    response = await fetch(RECEIVE, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10000), body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", "x-public-key": publicKey, "x-secret-key": secretKey },
    });
  } catch { throw new Error("OmegaPay: resultado da criação do Pix desconhecido; concilie o pedido antes de tentar novamente"); }
  if (!response.ok) throw new Error(`OmegaPay: falha ao gerar Pix (HTTP ${response.status})`);
  let data;
  try { data = await response.json(); } catch { throw new Error("OmegaPay: resposta Pix inválida"); }
  if (!["OK", "PENDING"].includes(data?.status) || !bounded(data.transactionId, 256) ||
    !bounded(data.order?.id, 256) || !bounded(data.pix?.code, 8192)) throw new Error("OmegaPay: cobrança Pix não disponível");
  return { transactionId: data.transactionId, orderId: data.order.id, code: data.pix.code, expiresAt: data.pix.expiresAt ?? null };
}
