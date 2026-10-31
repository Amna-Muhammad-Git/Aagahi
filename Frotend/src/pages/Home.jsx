import { Link } from "react-router-dom";
import { Receipt, Video, Mic, MapPin, Paperclip, MessageCircle, ChevronRight, ShieldCheck, ScanSearch } from "lucide-react";
import Reveal from "../components/Reveal";
import UiText from "../components/UiText";
import { useSettings } from "../context/SettingsContext";

const hide = (e) => { e.currentTarget.style.display = "none"; };

const tasks = [
    { to: "/bills", label: "Explain a bill", key: "task_bill", Icon: Receipt },
    { to: "/screen-helper", label: "Explain a screenshot", key: "task_screen", Icon: ScanSearch },
    { to: "/guides/whatsapp-video-call", label: "Make a WhatsApp video call", key: "task_video", Icon: Video },
    { to: "/guides/whatsapp-voice-message", label: "Send a voice message", key: "task_voice", Icon: Mic },
    { to: "/guides/whatsapp-share-location", label: "Share your location", key: "task_location", Icon: MapPin },
    { to: "/guides/gmail-attach-file", label: "Attach a file in Gmail", key: "task_file", Icon: Paperclip },
    { to: "/ask", label: "Ask a question", key: "task_ask", Icon: MessageCircle },
];

const stats = [
    ["5", "step-by-step guides", "stat_guides"],
    ["3", "sample bills to practise on", "stat_bills"],
    ["15", "plain-language terms", "stat_terms"],
    ["0", "passwords ever asked for", "stat_passwords"],
];

const features = [
    { img: "card-bills.jpg", alt: "A man reading a bill at a laptop", title: "Understand your bills", titleKey: "feature_bills_title", text: "Pick a sample or upload a bill. We explain each part in plain language.", textKey: "feature_bills_text", to: "/bills", cta: "Explain a bill", ctaKey: "feature_bills_cta" },
    { img: "card-whatsapp.jpg", alt: "A grandmother on a video call", title: "Learn WhatsApp", titleKey: "feature_whatsapp_title", text: "Video calls, voice messages, photos and location, one step at a time.", textKey: "feature_whatsapp_text", to: "/guides", cta: "See WhatsApp guides", ctaKey: "feature_whatsapp_cta" },
    { img: "card-gmail.jpg", alt: "An older couple using a laptop together", title: "Learn email", titleKey: "feature_email_title", text: "Write, attach files, reply and spot suspicious emails.", textKey: "feature_email_text", to: "/guides", cta: "See email guides", ctaKey: "feature_email_cta" },
];

export default function Home() {
    const { settings } = useSettings();
    const ur = settings.lang === "ur";
    return (
        <>
            <section className="hero">
                <div className="container">
                    <div className="hero-copy">
                        {/* <div className="brand rise" style={{ "--d": "0ms" }}>
                            <img src="/images/logo.png" alt="" className="brand-img" onError={hide} />
                            <span>Aagahi</span>
                        </div> */}

                        <h1 className={`hero-title ${ur ? "hero-title-ur" : ""}`}>
                            {ur ? <UiText k="hero_line_1" /> : <>
                                <span className="line"><span className="line-in" style={{ "--i": 0 }}>Read the bill,</span></span>
                                <span className="line"><span className="line-in" style={{ "--i": 1 }}>and learn the dial,</span></span>
                                <span className="line"><span className="line-in" style={{ "--i": 2 }}>with <em className="brand-word">Aagahi</em></span></span>
                                <span className="highlight"><span className="line-in" style={{ "--i": 3 }}>you’ll go the extra mile.</span></span>
                            </>}
                        </h1>

                        <p className="hero-sub rise" style={{ "--d": "900ms" }}>
                            <UiText k="hero_subtitle" english="Clear, calm steps that teach you to do it yourself. No accounts and no pressure." />
                        </p>
                        <div className="hero-actions rise" style={{ "--d": "1050ms" }}>
                            <Link className="btn btn-primary" to="/bills"><UiText k="hero_bill" english="Explain a bill" /></Link>
                            <Link className="btn btn-secondary" to="/guides"><UiText k="hero_guides" english="Browse guides" /></Link>
                        </div>
                    </div>

                    <div className="hero-media">
                        <div className="hero-frame">
                            <img src="/images/hero.jpg" alt="A smiling older man using a smartphone beside a laptop" onError={hide} />
                        </div>
                    </div>
                </div>
            </section>
            <div className="container">
                <div className="stats">
                    {stats.map(([n, label, key], i) => (
                        <Reveal key={label} delay={i * 100} className="stat">
                            <strong>{n}</strong><span><UiText k={key} english={label} /></span>
                        </Reveal>
                    ))}
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <Reveal><h2><UiText k="quick_tasks" english="Quick tasks" /></h2></Reveal>
                    <ul className="tasks">
                        {tasks.map(({ to, label, key, Icon }, i) => (
                            <Reveal as="li" key={to} delay={(i % 2) * 100}>
                                <Link to={to}>
                                    <span className="bubble"><Icon aria-hidden="true" /></span>
                                    <span className="grow"><UiText k={key} english={label} bilingual /></span>
                                    <ChevronRight className="chev" aria-hidden="true" />
                                </Link>
                            </Reveal>
                        ))}
                    </ul>

                    <div className="cards">
                        {features.map((f, i) => (
                            <Reveal key={f.title} delay={i * 150}>
                                <article className="card">
                                    <img src={`/images/${f.img}`} alt={f.alt} onError={hide} />
                                    <div className="card-body">
                                        <h3><UiText k={f.titleKey} english={f.title} /></h3>
                                        <p><UiText k={f.textKey} english={f.text} /></p>
                                        <Link className="btn btn-secondary" to={f.to}><UiText k={f.ctaKey} english={f.cta} /></Link>
                                    </div>
                                </article>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal>
                        <div className="alert" role="note">
                            <ShieldCheck aria-hidden="true" />
                            <div>
                                <strong><UiText k="privacy_title" english="Your privacy matters." /></strong> <UiText k="privacy_text" english="Uploads are used only to answer your request and are not saved." />{" "}
                                <Link to="/privacy"><UiText k="privacy_link" english="Read how Aagahi handles your data" /></Link>.
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
