import { useSettings } from "../context/SettingsContext";
import { useT } from "../i18n";
import ui from "../data/ui.json";

export default function UiText({ k, english, bilingual = false }) {
    const t = useT();
    const { settings } = useSettings();
    if (settings.lang === "ur" && Object.hasOwn(ui.ur, k) && ui.ur[k]) {
        return <><span className="ui-ur" lang="ur" dir="rtl">{t(k)}</span>{bilingual && <small className="ui-en">{english || t(k)}</small>}</>;
    }
    return english || t(k);
}
