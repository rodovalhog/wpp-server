import { Router } from "express";
import { ensureWppClient, getWppState, kickstartWppClient } from "../service";

export const sessionRouter = Router();

sessionRouter.get("/", async (_req, res) => {
  try {
    // Inicia o cliente sem bloquear a resposta
    kickstartWppClient();

    const { status, qrBase64, isAuthenticated, qrCode } = getWppState();
    res.json({ status, isAuthenticated, qrBase64, qrCode });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

sessionRouter.get("/qr", async (req, res) => {
  try {
    await ensureWppClient();

    let { status, qrBase64, isAuthenticated, qrCode } = getWppState();

    if (!isAuthenticated && !qrBase64) {
      const startedAt = Date.now();
      while (Date.now() - startedAt < 5000) {
        await new Promise((r) => setTimeout(r, 200));
        const s = getWppState();
        status = s.status;
        qrBase64 = s.qrBase64;
        isAuthenticated = s.isAuthenticated;
        qrCode = s.qrCode;
        if (qrBase64 || isAuthenticated) break;
      }
    }

    if (!qrBase64) {
      return res.status(404).json({
        ok: false,
        error:
          status === "ready"
            ? "Já autenticado: QR não disponível."
            : "QR não disponível no momento. Tente novamente.",
      });
    }

    const as = String((req.query as any)?.as || "png").toLowerCase();

    if (as === "json") {
      return res.json({ qrBase64, qrCode });
    }

    const isDataUrl = qrBase64.startsWith("data:");
    let mime = "image/png";
    let base64Payload = qrBase64;
    if (isDataUrl) {
      const [meta, b64] = qrBase64.split(",", 2);
      base64Payload = b64 || "";
      const idx = meta.indexOf(":"), semi = meta.indexOf(";");
      if (idx >= 0 && semi > idx) mime = meta.slice(idx + 1, semi);
    }

    const buffer = Buffer.from(base64Payload, "base64");
    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "no-store");
    return res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});
