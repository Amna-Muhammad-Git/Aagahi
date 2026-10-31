import { Link } from "react-router-dom";
import { Receipt, Video, Mic, MapPin, Paperclip, MessageCircle, ChevronRight, ShieldCheck } from "lucide-react";

const hide = (e) => { e.currentTarget.style.display = "none"; };

const tasks = [
    { to: "/bills", label: "Explain a bill", Icon: Receipt },
    { to: "/guides/whatsapp-video-call", label: "Make a WhatsApp video call", Icon: Video },
    { to: "/guides/whatsapp-voice-message", label: "Send a voice message", Icon: Mic },
    { to: "/guides/whatsapp-share-location", label: "Share your location", Icon: MapPin },
    { to: "/guides/gmail-attach-file", label: "Attach a file in Gmail", Icon: Paperclip },
    { to: "/ask", label: "Ask a question", Icon: MessageCircle },
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
                        <h1>Understand your bills. Learn WhatsApp and email.</h1>
                        <p>Clear, calm steps that teach you to do it yourself. No accounts and no pressure.</p>
                        <div className="hero-actions">
                            <Link className="btn btn-primary" to="/bills">Explain a bill</Link>
                            <Link className="btn btn-secondary" to="/guides">Browse guides</Link>
                        </div>
                    </div>
                    <img src="/images/hero.jpg" alt="A smiling older woman using a smartphone" onError={hide} />
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <h2>Quick tasks</h2>
                    <ul className="tasks">
                        {tasks.map(({ to, label, Icon }) => (
                            <li key={to}>
                                <Link to={to}><Icon aria-hidden="true" /><span className="grow">{label}</span><ChevronRight aria-hidden="true" /></Link>
                            </li>
                        ))}
                    </ul>

                    <div className="cards">
                        {features.map((f) => (
                            <article className="card" key={f.title}>
                                <img src={`/images/${f.img}`} alt={f.alt} onError={hide} />
                                <div className="card-body">
                                    <h3>{f.title}</h3>
                                    <p>{f.text}</p>
                                    <Link className="btn btn-secondary" to={f.to}>{f.cta}</Link>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="alert" role="note">
                        <ShieldCheck aria-hidden="true" />
                        <div>
                            <strong>Your privacy matters.</strong> Uploads are used only to answer your request and are not saved.
                            {" "}<Link to="/privacy">Read how Agahi handles your data</Link>.
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}