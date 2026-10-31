import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import UiText from "./UiText";
import { useT } from "../i18n";

export default function Layout() {
    const pathname = useLocation().pathname;
    const [open, setOpen] = useState(false);
    const t = useT();

    return (
        <>
            <a className="skip" href="#content"><UiText k="skip" english="Skip to main content" /></a>
            <header className="header">
                <div className="container">
                    <Link to="/" className="logo" aria-label="Aagahi home">
                        <img src="/images/logo.png" alt="" className="logo-img" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        <span>Aagahi</span>
                    </Link>

                    <button className="menu-btn" aria-expanded={open} aria-controls="main-nav" aria-label={t("menu")} onClick={() => setOpen((o) => !o)}>
                        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />} <UiText k="menu" english="Menu" />
                    </button>

                    <nav id="main-nav" className={`nav ${open ? "open" : ""}`} aria-label={t("nav_label")}>
                        <NavLink to="/" onClick={() => setOpen(false)}><UiText k="nav_home" english="Home" bilingual /></NavLink>
                        <NavLink to="/bills" onClick={() => setOpen(false)}><UiText k="nav_bills" english="Bills" bilingual /></NavLink>
                        <NavLink to="/screen-helper" onClick={() => setOpen(false)}><UiText k="nav_screen" english="Apps" bilingual /></NavLink>
                        <NavLink to="/ask" onClick={() => setOpen(false)}><UiText k="nav_ask" english="Voice" bilingual /></NavLink>
                        <NavLink to="/guides" onClick={() => setOpen(false)}><UiText k="nav_guides" english="Guides" bilingual /></NavLink>
                        <NavLink to="/privacy" onClick={() => setOpen(false)}><UiText k="nav_privacy" english="Privacy" bilingual /></NavLink>
                        <NavLink to="/settings" onClick={() => setOpen(false)}><UiText k="nav_settings" english="Settings" bilingual /></NavLink>
                    </nav>
                </div>
            </header>

            <main id="content"><div className="page" key={pathname}><Outlet /></div></main>

            <footer className="footer">
                <div className="container footer-grid">
                    <section className="footer-brand">
                        <Link to="/" className="footer-logo" aria-label="Aagahi home">
                            <img src="/images/logo.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            <span>Aagahi</span>
                        </Link>
                        <p>Clear, practical help for understanding bills and using everyday apps.</p>
                        <p className="footer-language">Guidance in English and Urdu.</p>
                    </section>
                    <nav className="footer-nav" aria-label="Footer navigation">
                        <h2>Explore</h2>
                        <Link to="/bills">Understand a bill</Link>
                        <Link to="/guides">App guides</Link>
                        <Link to="/screen-helper">Screen help</Link>
                        <Link to="/ask">Ask a question</Link>
                    </nav>
                    <nav className="footer-nav" aria-label="Information">
                        <h2>Information</h2>
                        <Link to="/privacy">Privacy</Link>
                        <Link to="/settings">Accessibility settings</Link>
                    </nav>
                    <div className="footer-bottom"><span>© {new Date().getFullYear()} Aagahi</span><span>Learn at your own pace.</span></div>
                </div>
            </footer>
        </>
    );
}
