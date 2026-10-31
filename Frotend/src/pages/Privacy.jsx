import { useEffect, useState } from "react";
import { Smartphone, Trash2, Ban, ChevronDown } from "lucide-react";
import Reveal from "../components/Reveal";
import { getHealth } from "../api/client";
import PageHeader from "../components/PageHeader";
import UiText from "../components/UiText";

const GLANCE = [
    {
        Icon: Smartphone,
        titleKey: "privacy_saved_title", title: "Saved on your device",
        items: [["privacy_saved_text", "Your text size"], ["privacy_saved_contrast", "Your contrast choice"], ["privacy_saved_language", "Your language"], ["privacy_saved_motion", "Your animation choice"]],
    },
    {
        Icon: Trash2,
        titleKey: "privacy_not_saved_title", title: "Not saved by Aagahi",
        items: [["privacy_not_saved_uploads", "Bills, photos and screenshots you upload"], ["privacy_not_saved_questions", "Questions you type or speak"], ["privacy_not_saved_chat", "Chat history"]],
    },
    {
        Icon: Ban,
        titleKey: "privacy_never_title", title: "Never asked for",
        items: [["privacy_never_secrets", "Passwords, one-time codes (OTP) or PINs"], ["privacy_never_contacts", "Contacts or bank accounts"], ["privacy_never_account", "Sign-up or an account"], ["privacy_never_tracking", "Tracking or analytics"]],
    },
];

const FAQ = [
    {
        qKey: "privacy_faq_bill_q", q: "What happens to a bill I upload?",
        a: [["privacy_faq_bill_a1", "Your file is held in the server's memory only while your request is being answered. It is not written to disk, and it is discarded once you get your answer."],
        ["privacy_faq_bill_a2", "Account numbers are hidden before anything is read by AI, and Aagahi only ever shows the last four digits, like ••••1234."]],
    },
    {
        qKey: "privacy_faq_ai_q", q: "Can the AI be wrong?",
        a: [["privacy_faq_ai_a1", "Yes. Explanations from AI are estimates and can contain mistakes. Always check the original bill or screen before you act on anything."],
        ["privacy_faq_ai_a2", "Aagahi only explains and teaches. It never pays a bill, sends a message or taps anything for you."]],
    },
    {
        qKey: "privacy_faq_voice_q", q: "How do voice questions work?",
        a: [["privacy_faq_voice_a1", "When you speak a question, your browser turns your voice into text. Some browsers do this using an online service run by the browser maker, which Aagahi does not control."],
        ["privacy_faq_voice_a2", "Aagahi does not record or keep your audio or the words you said. You will always see the question as text, and you can type it instead."]],
    },
    {
        qKey: "privacy_faq_mock_q", q: "Are the WhatsApp and Gmail screens real?",
        a: [["privacy_faq_mock_a", "No. The pictures in the guides are simple recreated mock screens, so you can practise without opening a real app. They are not the real WhatsApp or Gmail."]],
    },
    {
        qKey: "privacy_faq_clear_q", q: "How do I clear what is saved?",
        a: [["privacy_faq_clear_a", "Your settings are kept in your browser only. To remove them, clear this site's data in your browser settings, or ask someone you trust to help you do it."]],
    },
];

const MODE_TEXT = {
    checking: "Checking how Aagahi is running…",
    cached: "Right now Aagahi is in demo mode. Only the built-in sample bills are explained, and nothing is sent to an AI service.",
    live: "Right now Aagahi is in live mode. A file you upload is sent to an AI service so it can be read. Aagahi does not keep it, and the AI service's own rules apply to how it handles the request.",
    offline: "Right now Aagahi is not connected to its server, so only the built-in examples and guides are available.",
};
const MODE_KEY = { checking: "privacy_mode_checking", cached: "privacy_mode_cached", live: "privacy_mode_live", offline: "privacy_mode_offline" };

function ModeNote() {
    const [mode, setMode] = useState("checking");
    useEffect(() => {
        let alive = true;
        getHealth().then((h) => alive && setMode(h.mode)).catch(() => alive && setMode("offline"));
        return () => { alive = false; };
    }, []);
    const currentMode = MODE_TEXT[mode] ? mode : "offline";
    return <p className="notice" aria-live="polite"><UiText k={MODE_KEY[currentMode]} english={MODE_TEXT[currentMode]} /></p>;
}

export default function Privacy() {
    return (
        <>
            <PageHeader title={<UiText k="privacy_page_title" english="Your privacy" />}>
                <UiText k="privacy_intro" english="Aagahi is built to keep almost nothing. Here is what that means in plain words." />
            </PageHeader>


            <div className="container section">


                <div className="glance">
                    {GLANCE.map(({ Icon, titleKey, title, items }, i) => (
                        <Reveal key={title} delay={i * 120}>
                            <section className="glance-card">
                                <span className="bubble"><Icon aria-hidden="true" /></span>
                                <h2><UiText k={titleKey} english={title} /></h2>
                                <ul>{items.map(([key, label]) => <li key={key}><UiText k={key} english={label} /></li>)}</ul>
                            </section>
                        </Reveal>
                    ))}
                </div>

                <ModeNote />

                <h2><UiText k="privacy_questions_title" english="Common questions" /></h2>
                <div className="faq">
                    {FAQ.map(({ qKey, q, a }) => (
                        <details key={q}>
                            <summary><UiText k={qKey} english={q} /><ChevronDown className="chev-d" aria-hidden="true" /></summary>
                            <div className="faq-body">{a.map(([key, text]) => <p key={key}><UiText k={key} english={text} /></p>)}</div>
                        </details>
                    ))}
                </div>

                <p className="muted"><UiText k="privacy_footer" english="Aagahi is a prototype made for a hackathon. If anything here is unclear, please ask a family member or someone you trust to read it with you." /></p>
            </div>
        </>
    );
}
