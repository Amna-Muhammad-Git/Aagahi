import { Link } from "react-router-dom";
import { Receipt, Video, Mic, MapPin, Paperclip, MessageCircle, ChevronRight, ShieldCheck, ScanSearch } from "lucide-react";
import Reveal from "../components/Reveal";

const hide = (e) => { e.currentTarget.style.display = "none"; };

const tasks = [
    { to: "/bills", label: "Explain a bill", Icon: Receipt },
    { to: "/screen-helper", label: "Explain a screenshot", Icon: ScanSearch },
    { to: "/guides/whatsapp-video-call", label: "Make a WhatsApp video call", Icon: Video },
    { to: "/guides/whatsapp-voice-message", label: "Send a voice message", Icon: Mic },
    { to: "/guides/whatsapp-share-location", label: "Share your location", Icon: MapPin },
    { to: "/guides/gmail-attach-file", label: "Attach a file in Gmail", Icon: Paperclip },
    { to: "/ask", label: "Ask a question", Icon: MessageCircle },
];

const stats = [
    ["5", "step-by-step guides"],
    ["3", "sample bills to practise on"],
    ["15", "plain-language terms"],
    ["0", "passwords ever asked for"],
];

const features = [
    { img: "card-bills.jpg", alt: "A man reading a bill at a laptop", title: "Understand your bills", text: "Pick a sample or upload a bill. We explain each part in plain language.", to: "/bills", cta: "Explain a bill" },
    { img: "card-whatsapp.jpg", alt: "A grandmother on a video call", title: "Learn WhatsApp", text: "Video calls, voice messages, photos and location, one step at a time.", to: "/guides", cta: "See WhatsApp guides" },
    { img: "card-gmail.jpg", alt: "An older couple using a laptop together", title: "Learn email", text: "Write, attach files, reply and spot suspicious emails.", to: "/guides", cta: "See email guides" },
];

export default function Home() {
    return (
        <>
            <section className="hero">
                <div className="container">
                    <div className="hero-copy">
                        {/* <div className="brand rise" style={{ "--d": "0ms" }}>
                            <img src="/images/logo.png" alt="" className="brand-img" onError={hide} />
                            <span>Aagahi</span>
                        </div> */}

                        <h1 className="hero-title">
                            <span className="line"><span className="line-in" style={{ "--i": 0 }}>Read the bill,</span></span>
                            <span className="line"><span className="line-in" style={{ "--i": 1 }}>and learn the dial,</span></span>
                            <span className="line"><span className="line-in" style={{ "--i": 2 }}>with <em className="brand-word">Aagahi</em></span></span>
                            <span className="highlight"><span className="line-in" style={{ "--i": 3 }}>you’ll go the extra mile.</span></span>
                        </h1>

                        <p className="hero-sub rise" style={{ "--d": "900ms" }}>
                            Clear, calm steps that teach you to do it yourself. No accounts and no pressure.
                        </p>
                        <div className="hero-actions rise" style={{ "--d": "1050ms" }}>
                            <Link className="btn btn-primary" to="/bills">Explain a bill</Link>
                            <Link className="btn btn-secondary" to="/guides">Browse guides</Link>
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
                    {stats.map(([n, label], i) => (
                        <Reveal key={label} delay={i * 100} className="stat">
                            <strong>{n}</strong><span>{label}</span>
                        </Reveal>
                    ))}
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <Reveal><h2>Quick tasks</h2></Reveal>
                    <ul className="tasks">
                        {tasks.map(({ to, label, Icon }, i) => (
                            <Reveal as="li" key={to} delay={(i % 2) * 100}>
                                <Link to={to}>
                                    <span className="bubble"><Icon aria-hidden="true" /></span>
                                    <span className="grow">{label}</span>
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
                                        <h3>{f.title}</h3>
                                        <p>{f.text}</p>
                                        <Link className="btn btn-secondary" to={f.to}>{f.cta}</Link>
                                    </div>
                                </article>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal>
                        <div className="alert" role="note">
                            <ShieldCheck aria-hidden="true" />
                            <div>
                                <strong>Your privacy matters.</strong> Aagahi does not save uploads. In live mode, files are sent to an AI provider to answer your request.{" "}
                                <Link to="/privacy">Read how Agahi handles your data</Link>.
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
