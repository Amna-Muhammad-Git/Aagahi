import { useSettings } from "../context/SettingsContext";
import PageHeader from "../components/PageHeader";

function Group({ title, value, options, onPick }) {
    return (
        <div className="group">
            <h2>{title}</h2>
            <div className="options">
                {options.map(([val, label]) => (
                    <button key={val} className="option" aria-pressed={value === val} onClick={() => onPick(val)}>{label}</button>
                ))}
            </div>
        </div>
    );
}

export default function Settings() {
    const { settings, update } = useSettings();
    return (
        <>
            <PageHeader title="Settings">Choose what feels comfortable for your eyes and ears.</PageHeader>
            <div className="container section">

                <Group title="Text size" value={settings.text} onPick={(text) => update({ text })}
                    options={[["normal", "Normal"], ["large", "Large"], ["xlarge", "Extra large"]]} />
                <Group title="Contrast" value={settings.contrast} onPick={(contrast) => update({ contrast })}
                    options={[["normal", "Standard"], ["high", "High contrast"]]} />
                <Group title="Language" value={settings.lang} onPick={(lang) => update({ lang })}
                    options={[["en", "English"], ["ur", "اردو"]]} />
                <Group title="Gentle animations" value={settings.motion} onPick={(motion) => update({ motion })}
                    options={[["on", "On"], ["off", "Off"]]} />
            </div>
        </>
    );
}