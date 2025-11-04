import "dotenv/config";
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoPretty from "pino-pretty";
import { groupsRouter } from "./wpp/groups/route";
import { sendRouter } from "./wpp/send/route";
import { sessionRouter } from "./wpp/session/route";

const logger = pino(
  pinoPretty({
    colorize: true,
    translateTime: "SYS:standard",
  })
);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "wpp-server", version: "1.0.0" });
});


// WPP endpoints
app.use("/wpp/session", sessionRouter);
app.use("/wpp/groups", groupsRouter);
app.use("/wpp/send", sendRouter);



// Healthcheck para a Fly
app.get("/health", (_req, res) => res.send("ok"));

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, async () => {
  logger.info(`HTTP on :${PORT}`);
});
