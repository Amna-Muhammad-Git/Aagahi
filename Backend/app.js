const cors = require("cors");
const express = require("express");
const multer = require("multer");
const samples = require("./data/samples.json");
const sampleResults = require("./data/sample-results.json");
const screenResults = require("./data/screen-results.json");
const questionResults = require("./data/question-results.json");
const supportResponses = require("./data/support-responses.json");
const { extractLiveBill, getProviderChain, ProviderFailure, UnsafeProviderOutput } = require("./ai-providers");
const guideContent = require("../Frotend/src/data/guides.json");
const guides = Array.isArray(guideContent) ? guideContent : guideContent.guides;
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
const screenResultsById = new Map(
  screenResults.map((screen) => [screen.id, screen]),
);
const questionResultsBySampleId = new Map(
  questionResults.map((entry) => [entry.sample_id, entry.answers]),
);

function validateOfflineContent() {
  const glossaryIds = new Set(glossary.map((entry) => entry.id));
  const guideIds = new Set((guides || []).map((guide) => guide.id));
  const screenIds = new Set(screenResults.map((screen) => screen.id));
  const questionSampleIds = new Set(questionResults.map((entry) => entry.sample_id));
  const supportIds = new Set(supportResponses.map((entry) => entry.id));

  if (glossary.length !== 15 || glossaryIds.size !== glossary.length) {
    throw new Error("Glossary content must contain 15 entries with unique IDs.");
  }

  if (!Array.isArray(guides) || guideIds.size !== guides.length) {
    throw new Error("Guide content must have unique IDs.");
  }

  if (screenResults.length !== 2 || screenIds.size !== screenResults.length) {
    throw new Error("Screen cache must contain two examples with unique IDs.");
  }

  for (const guide of guides) {
    if (
      !Array.isArray(guide.steps) ||
      guide.steps.length < 4 ||
      guide.steps.length > 7 ||
      guide.steps.some((step) => {
        const instruction = step.instruction || step.text;
        return typeof instruction !== "string" || instruction.trim() === "";
      })
    ) {
      throw new Error(`Guide ${guide.id} must contain 4 to 7 complete steps.`);
    }
  }

  if (supportIds.size !== supportResponses.length) {
    throw new Error("Support responses must have unique IDs.");
  }
  for (const entry of supportResponses) {
    if (
      !guideIds.has(entry.guide_id) ||
      !entry.question_en?.trim() ||
      !entry.answer_en?.trim() ||
      !entry.question_ur?.trim() ||
      !entry.answer_ur?.trim() ||
      !Array.isArray(entry.match_phrases_en) ||
      !Array.isArray(entry.match_phrases_ur)
    ) {
      throw new Error(`Support response ${entry.id} is incomplete or references an unknown guide.`);
    }
  }

  for (const screen of screenResults) {
    if (
      !Array.isArray(screen.steps) ||
      screen.steps.length < 3 ||
      screen.steps.length > 5 ||
      screen.steps.some((step) => typeof step !== "string" || !step.trim())
    ) {
      throw new Error(`Screen ${screen.id} must contain 3 to 5 complete steps.`);
    }
  }

  const knownSampleIds = new Set([
    ...samples.map((sample) => sample.id),
    ...screenResults.map((screen) => screen.id),
  ]);
  if (questionSampleIds.size !== questionResults.length) {
    throw new Error("Question cache must have one unique entry per sample ID.");
  }

  for (const entry of questionResults) {
    const answerIds = new Set(entry.answers.map((answer) => answer.id));
    if (!knownSampleIds.has(entry.sample_id) || answerIds.size !== entry.answers.length) {
      throw new Error(`Question cache for ${entry.sample_id} has an unknown sample or duplicate IDs.`);
    }
    if (entry.answers.some((answer) => !answer.question || !answer.answer || !answer.confidence)) {
      throw new Error(`Question cache for ${entry.sample_id} has incomplete answers.`);
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

function normalizeQuestion(question) {
  return question
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[?？!！.,،؛:]/g, "")
    .replace(/\s+/g, " ");
}

function matchSupportResponse(message, guideId) {
  const normalizedMessage = normalizeQuestion(message);
  const matches = supportResponses
    .filter((entry) => !guideId || entry.guide_id === guideId)
    .flatMap((entry) => {
      const phrases = [
        entry.question_en,
        entry.question_ur,
        ...entry.match_phrases_en,
        ...entry.match_phrases_ur,
      ].map(normalizeQuestion);
      const matchedLength = phrases
        .filter((phrase) => phrase.length >= 8 && normalizedMessage.includes(phrase))
        .reduce((longest, phrase) => Math.max(longest, phrase.length), 0);
      return matchedLength ? [{ entry, matchedLength }] : [];
    })
    .sort((a, b) => b.matchedLength - a.matchedLength);

  if (!matches.length || (matches[1] && matches[0].matchedLength === matches[1].matchedLength)) {
    return null;
  }
  return matches[0].entry;
}

function hasValidUpload(file, { imagesOnly = false } = {}) {
  return (
    file &&
    file.size > 0 &&
    (!imagesOnly || file.mimetype === "image/jpeg" || file.mimetype === "image/png") &&
    hasAllowedFileSignature(file)
  );
}

function createApp() {
  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

  function getMode() {
    return getProviderChain().length ? "live" : "cached";
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
    res.json(
      samples.map((sample) => ({
        ...sample,
        suggested_questions: (questionResultsBySampleId.get(sample.id) || []).map(
          ({ id, question }) => ({ id, question }),
        ),
      })),
    );
  });

  app.get("/api/glossary", (_req, res) => {
    res.json(glossary);
  });

  app.get("/api/guides", (_req, res) => {
    res.json(guides);
  });

  app.get("/api/support/questions", (_req, res) => {
    res.json(
      supportResponses.map(({ id, guide_id, question_en, question_ur }) => ({
        id,
        guide_id,
        question_en,
        question_ur,
      })),
    );
  });

  app.post("/api/support/chat", (req, res) => {
    const { message, guide_id: guideId, language = "en" } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "missing_input",
        message: "Type or say a question to continue.",
      });
    }
    if (message.trim().length > 500) {
      return res.status(413).json({
        error: "message_too_long",
        message: "Please keep your question under 500 characters.",
      });
    }
    if (language !== "en" && language !== "ur") {
      return res.status(400).json({
        error: "invalid_language",
        message: "Choose English or Urdu.",
      });
    }
    if (guideId !== undefined && (typeof guideId !== "string" || !guides.some((guide) => guide.id === guideId))) {
      return res.status(404).json({
        error: "guide_not_found",
        message: "That guide is not available.",
      });
    }

    const matched = matchSupportResponse(message.trim(), guideId);
    if (!matched) {
      return res.status(503).json({
        error: "mode_unavailable",
        message: "I do not have a reviewed answer for that question yet. Try a suggested question or open a guide.",
        related_guide_ids: guideId ? [guideId] : [],
      });
    }

    return res.json({
      reply: language === "ur" ? matched.answer_ur : matched.answer_en,
      related_guide_ids: [matched.guide_id],
      mode: "cached",
    });
  });

  app.post("/api/extract-bill", upload.single("file"), async (req, res) => {
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

      if (!hasValidUpload(req.file)) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Choose a valid PDF, JPG, or PNG bill image.",
        });
      }

      if (process.env.USE_CACHE !== "false") {
        return res.status(503).json({
          error: "mode_unavailable",
          message: "Live bill reading is turned off. You can choose a sample bill instead.",
        });
      }

      try {
        const result = await extractLiveBill(req.file, {
          onProviderFailure: (details) => {
            console.warn("[Agahi AI] Provider attempt failed.", JSON.stringify(details));
          },
        });
        return res.json(result);
      } catch (error) {
        if (error instanceof UnsafeProviderOutput) {
          return res.status(422).json({
            error: "bill_unclear",
            message: "We could not read the amount clearly. Check the original bill or try a clearer photo.",
          });
        }
        return res.status(503).json({
          error: "provider_unavailable",
          message: "Bill reading is unavailable right now. Try again later or practise with a sample bill.",
        });
      }
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

    return res.json({
      ...result,
      suggested_questions: (questionResultsBySampleId.get(result.id) || []).map(
        ({ id, question }) => ({ id, question }),
      ),
    });
  });

  app.post("/api/explain-screen", upload.single("file"), (req, res) => {
    const sampleId = req.body?.sample_id;

    if (req.file && sampleId) {
      return res.status(400).json({
        error: "conflicting_input",
        message: "Choose a sample screen or upload a screenshot, not both.",
      });
    }

    if (req.file) {
      if (req.file.size === 0) {
        return res.status(400).json({
          error: "empty_file",
          message: "This image is empty. Choose another screenshot and try again.",
        });
      }

      if (!hasValidUpload(req.file, { imagesOnly: true })) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Choose a valid JPG or PNG screenshot.",
        });
      }

      return res.status(503).json({
        error: "mode_unavailable",
        message: "Live screen help is not available yet. You can choose a sample screen instead.",
      });
    }

    if (typeof sampleId !== "string" || sampleId.trim() === "") {
      return res.status(400).json({
        error: "missing_input",
        message: "Choose a sample screen or upload a screenshot.",
      });
    }

    const result = screenResultsById.get(sampleId.trim());
    if (!result) {
      return res.status(404).json({
        error: "sample_not_found",
        message: "That sample screen is not available. Choose another sample.",
      });
    }

    return res.json(result);
  });

  app.post("/api/ask-about-upload", upload.single("file"), (req, res) => {
    const sampleId = req.body?.sample_id;
    const questionId = req.body?.question_id;
    const question = req.body?.question;

    if (req.file && sampleId) {
      return res.status(400).json({
        error: "conflicting_input",
        message: "Choose a sample or upload a file, not both.",
      });
    }

    const hasQuestionId =
      typeof questionId === "string" && questionId.trim() !== "";
    const hasQuestion = typeof question === "string" && question.trim() !== "";

    if (!hasQuestionId && !hasQuestion) {
      return res.status(400).json({
        error: "missing_question",
        message: "Type or choose a question about the bill or screenshot.",
      });
    }

    if (typeof question === "string" && question.trim().length > 500) {
      return res.status(413).json({
        error: "question_too_long",
        message: "Please keep your question under 500 characters.",
      });
    }

    if (req.file) {
      if (req.file.size === 0) {
        return res.status(400).json({
          error: "empty_file",
          message: "This file is empty. Choose another file and try again.",
        });
      }

      if (!hasValidUpload(req.file)) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Choose a valid PDF, JPG, or PNG file.",
        });
      }

      return res.status(503).json({
        error: "mode_unavailable",
        message: "Live questions about uploads are not available yet. Try a sample question instead.",
      });
    }

    if (typeof sampleId !== "string" || sampleId.trim() === "") {
      return res.status(400).json({
        error: "missing_input",
        message: "Choose a sample bill or screen before asking a question.",
      });
    }

    const answers = questionResultsBySampleId.get(sampleId.trim());
    if (!answers) {
      return res.status(404).json({
        error: "sample_not_found",
        message: "That sample is not available. Choose another sample.",
      });
    }

    const cachedAnswer =
      (hasQuestionId &&
        answers.find((entry) => entry.id === questionId.trim())) ||
      (hasQuestion &&
        answers.find(
          (entry) => normalizeQuestion(entry.question) === normalizeQuestion(question),
        ));

    if (!cachedAnswer) {
      return res.status(503).json({
        error: "mode_unavailable",
        message: "That question does not have a cached answer yet. Choose a suggested question or try again when live help is available.",
      });
    }

    return res.json({
      answer: cachedAnswer.answer,
      confidence: cachedAnswer.confidence,
      mode: "cached",
      safety_note: "This explanation may be wrong. Check the original bill or screen before acting.",
    });
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: "not_found",
      message: "This API route was not found.",
    });
  });

  app.use((err, _req, res, _next) => {
    const safeErrorCodes = new Set([
      "EACCES",
      "EADDRINUSE",
      "ECONNRESET",
      "ENOTFOUND",
      "ERR_HTTP_HEADERS_SENT",
      "LIMIT_FIELD_COUNT",
      "LIMIT_FIELD_SIZE",
      "LIMIT_FILE_COUNT",
      "LIMIT_FILE_SIZE",
      "LIMIT_UNEXPECTED_FILE",
      "entity.parse.failed",
      "entity.too.large",
    ]);
    console.error("[Agahi API] Unhandled request error.", JSON.stringify({
      path: _req.path,
      name: typeof err?.name === "string" ? err.name : "Error",
      code: safeErrorCodes.has(err?.code) ? err.code : null,
    }));

    if (err instanceof ProviderFailure) {
      return res.status(503).json({
        error: "provider_unavailable",
        message: "Bill reading is unavailable right now. Try again later or practise with a sample bill.",
      });
    }

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
