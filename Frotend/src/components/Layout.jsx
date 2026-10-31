import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ModeBadge from "./ModeBadge";
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
                        <NavLink to="/guides" onClick={() => setOpen(false)}><UiText k="nav_guides" english="Guides" bilingual /></NavLink>
                        <NavLink to="/screen-helper" onClick={() => setOpen(false)}><UiText k="nav_screen" english="Screen help" bilingual /></NavLink>
                        <NavLink to="/ask" onClick={() => setOpen(false)}><UiText k="nav_ask" english="Ask" bilingual /></NavLink>
                        <NavLink to="/privacy" onClick={() => setOpen(false)}><UiText k="nav_privacy" english="Privacy" bilingual /></NavLink>
                        <NavLink to="/settings" onClick={() => setOpen(false)}><UiText k="nav_settings" english="Settings" bilingual /></NavLink>
                    </nav>
                </div>
            </header>

            <main id="content"><div className="page" key={pathname}><Outlet /></div></main>

            <footer className="footer">
                <div className="container">
                    <p><ModeBadge /></p>
<<<<<<< HEAD
                    <p>Agahi helps you understand everyday bills and learn how to use WhatsApp and Gmail, with clear guidance in English and Urdu. AI explanations may be incorrect, so always check the original bill or app before taking action.</p>
=======
                    <p>Aagahi is a learning tool. AI explanations can be wrong, so check the original bill. WhatsApp and Gmail screens in guides are recreated mock screens.</p>
>>>>>>> 2af2900 (Add Urdu Language feature)
                    <p><Link to="/privacy">Privacy</Link> · <Link to="/settings">Settings</Link></p>
                </div>
            </footer>
        </>
    );
}
