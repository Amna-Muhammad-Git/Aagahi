import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, MessageCircle } from "lucide-react";
import data from "../data/guides.json";
import PhoneMock from "../components/PhoneMock";
import { useSettings } from "../context/SettingsContext";

export default function GuideView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const guide = data.guides.find((g) => g.id === id);
    const total = guide ? guide.steps.length : 0;
    const [i, setI] = useState(0);
    const [dir, setDir] = useState("next");

    useEffect(() => { setI(0); setDir("next"); }, [id]);

    const go = useCallback((n) => { setDir(n > i ? "next" : "back"); setI(n); }, [i]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "ArrowRight" && i < total - 1) go(i + 1);
            if (e.key === "ArrowLeft" && i > 0) go(i - 1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [i, total, go]);

    if (!guide) {
        return (
            <div className="container section">
                <h1>Guide not found</h1>
                <Link className="btn btn-primary" to="/guides">See all guides</Link>
            </div>
        );
    }

    const step = guide.steps[i];
    const last = i === total - 1;
    const title = settings.lang === "ur" && guide.title_ur ? guide.title_ur : guide.title;

    return (
        <div className="container section guide">
            <Link to="/guides" className="back"><ChevronLeft aria-hidden="true" /> All guides</Link>
            <h1>{title}</h1>

            <div className="progress" role="progressbar" aria-label="Guide progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={i + 1}>
                <span style={{ width: `${((i + 1) / total) * 100}%` }} />
            </div>
            <p className="step-count" aria-live="polite">Step {i + 1} of {total}</p>

            <div className={`step slide-${dir}`} key={i}>
                <div className="step-text">
                    <span className="step-num" aria-hidden="true">{i + 1}</span>
                    <p>{step.text}</p>
                    {last && <p className="done"><Check aria-hidden="true" /> You have reached the last step. Well done!</p>}
                </div>
                {step.image
                    ? <figure className="mock"><img src={step.image} alt="Illustration for this guide step" /><figcaption>Illustration</figcaption></figure>
                    : <PhoneMock screen={data.screens[step.screen]} hl={step.hl} />}
            </div>

            <div className="step-nav">
                <button className="btn btn-secondary" disabled={i === 0} onClick={() => go(i - 1)}>
                    <ChevronLeft aria-hidden="true" /> Back
                </button>
                {last
                    ? <button className="btn btn-primary" onClick={() => navigate("/guides")}><Check aria-hidden="true" /> Finish</button>
                    : <button className="btn btn-primary" onClick={() => go(i + 1)}>Next <ChevronRight aria-hidden="true" /></button>}
            </div>

            <Link className="btn btn-secondary ask" to={`/ask?guide=${guide.id}`}>
                <MessageCircle aria-hidden="true" /> Ask a question about this guide
            </Link>
        </div>
    );
}
