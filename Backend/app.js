const cors = require("cors");
const express = require("express");
const samples = require("./data/samples.json");
const sampleResults = require("./data/sample-results.json");
const guides = require("../Frotend/src/data/guides.json");
const glossary = require("../Frotend/src/data/glossary.json");

const sampleResultsById = new Map(
  sampleResults.map((sample) => [sample.id, sample]),
);

function validateOfflineContent() {
  const glossaryIds = new Set(glossary.map((entry) => entry.id));
  const guideIds = new Set(guides.map((guide) => guide.id));

  if (glossary.length !== 15 || glossaryIds.size !== glossary.length) {
    throw new Error("Glossary content must contain 15 entries with unique IDs.");
  }

  if (guideIds.size !== guides.length) {
    throw new Error("Guide content must have unique IDs.");
  }

  for (const guide of guides) {
    if (
      !Array.isArray(guide.steps) ||
      guide.steps.length < 4 ||
      guide.steps.length > 7 ||
      guide.steps.some((step) => !step.title || !step.instruction)
    ) {
      throw new Error(`Guide ${guide.id} must contain 4 to 7 complete steps.`);
    }
  }
}

validateOfflineContent();

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

  app.get("/api/samples", (_req, res) => {
    res.json(samples);
  });

  app.get("/api/glossary", (_req, res) => {
    res.json(glossary);
  });

  app.get("/api/guides", (_req, res) => {
    res.json(guides);
  });

  app.post("/api/extract-bill", (req, res) => {
    const sampleId = req.body?.sample_id;

    if (typeof sampleId !== "string" || sampleId.trim() === "") {
      return res.status(400).json({
        error: "missing_input",
        message: "Choose a sample bill to continue.",
      });
    }

    const result = sampleResultsById.get(sampleId.trim());
    if (!result) {
      return res.status(404).json({
        error: "sample_not_found",
        message: "That sample bill is not available. Choose another sample.",
      });
    }

    return res.json(result);
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
