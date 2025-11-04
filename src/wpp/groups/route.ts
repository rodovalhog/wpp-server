import { Router } from "express";
import { ensureWppClient, getAllChats } from "../service";

export const groupsRouter = Router();

groupsRouter.get("/", async (_req, res) => {
  try {
    await ensureWppClient();
    const chats = await getAllChats();
    const groups = (chats || [])
      .filter((c: any) => c?.isGroup)
      .map((g: any) => ({
        id: g?.id?._serialized || g?.id,
        name: g?.name,
        participants: g?.groupMetadata?.participants?.length ?? undefined,
      }));

    res.json({ groups });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});
