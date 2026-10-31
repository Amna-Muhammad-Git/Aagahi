import { useGlossary } from "../context/GlossaryContext";

export default function GlossaryText({ text }) {
    const { matcher, open } = useGlossary();
    if (!text) return null;
    const { map, re } = matcher;
    if (!re) return <>{text}</>;

    const r = new RegExp(re.source, re.flags);
    const parts = [];
    let last = 0;
    let m;
    while ((m = r.exec(text))) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        const term = map.get(m[0].toLowerCase());
        parts.push(
            <button key={m.index} type="button" className="term" onClick={(e) => open(term, e.currentTarget)}>
                {m[0]}
            </button>
        );
        last = m.index + m[0].length;
    }
    parts.push(text.slice(last));
    return <>{parts}</>;
}