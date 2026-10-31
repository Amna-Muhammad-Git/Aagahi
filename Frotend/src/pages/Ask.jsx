import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mic, Square, Send, Volume2, VolumeX, X } from "lucide-react";
import { friendlyError, supportChat } from "../api/client";
import { localMatch, safetyReply } from "../api/localAnswers";
import guides from "../data/guides.json";
import { useSettings } from "../context/SettingsContext";
import PageHeader from "../components/PageHeader";
import UiText from "../components/UiText";
import { useT } from "../i18n";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const SOURCE = { cached: "Prepared answer", live: "Live AI answer", offline: "Built-in answer" };
const STARTERS = [
    ["How do I send a photo?", "ask_starter_photo"], ["How do I make a video call?", "ask_starter_video"],
    ["What does late fee mean?", "ask_starter_late_fee"], ["How can I spot a scam email?", "ask_starter_scam"],
];
const VOICE_ERRORS = {
    ask_voice_blocked: "The microphone is blocked. Allow it in your browser, or type your question instead.",
    ask_voice_silent: "I didn't hear anything. Tap the microphone and try again, or type your question.",
    ask_voice_failed: "Voice didn't work this time. Please type your question instead.",
    ask_voice_start_failed: "Voice didn't start. Please type your question.",
};
const FALLBACK_CODES = ["mode_unavailable", "network", "timeout", "provider_unavailable"];
const guideTitle = (id) => guides.guides.find((g) => g.id === id)?.title;
const guideLabel = (id, language) => {
    const guide = guides.guides.find((g) => g.id === id);
    return language === "ur" && guide?.title_ur
        ? <span className="ui-ur" lang="ur" dir="rtl">{guide.title_ur}</span>
        : guide?.title;
};

