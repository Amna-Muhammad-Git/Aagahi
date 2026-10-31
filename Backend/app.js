const cors = require("cors");
const express = require("express");
const multer = require("multer");
const samples = require("./data/samples.json");
const sampleResults = require("./data/sample-results.json");
const guides = require("../Frotend/src/data/guides.json");
const glossary = require("../Frotend/src/data/glossary.json");

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 2,
    fieldSize: 256,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Unsupported upload type.");
      error.code = "invalid_file_type";
      callback(error);
      return;
    }

    callback(null, true);
  },
});

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

function hasAllowedFileSignature(file) {
  const buffer = file.buffer;
  if (!buffer?.length) return false;

  if (file.mimetype === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  if (file.mimetype === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (file.mimetype === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  return false;
}

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

  app.post("/api/extract-bill", upload.single("file"), (req, res) => {
    const sampleId = req.body?.sample_id;

    if (req.file && sampleId) {
      return res.status(400).json({
        error: "conflicting_input",
        message: "Choose a sample bill or upload a file, not both.",
      });
    }

    if (req.file) {
      if (req.file.size === 0) {
        return res.status(400).json({
          error: "empty_file",
          message: "This file is empty. Choose a different file and try again.",
        });
      }

      if (!hasAllowedFileSignature(req.file)) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Choose a valid PDF, JPG, or PNG bill image.",
        });
      }

      return res.status(503).json({
        error: "mode_unavailable",
        message: "Live bill reading is not available yet. You can choose a sample bill instead.",
      });
    }

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
    if (err.code === "invalid_file_type") {
      return res.status(400).json({
        error: "invalid_file_type",
        message: "Choose a valid PDF, JPG, or PNG bill image.",
      });
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: "file_too_large",
          message: "This file is over the 5 MB limit. Choose a smaller file.",
        });
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          error: "invalid_upload_field",
          message: "Upload one file using the file field.",
        });
      }

      return res.status(400).json({
        error: "invalid_upload",
        message: "The upload could not be read. Check the file and try again.",
      });
    }

    const isJsonBodyTooLarge = err.type === "entity.too.large";
    const status = isJsonBodyTooLarge ? 413 : 500;
    res.status(status).json({
      error: isJsonBodyTooLarge ? "request_too_large" : "server_error",
      message:
        isJsonBodyTooLarge
          ? "This request is too large. Please try a smaller request."
          : "Something went wrong. Please try again.",
    });
  });

  return app;
}

module.exports = { createApp };
