import { Video, Phone, Mic, Plus, Paperclip, Send, PhoneOff, Pencil, MapPin, FileText, Image as ImageIcon } from "lucide-react";
import UiText from "./UiText";

const ICONS = {
    video: Video, phone: Phone, mic: Mic, plus: Plus, paperclip: Paperclip, send: Send,
    end: PhoneOff, compose: Pencil, location: MapPin, document: FileText, gallery: ImageIcon
};
const LABELS = {
    video: "Video call", phone: "Voice call", mic: "Microphone", plus: "Attach", paperclip: "Attach file",
    send: "Send", end: "End call", compose: "Compose"
};

function Icon({ id, hl }) {
    const I = ICONS[id];
    return (
        <span className={`m-icon ${hl === id ? "ring" : ""} ${id === "end" ? "end" : ""}`} aria-label={LABELS[id] || id}>
            <I size={22} aria-hidden="true" />
        </span>
    );
}

export default function PhoneMock({ screen, hl }) {
    if (!screen) return null;
    const appName = screen.app === "gmail" ? "Gmail" : "WhatsApp";
    return (
        <figure className="mock">
            <div className="phone" data-app={screen.app}>
                <div className="m-head">
                    <strong>{screen.header}</strong>
                    <span className="m-actions">{(screen.actions || []).map((a) => <Icon key={a} id={a} hl={hl} />)}</span>
                </div>
                <div className="m-body">
                    {screen.status && <p className="m-status">{screen.status}</p>}
                    {(screen.rows || []).map((r) => (
                        <div key={r} className={`m-row ${hl === r ? "ring" : ""}`}>{r}</div>
                    ))}
                    {screen.note && <p className="m-note">{screen.note}</p>}
                </div>
                {screen.composer && (
                    <div className="m-composer">
                        {screen.pill !== false && <span className="m-pill">Message</span>}
                        {screen.composer.map((c) => <Icon key={c} id={c} hl={hl} />)}
                    </div>
                )}
            </div>
            <figcaption><UiText k="mock_screen_caption" english={`Mock screen: a simplified drawing, not the real ${appName} app.`} /></figcaption>
        </figure>
    );
}
