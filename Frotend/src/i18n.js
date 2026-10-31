import { useSettings } from "./context/SettingsContext";
import ui from "./data/ui.json";

export function useT() {
    const { settings } = useSettings();
    return (key) => ui[settings.lang]?.[key] || ui.en[key] || "Text unavailable";
}
