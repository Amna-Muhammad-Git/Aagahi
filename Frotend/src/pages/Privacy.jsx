import { useEffect, useState } from "react";
import { Smartphone, Trash2, Ban, ChevronDown } from "lucide-react";
import Reveal from "../components/Reveal";
import { getHealth } from "../api/client";
import PageHeader from "../components/PageHeader";

const GLANCE = [
    {
        Icon: Smartphone,
        title: "Saved on your device",
        items: ["Your text size", "Your contrast choice", "Your language", "Your animation choice"],
    },
    {
        Icon: Trash2,
        title: "Not saved by Aagahi",
        items: ["Bills, photos and screenshots you upload", "Questions you type or speak", "Chat history"],
    },
    {
        Icon: Ban,
        title: "Never asked for",
        items: ["Passwords, one-time codes (OTP) or PINs", "Contacts or bank accounts", "Sign-up or an account", "Tracking or analytics"],
    },
];

const FAQ = [
    {
        q: "What happens to a bill I upload?",
        a: [
            "Your file is held in the server's memory only while your request is being answered. It is not written to disk, and it is discarded once you get your answer.",
            "In live mode, the bill image is sent to the selected AI provider, which may receive the full account number printed on it. Agahi may show the number read from your bill so you can check it when paying. The upload is not kept. Compare the number with your original bill before paying, and do not upload a bill unless you are comfortable sharing it with that provider.",
        ],
    },
    {
        q: "Can the AI be wrong?",
        a: [
            "Yes. Explanations from AI are estimates and can contain mistakes. Always check the original bill or screen before you act on anything.",
            "Aagahi only explains and teaches. It never pays a bill, sends a message or taps anything for you.",
        ],
    },
    {
        q: "How do voice questions work?",
        a: [
            "When you speak a question, your browser turns your voice into text. Some browsers do this using an online service run by the browser maker, which Aagahi does not control.",
            "Aagahi does not record or keep your audio or the words you said. You will always see the question as text, and you can type it instead.",
        ],
    },
    {
        q: "Are the WhatsApp and Gmail screens real?",
        a: [
            "No. The pictures in the guides are simple recreated mock screens, so you can practise without opening a real app. They are not the real WhatsApp or Gmail.",
        ],
    },
    {
        q: "How do I clear what is saved?",
        a: [
            "Your settings are kept in your browser only. To remove them, clear this site's data in your browser settings, or ask someone you trust to help you do it.",
        ],
    },
];

const MODE_TEXT = {
    checking: "Checking how Aagahi is running…",
    cached: "Right now Aagahi is in demo mode. Only the built-in sample bills are explained, and nothing is sent to an AI service.",
    live: "Right now Aagahi is in live mode. A file you upload is sent to an AI service so it can be read. Aagahi does not keep it, and the AI service's own rules apply to how it handles the request.",
    offline: "Right now Aagahi is not connected to its server, so only the built-in examples and guides are available.",
};

function ModeNote() {
    const [mode, setMode] = useState("checking");
    useEffect(() => {
        let alive = true;
        getHealth().then((h) => alive && setMode(h.mode)).catch(() => alive && setMode("offline"));
        return () => { alive = false; };
    }, []);
    return <p className="notice" aria-live="polite">{MODE_TEXT[mode] || MODE_TEXT.offline}</p>;
}

export default function Privacy() {
    return (
        <>
            <PageHeader title="Your privacy">
                Aagahi is built to keep almost nothing. Here is what that means in plain words.
            </PageHeader>


            <div className="container section">


                <div className="glance">
                    {GLANCE.map(({ Icon, title, items }, i) => (
                        <Reveal key={title} delay={i * 120}>
                            <section className="glance-card">
                                <span className="bubble"><Icon aria-hidden="true" /></span>
                                <h2>{title}</h2>
                                <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
                            </section>
                        </Reveal>
                    ))}
                </div>

                <ModeNote />

                <h2>Common questions</h2>
                <div className="faq">
                    {FAQ.map(({ q, a }) => (
                        <details key={q}>
                            <summary>{q}<ChevronDown className="chev-d" aria-hidden="true" /></summary>
                            <div className="faq-body">{a.map((p) => <p key={p}>{p}</p>)}</div>
                        </details>
                    ))}
                </div>

                <p className="muted">Aagahi is a prototype made for a hackathon. If anything here is unclear, please ask a family member or someone you trust to read it with you.</p>
            </div>
        </>
    );
}
