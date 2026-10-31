import { Link } from "react-router-dom";
import { Receipt, Video, Mic, MapPin, Paperclip, MessageCircle, ChevronRight, ShieldCheck } from "lucide-react";
import Reveal from "../components/Reveal";

const hide = (e) => { e.currentTarget.style.display = "none"; };

const tasks = [
    { to: "/bills", label: "Explain a bill", Icon: Receipt },
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
                    <div>
                        <h1 className="rise" style={{ "--d": "0ms" }}>
                            Understand your bills. Learn <span className="highlight">WhatsApp</span> and email.
                        </h1>
                        <p className="rise" style={{ "--d": "150ms" }}>
                            Clear, calm steps that teach you to do it yourself. No accounts and no pressure.
                        </p>
                        <div className="hero-actions rise" style={{ "--d": "300ms" }}>
                            <Link className="btn btn-primary" to="/bills">Explain a bill</Link>
                            <Link className="btn btn-secondary" to="/guides">Browse guides</Link>
                        </div>
                    </div>
                    <div className="hero-media rise" style={{ "--d": "200ms" }}>
                        <img src="/images/hero.jpg" alt="A smiling older woman using a smartphone" onError={hide} />
                        <div className="float-card" aria-hidden="true">
                            <span className="dot">2</span>
                            <div><strong>Step 2 of 5</strong><br />Tap the video icon</div>
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
                                <strong>Your privacy matters.</strong> Uploads are used only to answer your request and are not saved.{" "}
                                <Link to="/privacy">Read how Agahi handles your data</Link>.
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}