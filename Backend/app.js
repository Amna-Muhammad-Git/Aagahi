const cors = require("cors");
const express = require("express");

function createApp() {
  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

  function getMode() {
    if (process.env.USE_CACHE !== "false") return "cached";

    const provider = process.env.AI_PROVIDER;
    const hasProviderKey =
      (provider === "grok" && Boolean(process.env.GROK_API_KEY)) ||
      (provider === "gemini" && Boolean(process.env.GEMINI_API_KEY));

    return hasProviderKey ? "live" : "cached";
  }

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: frontendOrigin,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept"],
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      mode: getMode(),
    });
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: "not_found",
      message: "This API route was not found.",
    });
  });

  app.use((err, _req, res, _next) => {
    const status = err.status === 413 ? 413 : 500;
    res.status(status).json({
      error: status === 413 ? "request_too_large" : "server_error",
      message:
        status === 413
          ? "This request is too large. Please try a smaller request."
          : "Something went wrong. Please try again.",
    });
  });

  return app;
}

module.exports = { createApp };
