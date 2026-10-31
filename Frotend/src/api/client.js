const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const TIMEOUT_MS = 12000;

export const ERROR_COPY = {
    missing_input: "Please choose a sample bill or a file first.",
    invalid_file_type: "Agahi can read PDF, JPG and PNG files only.",
    file_too_large: "That file is bigger than 5 MB. Please choose a smaller one.",
    sample_not_found: "That sample is not available right now. Please pick another one.",
    unreadable: "We couldn't read this file. Try a clearer photo or a sample bill.",
    mode_unavailable: "Reading your own files needs live mode, which is switched off in this demo. Please try a sample bill.",
    provider_unavailable: "The reading service is busy. Please try again in a moment.",
    message_too_long: "That question is too long. Please make it shorter.",
    server_error: "Something went wrong on our side. Please try again.",
    network: "We can't reach the Agahi server. Samples and guides still work.",
    timeout: "This is taking too long. Please try again.",
};

export class ApiError extends Error {
    constructor(code) { super(code); this.code = code; }
}
export const friendlyError = (e) => ERROR_COPY[e?.code] || ERROR_COPY.server_error;

async function request(path, options = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
        res = await fetch(`${BASE}${path}`, { ...options, signal: ctrl.signal });
    } catch (e) {
        throw new ApiError(e.name === "AbortError" ? "timeout" : "network");
    } finally {
        clearTimeout(timer);
    }
    let body = null;
    try { body = await res.json(); } catch { /* response was not JSON */ }
    if (!res.ok) throw new ApiError(body?.error || "server_error");
    return body;
}

const postJson = (path, payload) =>
    request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

export const getHealth = () => request("/api/health");

export async function getSamples() {
    const d = await request("/api/samples");
    if (!Array.isArray(d)) throw new ApiError("server_error");
    return d;
}

export async function getGlossary() {
    const d = await request("/api/glossary");
    if (!Array.isArray(d)) throw new ApiError("server_error");
    return d;
}

// Uploads use FormData with field "file". Never set Content-Type by hand here.
export function extractBill({ file, sampleId }) {
    if (file) {
        const fd = new FormData();
        fd.append("file", file);
        return request("/api/extract-bill", { method: "POST", body: fd });
    }
    return postJson("/api/extract-bill", { sample_id: sampleId });
}

export function askAboutUpload({ file, sampleId, question }) {
    if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("question", question);
        return request("/api/ask-about-upload", { method: "POST", body: fd });
    }
    return postJson("/api/ask-about-upload", { sample_id: sampleId, question });
}