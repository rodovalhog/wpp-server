import { Router } from "express";
import { ensureWppClient, sendImage, sendText } from "../service";

export const sendRouter = Router();

sendRouter.post("/", async (req, res) => {
  try {
    const { to, message, imageUrl, filename } = req.body as {
      to?: string;
      message?: string;
      imageUrl?: string;
      filename?: string;
    };

    if (!to?.endsWith("@g.us") && !to?.endsWith("@c.us")) {
      return res.status(400).json({
        error:
          'Informe "to" com chatId válido (ex: 120...@g.us para grupo ou 55DDDNUMERO@c.us).',
      });
    }

    if (!message && !imageUrl) {
      return res.status(400).json({
        error: 'Informe "message" ou "imageUrl".',
      });
    }

    await ensureWppClient();

    const result = imageUrl
      ? await sendImage(to, imageUrl, filename || "image.jpg", message || "")
      : await sendText(to, message || "");

    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});
