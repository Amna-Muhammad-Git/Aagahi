import { createContext, useContext, useEffect, useState } from "react";

const KEY = "agahi-settings";
const defaults = { text: "normal", contrast: "normal", lang: "en" };
const SettingsContext = createContext(null);

function load() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY)) }; }
    catch { return defaults; }
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(load);

    useEffect(() => {
        const root = document.documentElement;
        root.dataset.text = settings.text;
        root.dataset.contrast = settings.contrast;
        root.lang = settings.lang;
        try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ }
    }, [settings]);

    const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
    return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);