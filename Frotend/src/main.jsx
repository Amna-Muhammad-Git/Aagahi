import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/fraunces/700-italic.css";
import "./index.css";
import App from "./App";
import { GlossaryProvider } from "./context/GlossaryContext";
import { SettingsProvider } from "./context/SettingsContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <GlossaryProvider>
          <App />
        </GlossaryProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);