export default function Ask() {
    const { settings } = useSettings();
    const t = useT();
    const [params, setParams] = useSearchParams();
    const guideId = guideTitle(params.get("guide")) ? params.get("guide") : null;

    const [messages, setMessages] = useState([]); // in memory only; never saved
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [listening, setListening] = useState(false);
    const [voiceError, setVoiceError] = useState("");
    const [speakOn, setSpeakOn] = useState(false);
    const recRef = useRef(null);
    const endRef = useRef(null);
    const idRef = useRef(0);
    const lang = settings.lang;

    useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, busy]);
    useEffect(() => () => { recRef.current?.abort?.(); window.speechSynthesis?.cancel(); }, []);

    const add = (m) => setMessages((list) => [...list, { id: ++idRef.current, ...m }]);

    function speak(reply) {
        if (!speakOn || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(reply);
        u.lang = lang === "ur" ? "ur-PK" : "en-US";
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }

    async function send(raw, visibleText = raw) {
        const message = raw.trim();
        if (!message || busy) return;
        setText("");
        setVoiceError("");
        add({ role: "user", text: visibleText });

        const safe = safetyReply(message);
        if (safe) { add({ role: "bot", text: safe, mode: "offline", related: [] }); speak(safe); return; }

        setBusy(true);
        try {
            const r = await supportChat({ message, guideId, language: lang });
            add({ role: "bot", text: r.reply, related: r.related_guide_ids || [], mode: r.mode });
            speak(r.reply);
        } catch (e) {
            const local = FALLBACK_CODES.includes(e.code) ? localMatch(message) : null;
            if (local) {
                add({ role: "bot", text: local.reply, related: local.related, mode: "offline" });
                speak(local.reply);
            } else if (FALLBACK_CODES.includes(e.code)) {
                add({ role: "bot", text: t("ask_no_answer"), related: [], mode: "offline", nogo: true, uiText: true });
            } else {
                add({ role: "error", text: friendlyError(e) });
            }
        } finally {
            setBusy(false);
        }
    }

    function startVoice() {
        setVoiceError("");
        window.speechSynthesis?.cancel();
        const rec = new SR();
        rec.lang = lang === "ur" ? "ur-PK" : "en-US";
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.onresult = (e) => setText(Array.from(e.results).map((r) => r[0].transcript).join(" "));
        rec.onerror = (e) => {
            setListening(false);
            setVoiceError(
                e.error === "not-allowed" || e.error === "service-not-allowed"
                    ? "ask_voice_blocked"
                    : e.error === "no-speech"
                        ? "ask_voice_silent"
                        : "ask_voice_failed"
            );
        };
        rec.onend = () => setListening(false);
        recRef.current = rec;
        try { rec.start(); setListening(true); } catch { setVoiceError("ask_voice_start_failed"); }
    }

    const stopVoice = () => recRef.current?.stop();

    return (
        <>
            <PageHeader title={<UiText k="ask_page_title" english="Ask a question" />}>
                <UiText k="ask_intro" english="Ask about bills, WhatsApp or email. Aagahi explains and teaches. It never does things for you." />
            </PageHeader>
            <div className="container section chat">


                {guideId && (
                    <p className="context">
                        <UiText k="ask_about_guide" english="Asking about:" /> <strong>{guideLabel(guideId, lang)}</strong>
                        <button className="btn btn-secondary small" onClick={() => setParams({})}><X aria-hidden="true" /> <UiText k="ask_clear" english="Clear" /></button>
                    </p>
                )}

                <div className="msgs" role="log" aria-live="polite" aria-label={t("ask_conversation")}>
                    {messages.length === 0 && (
                        <div className="starters">
                            <p><UiText k="ask_try" english="Try one of these:" /></p>
                            <div className="chips">{STARTERS.map(([question, key]) => <button key={key} className="chip" onClick={() => send(question, t(key))}><UiText k={key} english={question} /></button>)}</div>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div key={m.id} className={`msg ${m.role}`}>
                            <p dir="auto" lang={/[\u0600-\u06ff\u0750-\u077f]/u.test(m.text) ? "ur" : "en"}>{m.uiText ? <UiText k="ask_no_answer" english={m.text} /> : m.text}</p>
                            {m.role === "bot" && <span className="tag"><UiText k={m.mode === "live" ? "ask_source_live" : m.mode === "cached" ? "ask_source_cached" : "ask_source_offline"} english={SOURCE[m.mode] || SOURCE.offline} /></span>}
                            {m.related?.length > 0 && (
                                <div className="related">
                                    {m.related.filter(guideTitle).map((id) => <Link key={id} to={`/guides/${id}`}><UiText k="ask_open_guide" english="Open guide:" /> {guideLabel(id, lang)}</Link>)}
                                </div>
                            )}
                            {m.nogo && <div className="related"><Link to="/guides"><UiText k="ask_browse_guides" english="Browse all guides" /></Link></div>}
                        </div>
                    ))}
                    {busy && <div className="msg bot"><p><UiText k="ask_finding" english="Finding an answer…" /></p></div>}
                    <div ref={endRef} />
                </div>

                <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
                    {SR && (
                        <button type="button" className={`mic-btn ${listening ? "on" : ""}`} onClick={listening ? stopVoice : startVoice}
                            aria-label={t(listening ? "ask_voice_stop" : "ask_voice_start")}>
                            {listening ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
                        </button>
                    )}
                    <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} lang={lang === "ur" ? "ur" : "en"} dir="auto"
                        aria-label={t("ask_input_label")} placeholder={listening ? t("ask_listening") : t("ask_input_placeholder")} />
                    <button className="btn btn-primary" type="submit" disabled={!text.trim() || busy}><Send aria-hidden="true" /> <UiText k="ask_button" english="Ask" /></button>
                </form>

                <div className="chat-tools">
                    <button className="option" aria-pressed={speakOn} onClick={() => { window.speechSynthesis?.cancel(); setSpeakOn((v) => !v); }}>
                        {speakOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />} <UiText k="ask_read_answers" english="Read answers aloud:" /> {speakOn ? <UiText k="ask_on" english="On" /> : <UiText k="ask_off" english="Off" />}
                    </button>
                </div>

                {voiceError && <p className="notice" role="alert"><UiText k={voiceError} english={VOICE_ERRORS[voiceError] || "Voice input did not work."} /></p>}
                {!SR && <p className="notice"><UiText k="ask_voice_unsupported" english="Voice questions aren't supported in this browser, so please type your question. Chrome works best for voice." /></p>}
                <p className="muted"><UiText k="ask_privacy" english="Your conversation stays on this page only and is gone when you leave. Answers can be wrong, so check the original bill or screen before you act. Never share a password, OTP or PIN." /></p>
            </div>
        </>
    );
}
