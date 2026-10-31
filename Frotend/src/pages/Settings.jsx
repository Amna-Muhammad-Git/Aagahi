import { useSettings } from "../context/SettingsContext";
import PageHeader from "../components/PageHeader";
import UiText from "../components/UiText";

function Group({ title, titleKey, value, options, onPick }) {
    return (
        <div className="group">
            <h2><UiText k={titleKey} english={title} /></h2>
            <div className="options">
                {options.map(([val, label, key]) => (
                    <button key={val} className="option" aria-pressed={value === val} onClick={() => onPick(val)}><UiText k={key} english={label} bilingual /></button>
                ))}
            </div>
        </div>
    );
}

export default function Settings() {
    const { settings, update } = useSettings();
    return (
        <>
            <PageHeader title={<UiText k="settings_title" english="Settings" /> }><UiText k="settings_intro" english="Choose what feels comfortable for your eyes and ears." /></PageHeader>
            <div className="container section">

                <Group title="Text size" titleKey="setting_text" value={settings.text} onPick={(text) => update({ text })}
                    options={[["normal", "Normal", "size_normal"], ["large", "Large", "size_large"], ["xlarge", "Extra large", "size_xlarge"]]} />
                <Group title="Contrast" titleKey="setting_contrast" value={settings.contrast} onPick={(contrast) => update({ contrast })}
                    options={[["normal", "Standard", "contrast_standard"], ["high", "High contrast", "contrast_high"]]} />
                <Group title="Language" titleKey="setting_language" value={settings.lang} onPick={(lang) => update({ lang })}
                    options={[["en", "English", "language_english"], ["ur", "Urdu", "language_urdu"]]} />
                <Group title="Gentle animations" titleKey="setting_motion" value={settings.motion} onPick={(motion) => update({ motion })}
                    options={[["on", "On", "motion_on"], ["off", "Off", "motion_off"]]} />
            </div>
        </>
    );
}
