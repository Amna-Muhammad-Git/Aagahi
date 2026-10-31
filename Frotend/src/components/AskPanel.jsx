import { useState } from "react";
import { Send } from "lucide-react";
import { askAboutUpload, friendlyError } from "../api/client";

const SUGGESTED = [
    { key: "previous_balance", text: "What does previous balance mean?" },
    { key: "due_date", text: "When is this bill due?" },
    { key: "late_fee", text: "Is there a late fee?" },
];
const SOURCE = {
    cached: "Prepared answer for a suggested question",
    live: "Live AI answer",
    offline: "Offline example answer",
};
const NOTE = "This explanation may be wrong. Check the original bill before acting.";

export default function AskPanel({ bill, sampleId, file, apiMode }) {
    const [q, setQ] = useState("");
    const [state, setState] = useState({ status: "idle" });
    const canType = apiMode === "live";

    async function ask(question, key) {
        const text = question.trim();
        if (!text) return;
        setState({ status: "loading", question: text });
        try {
            const r = await askAboutUpload({ sampleId, file, question: text });
            setState({ status: "done", question: text, ...r });
        } catch (e) {
            const offlineAnswer = sampleId && key && (e.code === "network" || e.code === "timeout") && bill.explanations?.[key];
            if (offlineAnswer) {
                setState({ status: "done", question: text, answer: `${offlineAnswer} Check the original bill to confirm.`, confidence: "medium", mode: "offline", safety_note: NOTE });
                return;
            }
            const message = e.code === "mode_unavailable"
                ? "This demo can only answer the suggested questions. Please tap one of them."
                : friendlyError(e);
            setState({ status: "error", question: text, message });
        }
    }

    return (
        <section className="ask-panel" aria-labelledby="ask-title">
            <h2 id="ask-title">Ask a question about this bill</h2>
            <div className="chips">
                {SUGGESTED.map((s) => (
                    <button key={s.key} className="chip" onClick={() => ask(s.text, s.key)} disabled={state.status === "loading"}>
                        {s.text}
                    </button>
                ))}
            </div>

            <form className="ask-form" onSubmit={(e) => { e.preventDefault(); ask(q); setQ(""); }}>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    disabled={!canType}
                    maxLength={300}
                    aria-label="Type your own question"
                    placeholder={canType ? "Type your question" : "Typing your own question needs live mode"}
                />
                <button className="btn btn-primary" type="submit" disabled={!canType || !q.trim() || state.status === "loading"}>
                    <Send aria-hidden="true" /> Ask
                </button>
            </form>

            <div aria-live="polite">
                {state.status === "loading" && <p className="answer">Finding an answer…</p>}
                {state.status === "error" && <p className="answer" role="alert">{state.message}</p>}
                {state.status === "done" && (
                    <div className="answer">
                        <p className="q">{state.question}</p>
                        <p>{state.answer}</p>
                        <p className="muted"><span className="tag">{SOURCE[state.mode] || SOURCE.cached}</span></p>
                        <p className="muted">{state.safety_note || NOTE}</p>
                    </div>
                )}
            </div>
        </section>
    );
}