export default function PageHeader({ title, back, children }) {
    return (
        <header className="page-band">
            <div className="container">
                {back}
                <h1 className="rise" style={{ "--d": "0ms" }}>{title}</h1>
                {children && <p className="lead rise" style={{ "--d": "120ms" }}>{children}</p>}
            </div>
        </header>
    );
}