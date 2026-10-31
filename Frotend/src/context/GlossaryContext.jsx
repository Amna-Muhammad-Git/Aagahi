import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import fallback from "../data/glossary.json";
import { getGlossary } from "../api/client";
import GlossarySheet from "../components/GlossarySheet";

const Ctx = createContext(null);
const toList = (d) => (Array.isArray(d) ? d : d?.terms || d?.glossary || []);

function buildMatcher(terms) {
    const map = new Map();
    terms.forEach((t) => {
        [t.term, ...(t.search_terms || [])].forEach((s) => {
            // English phrases only, so Urdu search terms never break word matching
            if (typeof s === "string" && s.trim().length >= 3 && /[a-z]/i.test(s)) map.set(s.trim().toLowerCase(), t);
        });
    });
    const keys = [...map.keys()]
        .sort((a, b) => b.length - a.length)
        .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = keys.length ? new RegExp(`(?<![\\w])(${keys.join("|")})(?![\\w])`, "gi") : null;
    return { map, re };
}

export function GlossaryProvider({ children }) {
    const [terms, setTerms] = useState(() => toList(fallback));
    const [active, setActive] = useState(null);
    const trigger = useRef(null);

    useEffect(() => {
        let alive = true;
        getGlossary().then((d) => { if (alive && d.length) setTerms(d); }).catch(() => { });
        return () => { alive = false; };
    }, []);

    const open = useCallback((term, el) => { trigger.current = el || document.activeElement; setActive(term); }, []);
    const close = useCallback(() => { setActive(null); trigger.current?.focus?.(); }, []);
    const matcher = useMemo(() => buildMatcher(terms), [terms]);

    return (
        <Ctx.Provider value={{ terms, open, matcher }}>
            {children}
            <GlossarySheet term={active} onClose={close} />
        </Ctx.Provider>
    );
}

export const useGlossary = () => useContext(Ctx);