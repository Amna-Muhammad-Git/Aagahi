import { Link, NavLink, Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <>
            <a className="skip" href="#content">Skip to main content</a>
            <div className="banner">Agahi teaches you step by step. It never pays, sends or taps anything for you.</div>
            <header className="header">
                <div className="container">
                    <Link to="/" className="logo">Agahi</Link>
                    <nav className="nav" aria-label="Main">
                        <NavLink to="/bills">Bills</NavLink>
                        <NavLink to="/guides">Guides</NavLink>
                        <NavLink to="/ask">Ask</NavLink>
                        <NavLink to="/privacy">Privacy</NavLink>
                        <NavLink to="/settings">Settings</NavLink>
                    </nav>
                </div>
            </header>
            <main id="content"><Outlet /></main>
            <footer className="footer">
                <div className="container">
                    <p>Agahi is a learning tool. AI explanations can be wrong, so check the original bill. WhatsApp and Gmail screens in guides are recreated mock screens.</p>
                    <p><Link to="/privacy">Privacy</Link> · <Link to="/settings">Settings</Link></p>
                </div>
            </footer>
        </>
    );
}