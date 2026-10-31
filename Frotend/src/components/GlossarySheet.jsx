import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function GlossarySheet({ term, onClose }) {
    const closeRef = useRef(null);

    useEffect(() => {
        if (!term) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Tab") { e.preventDefault(); closeRef.current?.focus(); } // the close button is the only control
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [term, onClose]);

    if (!term) return null;
    return (
        <div className="sheet-overlay" onClick={onClose}>
            <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-head">
                    <h2 id="sheet-title">{term.term}</h2>
                    <button ref={closeRef} className="btn btn-secondary" onClick={onClose}><X aria-hidden="true" /> Close</button>
                </div>
                <p>{term.definition}</p>
                {(term.term_ur || term.definition_ur) && (
                    <div className="ur" lang="ur" dir="rtl">
                        {term.term_ur && <strong>{term.term_ur}</strong>}
                        {term.definition_ur && <p>{term.definition_ur}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}