import { useEffect, useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { ERROR_COPY, extractBill, friendlyError, getHealth, getSamples } from "../api/client";
import fallbackSamples from "../mocks/samples.json";
import BillResult from "../components/BillResult";
import AskPanel from "../components/AskPanel";
import PageHeader from "../components/PageHeader";
import UiText from "../components/UiText";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ERROR_KEYS = {
    empty: "bills_empty", missing_input: "bills_missing", invalid_file_type: "bills_invalid_type", file_too_large: "bills_too_large",
    network: "bills_error_network", timeout: "bills_error_timeout", server_error: "bills_error_server", mode_unavailable: "bills_error_mode",
    unreadable: "bills_error_unreadable", sample_not_found: "bills_error_sample", provider_unavailable: "bills_error_provider", message_too_long: "bills_error_question",
};

export default function Bills() {
    const [samples, setSamples] = useState([]);
    const [offline, setOffline] = useState(false);
    const [apiMode, setApiMode] = useState("checking");
    const [current, setCurrent] = useState(null); // { bill, sampleId, file }
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const resultRef = useRef(null);

    useEffect(() => {
        let alive = true;
        getSamples()
            .then((d) => alive && setSamples(d))
            .catch(() => { if (alive) { setSamples(fallbackSamples); setOffline(true); } });
        getHealth()
            .then((h) => alive && setApiMode(h.mode))
            .catch(() => alive && setApiMode("offline"));
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (current) resultRef.current?.scrollIntoView({ block: "start" });
    }, [current]);

    function pickSample(bill) {
        setError("");
        setFile(null);
        setCurrent({ bill, sampleId: bill.id, file: null });
    }

    function chooseFile(e) {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        setError("");
        if (f.size === 0) return setError("empty");
        if (!TYPES.includes(f.type)) return setError("invalid_file_type");
        if (f.size > MAX_BYTES) return setError("file_too_large");
        setFile(f);
    }

    async function submitUpload() {
        if (!file) return setError("missing_input");
        setLoading(true);
        setError("");
        try {
            const bill = await extractBill({ file });
            setCurrent({ bill, sampleId: null, file });
        } catch (e) {
            setError(e.code || "server_error");
        } finally {
            setLoading(false);
        }
    }

    const money = (b) => (b.amount_due ? `${b.amount_due.currency} ${Number(b.amount_due.value).toLocaleString("en-US")}` : "");
    const errorText = error === "empty" ? "That file is empty. Please choose another one." : ERROR_COPY[error] || friendlyError({ code: error });

    return (
        <>
            <PageHeader title={<UiText k="bills_page_title" english="Explain a bill" />}>
                <UiText k="bills_intro" english="Choose a sample bill to practise on, or upload your own. Aagahi explains each part in plain words." />
            </PageHeader>


            <div className="container section">


                {offline && <p className="notice"><UiText k="bills_offline" english="Not connected to the Aagahi server. Showing built-in example bills." /></p>}

                <h2><UiText k="bills_samples_title" english="Try a sample bill" /></h2>
                {samples.length === 0 && <p><UiText k="bills_loading" english="Loading sample bills…" /></p>}
                <div className="sample-grid">
                    {samples.map((b) => (
                        <button key={b.id} className="sample" aria-pressed={current?.sampleId === b.id} onClick={() => pickSample(b)}>
                            <strong>{b.provider}</strong>
                            <small><UiText k="bills_sample_label" english="Sample bill" /> · {money(b)}</small>
                        </button>
                    ))}
                </div>

                <h2><UiText k="bills_upload_title" english="Or upload your own" /></h2>
                <div className="upload">
                    <label className="drop">
                        <Upload aria-hidden="true" />
                        <span><strong><UiText k="bills_choose_file" english="Choose a file" /></strong><small><UiText k="bills_file_types" english="PDF, JPG or PNG, up to 5 MB" /></small></span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={chooseFile} />
                    </label>
                    {file && <p className="picked"><FileText aria-hidden="true" /> {file.name}</p>}
                    <button className="btn btn-primary" disabled={!file || loading} onClick={submitUpload}>
                        {loading ? <UiText k="bills_reading" english="Reading your bill…" /> : <UiText k="bills_explain" english="Explain this bill" />}
                    </button>
                </div>
                <p className="muted">
                    <UiText
                        k="bills_privacy"
                        english="In live mode, your file is sent to an AI provider for reading. Aagahi does not save it. Check Privacy before uploading a bill with personal details."
                    />
                </p>

                {error && (
                    <div className="error" role="alert">
                        <span><UiText k={ERROR_KEYS[error] || "bills_error_server"} english={errorText} /></span>
                        {file && !loading && <button className="btn btn-secondary" onClick={submitUpload}><UiText k="bills_try_again" english="Try again" /></button>}
                    </div>
                )}

                {current && (
                    <div ref={resultRef}>
                        <BillResult bill={current.bill} />
                        <AskPanel
                            key={current.sampleId || current.file?.name}
                            bill={current.bill}
                            sampleId={current.sampleId}
                            file={current.file}
                            apiMode={apiMode}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
