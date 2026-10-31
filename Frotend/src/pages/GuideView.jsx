import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, MessageCircle } from "lucide-react";
import data from "../data/guides.json";
import PhoneMock from "../components/PhoneMock";
import { useSettings } from "../context/SettingsContext";
import UiText from "../components/UiText";
import { useT } from "../i18n";

export default function GuideView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const t = useT();
    const guide = data.guides.find((g) => g.id === id);
    const total = guide ? guide.steps.length : 0;
    const [i, setI] = useState(0);
    const [dir, setDir] = useState("next");

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
                <h1><UiText k="guide_not_found" english="Guide not found" /></h1>
                <Link className="btn btn-primary" to="/guides"><UiText k="guide_all_cta" english="See all guides" /></Link>
            </div>
        );
    }

    const step = guide.steps[i];
    const last = i === total - 1;
    const title = settings.lang === "ur" && guide.title_ur ? <><span className="ui-ur" lang="ur" dir="rtl">{guide.title_ur}</span><small className="ui-en">{guide.title}</small></> : guide.title;

    return (
        <div className="container section guide">
            <Link to="/guides" className="back"><ChevronLeft aria-hidden="true" /> <UiText k="guide_all" english="All guides" /></Link>
            <h1>{title}</h1>

            <div className="progress" role="progressbar" aria-label={settings.lang === "ur" ? t("guide_progress") : "Guide progress"} aria-valuemin={1} aria-valuemax={total} aria-valuenow={i + 1}>
                <span style={{ width: `${((i + 1) / total) * 100}%` }} />
            </div>
            <p className="step-count" aria-live="polite">{settings.lang === "ur" ? <span className="ui-ur" lang="ur" dir="rtl">{t("guide_step")} {i + 1} {t("guide_of")} {total}</span> : <>Step {i + 1} of {total}</>}</p>

            <div className={`step slide-${dir}`} key={i}>
                <div className="step-text">
                    <span className="step-num" aria-hidden="true">{i + 1}</span>
                    <p className="step-instruction">
                        {settings.lang === "ur" && step.text_ur
                            ? <><span className="ui-ur" lang="ur" dir="rtl">{step.text_ur}</span><small className="ui-en">{step.text}</small></>
                            : step.text}
                    </p>
                    {last && <p className="done"><Check aria-hidden="true" /> <UiText k="guide_last" english="You have reached the last step. Well done!" /></p>}
                </div>
                {step.image
                    ? <figure className="mock"><img src={step.image} alt="Illustration for this guide step" /><figcaption>Illustration</figcaption></figure>
                    : <PhoneMock screen={data.screens[step.screen]} hl={step.hl} />}
            </div>

            <div className="step-nav">
                <button className="btn btn-secondary" disabled={i === 0} onClick={() => go(i - 1)}>
                    <ChevronLeft aria-hidden="true" /> <UiText k="guide_back" english="Back" />
                </button>
                {last
                    ? <button className="btn btn-primary" onClick={() => navigate("/guides")}><Check aria-hidden="true" /> <UiText k="guide_finish" english="Finish" /></button>
                    : <button className="btn btn-primary" onClick={() => go(i + 1)}><UiText k="guide_next" english="Next" /> <ChevronRight aria-hidden="true" /></button>}
            </div>

            <Link className="btn btn-secondary ask" to={`/ask?guide=${guide.id}`}>
                <MessageCircle aria-hidden="true" /> <UiText k="guide_ask" english="Ask a question about this guide" />
            </Link>
        </div>
    );
}
