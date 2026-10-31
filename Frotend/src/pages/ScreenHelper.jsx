import { useEffect, useRef, useState } from "react";
import { FileImage, Upload } from "lucide-react";
import { ERROR_COPY, explainScreen, friendlyError, getHealth } from "../api/client";
import PageHeader from "../components/PageHeader";
import PhoneMock from "../components/PhoneMock";
import AskPanel from "../components/AskPanel";
import guidesData from "../data/guides.json";
import { SCREEN_QUESTIONS, SCREEN_SAMPLES } from "../data/screenSamples";
import fallbackScreens from "../mocks/screens.json";
import { Check, ScanSearch } from "lucide-react";
import Reveal from "../components/Reveal";
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png"];
const SCREEN_BY_ID = Object.fromEntries(SCREEN_SAMPLES.map((s) => [s.id, s]));
const PREVIEW_HL = { "wa-location": "Send your current location", "gm-compose": "paperclip" };

export default function ScreenHelper() {
    const [mode, setMode] = useState("checking");
    const [current, setCurrent] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const fileInput = useRef(null);
    const resultRef = useRef(null);
    const previewRef = useRef("");


    useEffect(() => {
        let alive = true;
        getHealth().then((h) => alive && setMode(h.mode)).catch(() => alive && setMode("offline"));
        return () => { alive = false; };
    }, []);

    useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);
    useEffect(() => { if (current) resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [current]);

    function chooseSample(sample) {
        setError("");
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = "";
        setPreviewUrl("");
        setFile(null);
        setCurrent({ sampleId: sample.id, result: null });
        runExplain({ sampleId: sample.id });
    }

    function chooseFile(event) {
        const picked = event.target.files?.[0];
        event.target.value = "";
        if (!picked) return;
        setError("");
        setCurrent(null);
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = "";
        setPreviewUrl("");
        setFile(null);
        if (picked.size === 0) return setError(ERROR_COPY.screen_file_empty);
        if (!TYPES.includes(picked.type)) return setError(ERROR_COPY.screen_invalid_file_type);
        if (picked.size > MAX_BYTES) return setError(ERROR_COPY.file_too_large);
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = URL.createObjectURL(picked);
        setPreviewUrl(previewRef.current);
        setFile(picked);
    }

    async function runExplain(input) {
        setLoading(true);
        setError("");
        try {
            const result = await explainScreen(input);
            setCurrent({ sampleId: input.sampleId || null, file: input.file || null, result });
            if (result.mode) setMode(result.mode);
        } catch (e) {
            if (input.sampleId && ["network", "timeout", "server_error"].includes(e.code)) {
                const result = { ...fallbackScreens[input.sampleId], mode: "builtin" };
                setCurrent({ sampleId: input.sampleId, result });
                return;
            }
            setError(friendlyError(e));
        } finally {
            setLoading(false);
        }
    }

    function retry() {
        if (file) runExplain({ file });
        else if (current?.sampleId) chooseSample(SCREEN_BY_ID[current.sampleId]);
        else { setError(""); fileInput.current?.click(); }
    }

    const previewScreens = guidesData.screens;
    const result = current?.result;
    const questionAnswers = current?.sampleId ? fallbackScreens[current.sampleId]?.questions || [] : [];

    return (
        <>
            <PageHeader title="Explain a screen">Learn what a screen is showing, with clear steps. Aagahi explains and teaches; you stay in control.</PageHeader>
            <div className="container section screen-helper">

                <div className="screen-samples">
                    {SCREEN_SAMPLES.map((sample, i) => {
                        const selected = current?.sampleId === sample.id;
                        return (
                            <Reveal key={sample.id} delay={i * 120}>
                                <article className={`screen-sample ${selected ? "selected" : ""}`}>
                                    <h3>{sample.title}</h3>
                                    <div className="screen-sample-stage">
                                        <PhoneMock screen={previewScreens[sample.preview_screen]} hl={PREVIEW_HL[sample.preview_screen]} />
                                    </div>
                                    <button className="btn btn-primary" aria-pressed={selected} disabled={loading} onClick={() => chooseSample(sample)}>
                                        {selected ? <Check aria-hidden="true" /> : <ScanSearch aria-hidden="true" />}
                                        {selected ? "Showing explanation" : "Explain this screen"}
                                    </button>
                                </article>
                            </Reveal>
                        );
                    })}
                </div>

                <h2>Or upload a screenshot</h2>
                <div className="screen-upload">
                    <label className="drop">
                        <Upload aria-hidden="true" />
                        <span><strong>Choose a screenshot</strong><small>PNG or JPEG, up to 5 MB</small></span>
                        <input ref={fileInput} type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={chooseFile} />
                    </label>
                    {file && <div className="screen-file-preview"><img src={previewUrl} alt="Preview of the chosen screenshot" /><p><FileImage aria-hidden="true" /> {file.name}</p><button className="btn btn-primary" disabled={loading} onClick={() => runExplain({ file })}>{loading ? "Explaining…" : "Explain this screen"}</button></div>}
                </div>
                <p className="muted">Your screenshot is used for this request only and is not stored.</p>

                {error && <div className="error" role="alert"><span>{error}{error === ERROR_COPY.mode_unavailable ? " Sample screens are available above." : ""}</span><button className="btn btn-secondary" onClick={retry}>Try again</button></div>}
                {loading && <p className="screen-loading" aria-live="polite">Preparing an explanation…</p>}

                {result && <div className="screen-result" ref={resultRef}>
                    <h2>{result.app_name}</h2>
                    <p>{result.description}</p>
                    <ol className="screen-steps">{result.steps.map((step, i) => <li key={`${i}-${step}`}><span className="screen-step-number">{i + 1}</span><span>{step}</span></li>)}</ol>
                    <p><strong className="screen-confidence">Confidence: {result.confidence}</strong></p>
                    {result.confidence === "low" && <p>Please ask a trusted family member if you are unsure.</p>}
                    <p className="screen-safety"><strong>Safety note:</strong> {result.safety_note}</p>
                    <p className="screen-mode">{result.mode === "live" ? "Live AI answer" : result.mode === "builtin" ? "Built-in example" : "Prepared answer"}</p>
                    {current.sampleId && <AskPanel key={current.sampleId} bill={Object.fromEntries(questionAnswers.map((q, i) => [SCREEN_QUESTIONS[i]?.key, q.answer]))} sampleId={current.sampleId} apiMode={mode} suggested={SCREEN_QUESTIONS} subject="screen" />}
                </div>}
            </div>
        </>
    );
}
