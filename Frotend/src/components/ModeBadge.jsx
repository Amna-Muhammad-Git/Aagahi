import { useEffect, useState } from "react";
import { getHealth } from "../api/client";

const LABEL = {
    checking: "Checking connection…",
    cached: "Prepared guidance",
    live: "Live mode: AI answers",
    offline: "Server not connected: built-in examples",
};

export default function ModeBadge() {
    const [mode, setMode] = useState("checking");
    useEffect(() => {
        let alive = true;
        getHealth().then((h) => alive && setMode(h.mode)).catch(() => alive && setMode("offline"));
        return () => { alive = false; };
    }, []);
    return <span className="mode-badge">{LABEL[mode] || LABEL.offline}</span>;
}
