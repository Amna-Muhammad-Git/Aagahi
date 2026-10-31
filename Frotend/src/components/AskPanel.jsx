import { useState } from "react";
import { Send } from "lucide-react";
import { askAboutUpload, friendlyError } from "../api/client";
import UiText from "./UiText";
import { useT } from "../i18n";
import { useSettings } from "../context/SettingsContext";

const BILL_SUGGESTED = [
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

export default function AskPanel({ bill, sampleId, file, apiMode, suggested, subject = "bill" }) {
    const t = useT();
    const { settings } = useSettings();
    const [q, setQ] = useState("");
    const [state, setState] = useState({ status: "idle" });
    const canType = apiMode === "live";
    const questions = suggested || BILL_SUGGESTED;

    function suggestedUiKey(key) {
        if (subject === "screen") return key === "meaning" ? "screen_ask_meaning" : "screen_ask_check";
        return { previous_balance: "ask_bill_question_balance", due_date: "ask_bill_question_due", late_fee: "ask_bill_question_late" }[key];
    }

    async function ask(question, key, displayQuestion = question) {
        const text = question.trim();
        if (!text) return;
        setState({ status: "loading", question: displayQuestion });
        try {
            const r = await askAboutUpload({ sampleId, file, question: text });
            setState({ status: "done", question: displayQuestion, ...r });
        } catch (e) {
            const offlineAnswer = sampleId && key && (e.code === "network" || e.code === "timeout") && (subject === "screen" ? bill?.[key] : bill?.explanations?.[key]);
            if (offlineAnswer) {
                setState({ status: "done", question: displayQuestion, answer: subject === "screen" ? offlineAnswer : `${offlineAnswer} Check the original bill to confirm.`, confidence: "medium", mode: subject === "screen" ? "builtin" : "offline", safety_note: NOTE, localSafetyNote: true });
                return;
            }
            const message = e.code === "mode_unavailable"
                ? "Live answers are unavailable right now. Please try a suggested question or check the original bill."
                : friendlyError(e);
            const prefix = subject === "screen" ? "screen_error_" : "bills_error_";
            const errorKey = e.code === "mode_unavailable"
                ? subject === "screen" ? "ask_screen_live_only" : "ask_bill_live_only"
                : ({ network: `${prefix}network`, timeout: `${prefix}timeout`, server_error: `${prefix}server`, provider_unavailable: `${prefix}provider`, message_too_long: "bills_error_question" }[e.code] || null);
            setState({ status: "error", question: displayQuestion, message, errorKey });
        }
    }

    return (
        <section className="ask-panel" aria-labelledby="ask-title">
            <h2 id="ask-title"><UiText k={subject === "screen" ? "ask_screen_title" : "ask_bill_title"} english={`Ask a question about this ${subject}`} /></h2>
            <div className="chips">
                {questions.map((s) => (
                    <button key={s.key} className="chip" type="button" onClick={() => { setQ(s.text); setState({ status: "idle" }); }} disabled={state.status === "loading"}>
                        <UiText k={suggestedUiKey(s.key)} english={s.text} />
                    </button>
                ))}
            </div>

            <form className="ask-form" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    lang={settings.lang}
                    dir="auto"
                    disabled={!canType && !sampleId}
                    maxLength={500}
                    aria-label={t("ask_input_label")}
                    placeholder={t("ask_type_placeholder")}
                />
                <button className="btn btn-primary" type="submit" disabled={(!canType && !sampleId) || !q.trim() || state.status === "loading"}>
                    <Send aria-hidden="true" /> <UiText k="ask_send" english="Ask" />
                </button>
            </form>

            <div aria-live="polite">
                {state.status === "loading" && <p className="answer"><UiText k="ask_loading" english="Finding an answer…" /></p>}
                {state.status === "error" && <p className="answer" role="alert">{state.errorKey ? <UiText k={state.errorKey} english={state.message} /> : state.message}</p>}
                {state.status === "done" && (
                    <div className="answer">
                        <p className="q" lang={/[\u0600-\u06ff\u0750-\u077f]/u.test(state.question) ? "ur" : "en"} dir="auto">{state.question}</p>
                        <p lang={/[\u0600-\u06ff\u0750-\u077f]/u.test(state.answer) ? "ur" : "en"} dir="auto">{state.answer}</p>
                        <p className="muted"><span className="tag"><UiText k={state.mode === "builtin" || state.mode === "offline" ? "ask_source_offline" : state.mode === "live" ? "ask_source_live" : "ask_source_cached"} english={state.mode === "builtin" ? "Built-in answer" : SOURCE[state.mode] || SOURCE.cached} /></span></p>
                        <p className="muted" lang={/[\u0600-\u06ff\u0750-\u077f]/u.test(state.safety_note || "") ? "ur" : "en"} dir="auto">{state.localSafetyNote || !state.safety_note ? <UiText k="ask_answer_warning" english={NOTE} /> : state.safety_note}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
