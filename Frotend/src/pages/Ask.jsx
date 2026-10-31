import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mic, Square, Send, Volume2, VolumeX, X } from "lucide-react";
import { friendlyError, supportChat } from "../api/client";
import { localMatch, safetyReply } from "../api/localAnswers";
import guides from "../data/guides.json";
import { useSettings } from "../context/SettingsContext";
import PageHeader from "../components/PageHeader";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const SOURCE = { cached: "Prepared answer", live: "Live AI answer", offline: "Built-in answer" };
const STARTERS = ["How do I send a photo?", "How do I make a video call?", "What does late fee mean?", "How can I spot a scam email?"];
const FALLBACK_CODES = ["mode_unavailable", "network", "timeout", "provider_unavailable"];
const guideTitle = (id) => guides.guides.find((g) => g.id === id)?.title;

export default function Ask() {
    const { settings } = useSettings();
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

    async function send(raw) {
        const message = raw.trim();
        if (!message || busy) return;
        setText("");
        setVoiceError("");
        add({ role: "user", text: message });

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
                add({ role: "bot", text: "I don't have an answer for that yet. Try one of the guides, or ask in different words.", related: [], mode: "offline", nogo: true });
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
                    ? "The microphone is blocked. Allow it in your browser, or type your question instead."
                    : e.error === "no-speech"
                        ? "I didn't hear anything. Tap the microphone and try again, or type your question."
                        : "Voice didn't work this time. Please type your question instead."
            );
        };
        rec.onend = () => setListening(false);
        recRef.current = rec;
        try { rec.start(); setListening(true); } catch { setVoiceError("Voice didn't start. Please type your question."); }
    }

    const stopVoice = () => recRef.current?.stop();

    return (
        <>
            <PageHeader title="Ask a question">
                Ask about bills, WhatsApp or email. Aagahi explains and teaches. It never does things for you.
            </PageHeader>
            <div className="container section chat">


                {guideId && (
                    <p className="context">
                        Asking about: <strong>{guideTitle(guideId)}</strong>
                        <button className="btn btn-secondary small" onClick={() => setParams({})}><X aria-hidden="true" /> Clear</button>
                    </p>
                )}

                <div className="msgs" role="log" aria-live="polite" aria-label="Conversation">
                    {messages.length === 0 && (
                        <div className="starters">
                            <p>Try one of these:</p>
                            <div className="chips">{STARTERS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div key={m.id} className={`msg ${m.role}`}>
                            <p dir="auto">{m.text}</p>
                            {m.role === "bot" && <span className="tag">{SOURCE[m.mode] || SOURCE.offline}</span>}
                            {m.related?.length > 0 && (
                                <div className="related">
                                    {m.related.filter(guideTitle).map((id) => <Link key={id} to={`/guides/${id}`}>Open guide: {guideTitle(id)}</Link>)}
                                </div>
                            )}
                            {m.nogo && <div className="related"><Link to="/guides">Browse all guides</Link></div>}
                        </div>
                    ))}
                    {busy && <div className="msg bot"><p>Finding an answer…</p></div>}
                    <div ref={endRef} />
                </div>

                <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
                    {SR && (
                        <button type="button" className={`mic-btn ${listening ? "on" : ""}`} onClick={listening ? stopVoice : startVoice}
                            aria-label={listening ? "Stop listening" : "Ask by voice"}>
                            {listening ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
                        </button>
                    )}
                    <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} dir="auto"
                        aria-label="Your question" placeholder={listening ? "Listening…" : "Type or speak your question"} />
                    <button className="btn btn-primary" type="submit" disabled={!text.trim() || busy}><Send aria-hidden="true" /> Ask</button>
                </form>

                <div className="chat-tools">
                    <button className="option" aria-pressed={speakOn} onClick={() => { window.speechSynthesis?.cancel(); setSpeakOn((v) => !v); }}>
                        {speakOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />} Read answers aloud: {speakOn ? "On" : "Off"}
                    </button>
                </div>

                {voiceError && <p className="notice" role="alert">{voiceError}</p>}
                {!SR && <p className="notice">Voice questions aren't supported in this browser, so please type your question. Chrome works best for voice.</p>}
                <p className="muted">Your conversation stays on this page only and is gone when you leave. Answers can be wrong, so check the original bill or screen before you act. Never share a password, OTP or PIN.</p>
            </div>
        </>
    );
}