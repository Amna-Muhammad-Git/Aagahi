import { AlertTriangle } from "lucide-react";
import GlossaryText from "./GlossaryText";
import { useSettings } from "../context/SettingsContext";

const FIELDS = [
    ["amount_due", "Amount due"],
    ["due_date", "Due date"],
    ["billing_period", "Billing period"],
    ["account_number", "Account number"],
    ["previous_balance", "Previous balance"],
    ["late_fee", "Late fee"],
];

function format(key, v, lang) {
    if (v === null || v === undefined) return null;
    if (typeof v === "object") {
        return v.value == null ? null : `${v.currency || ""} ${Number(v.value).toLocaleString("en-US")}`.trim();
    }
    if (key === "due_date") {
        const d = new Date(`${v}T00:00:00`);
        if (!isNaN(d)) return d.toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
    }
    return String(v); // account_number is shown exactly as the API returned it
}

export default function BillResult({ bill }) {
    const { settings } = useSettings();
    const live = bill.mode === "live";
    return (
        <section className="result" aria-labelledby="result-title">
            <div className="result-head">
                <h2 id="result-title">{bill.provider || "Provider not found on this bill"}</h2>
                <span className="tag">{live ? "AI estimate from your file" : "Sample bill (demo data)"}</span>
            </div>

            <div className="estimate" role="note">
                <AlertTriangle aria-hidden="true" />
                <p><strong>This is an AI estimate and can be wrong.</strong> Always check the original bill before you pay anything.</p>
            </div>

            <div className="fields">
                {FIELDS.map(([key, label], i) => {
                    const value = format(key, bill[key], settings.lang);
                    return (
                        <article key={key} className="field-card rise" style={{ "--d": `${i * 80}ms` }}>
                            <div className="field-label">{label}</div>
                            <div className={`field-value ${value ? "" : "missing"}`} dir={key === "account_number" ? "ltr" : undefined}>
                                {value || "Not found on this bill"}
                            </div>
                            <p><GlossaryText text={bill.explanations?.[key]} /></p>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}