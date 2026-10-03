import path from "node:path";
import fs from "node:fs";
import { authenticationRateLimit } from "./lib/rate-limit";
import { paymentWebhookRouter } from "./routes/workflow-payments";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { legacyAccess } from "./lib/legacy-access";
import { authenticate } from "./lib/session";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser());
app.use("/api/webhooks", paymentWebhookRouter);
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", authenticationRateLimit, authenticate, legacyAccess, router);
const frontendDirectory=process.env.FRONTEND_DIR??path.resolve(process.cwd(),"artifacts/accentecx/dist/public");
if(fs.existsSync(frontendDirectory)){app.use(express.static(frontendDirectory));app.get("/{*page}",(req,res,next)=>req.path.startsWith("/api/")?next():res.sendFile(path.join(frontendDirectory,"index.html")));}
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { logger.error({err}, "API request failed"); res.status(500).json({error:"Request failed"}); });

export default app;
