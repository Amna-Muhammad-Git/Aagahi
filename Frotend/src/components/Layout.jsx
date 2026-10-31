import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import ModeBadge from "./ModeBadge"
export default function Layout() {
    const { pathname } = useLocation();
    return (
        <>
            <a className="skip" href="#content">Skip to main content</a>
            {/* <div className="banner">Aagahi teaches you step by step. It never pays, sends or taps anything for you.</div> */}
            <header className="header">
                <div className="container">
                    <Link to="/" className="logo" aria-label="Agahi home">
                        <Link to="/" className="logo" aria-label="Aagahi home">
                            <img src="/images/logo.png" alt="" className="logo-img" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            <span>Aagahi</span>
                        </Link>
                    </Link>
                    <nav className="nav" aria-label="Main">
                        <NavLink to="/">Home</NavLink>
                        <NavLink to="/bills">Bills</NavLink>
                        <NavLink to="/guides">Guides</NavLink>
                        <NavLink to="/screen-helper">Upload Screen</NavLink>
                        <NavLink to="/ask">Ask</NavLink>
                        <NavLink to="/privacy">Privacy</NavLink>
                        <NavLink to="/settings">Settings</NavLink>
                    </nav>
                </div>
            </header>
            <main id="content"><div className="page" key={pathname}><Outlet /></div></main>
            <footer className="footer">
                <div className="container">
                    <p><ModeBadge /></p>
                    <p>Agahi helps you understand everyday bills and learn how to use WhatsApp and Gmail, with clear guidance in English and Urdu. AI explanations may be incorrect, so always check the original bill or app before taking action.</p>
                    <p><Link to="/privacy">Privacy</Link> · <Link to="/settings">Settings</Link></p>
                </div>
            </footer>
        </>
    );
}
