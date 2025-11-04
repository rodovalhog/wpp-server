import { create } from "@wppconnect-team/wppconnect";

type WhatsappClient = any;

type WppState = {
  status: "idle" | "qr" | "ready" | "connecting" | "disconnected" | "error";
  qrBase64: string | null;
  isAuthenticated: boolean;
  qrCode: string | null;
};

let clientPromise: Promise<WhatsappClient> | null = null;
let clientRef: WhatsappClient | null = null;

const state: WppState = {
  status: "idle",
  qrBase64: null,
  isAuthenticated: false,
  qrCode: null,
};

export function getWppState(): WppState {
  return { ...state };
}

function startClient(): Promise<WhatsappClient> {
  if (clientPromise) return clientPromise;
  state.status = "connecting";
  clientPromise = create({
      session: "wpp-server",
      headless: true,
      logQR: false,
      updatesLog: false,
      // Mantém a sessão aberta enquanto aguarda leitura do QR
      autoClose: 0,
      deviceSyncTimeout: 0,
      catchQR: (base64Qr: any, asciiQR?: string, _attempts?: number, urlCode?: string) => {
        // qrCode normalmente vem como base64 da imagem; padroniza para data URL
        state.qrBase64 = base64Qr?.startsWith("data:")
          ? base64Qr
          : `data:image/png;base64,${base64Qr}`;
        state.status = "qr";
        state.isAuthenticated = false;
        state.qrCode = urlCode || null;
        if (asciiQR) {
          try { (console as any).clear?.(); } catch {}
          console.log("Escaneie o QR abaixo para autenticar:\n");
          console.log(asciiQR);
        } else {
          console.log("QR gerado. Acesse /wpp/session/qr para visualizar.");
        }
      },
      statusFind: (status) => {
        const normalized = String(status).toLowerCase();
        if (normalized.includes("logged") || normalized.includes("islogged") || normalized.includes("inchat") || normalized.includes("connected")) {
          state.status = "ready";
          state.isAuthenticated = true;
        } else if (normalized.includes("qrread") || normalized.includes("notlogged") || normalized.includes("desconnected")) {
          state.status = "disconnected";
          state.isAuthenticated = false;
        }
      },
      puppeteerOptions: {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
        ],
      },
    })
      .then((client) => {
        clientRef = client;
        return client;
      })
      .catch((err) => {
        state.status = "error";
        state.isAuthenticated = false;
        throw err;
      });
  return clientPromise;
}

export function kickstartWppClient(): void {
  if (clientRef || clientPromise) return;
  void startClient();
}

export async function ensureWppClient(): Promise<{ client: WhatsappClient }> {
  if (clientRef) return { client: clientRef };
  const promise = startClient();
  return { client: await promise };
}

export async function sendText(to: string, message: string) {
  const { client } = await ensureWppClient();
  return client.sendText(to, message);
}

export async function sendImage(to: string, imageUrl: string, filename: string, caption?: string) {
  const { client } = await ensureWppClient();
  return client.sendImage(to, imageUrl, filename, caption ?? "");
}

export async function getAllChats() {
  const { client } = await ensureWppClient();
  return client.getAllChats();
}


