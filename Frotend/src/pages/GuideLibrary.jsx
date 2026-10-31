import { useState } from "react";
import { Link } from "react-router-dom";
import { Video, Mic, MapPin, Image as ImageIcon, Mail, Search, ChevronRight } from "lucide-react";
import data from "../data/guides.json";
import Reveal from "../components/Reveal";
import { useSettings } from "../context/SettingsContext";
import PageHeader from "../components/PageHeader";

const ICONS = {
    "whatsapp-video-call": Video, "whatsapp-voice-message": Mic, "whatsapp-share-location": MapPin,
    "whatsapp-send-photo": ImageIcon, "gmail-attach-file": Mail
};
const GROUPS = [["whatsapp", "WhatsApp"], ["gmail", "Email (Gmail)"]];

export default function GuideLibrary() {
    const [q, setQ] = useState("");
    const { settings } = useSettings();
    const ur = settings.lang === "ur";
    const match = (g) => `${g.title} ${g.title_ur || ""} ${g.app}`.toLowerCase().includes(q.trim().toLowerCase());

    return (
        <>
            <PageHeader title="Guides">Pick a task. Each guide shows one small step at a time.</PageHeader>
            <div className="container section">

                <label className="search">
                    <Search aria-hidden="true" />
                    <span className="sr">Search guides</span>
                    <input type="search" placeholder="Search, for example “photo”" value={q} onChange={(e) => setQ(e.target.value)} />
                </label>

                {GROUPS.map(([app, label]) => {
                    const items = data.guides.filter((g) => g.app === app && match(g));
                    if (!items.length) return null;
                    return (
                        <section key={app} className="lib-group">
                            <h2>{label}</h2>
                            <div className="lib-grid">
                                {items.map((g, i) => {
                                    const Ico = ICONS[g.id] || Mail;
                                    return (
                                        <Reveal key={g.id} delay={i * 100}>
                                            <Link to={`/guides/${g.id}`} className="guide-card">
                                                <span className="bubble"><Ico aria-hidden="true" /></span>
                                                <span className="grow">
                                                    <strong>{ur && g.title_ur ? g.title_ur : g.title}</strong>
                                                    <small>{g.steps.length} steps</small>
                                                </span>
                                                <ChevronRight className="chev" aria-hidden="true" />
                                            </Link>
                                        </Reveal>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
                {!data.guides.some(match) && <p>No guides match that search. Try “video” or “email”.</p>}
            </div>
        </>
    );
}