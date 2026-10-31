import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import GuideLibrary from "./pages/GuideLibrary";
import GuideView from "./pages/GuideView";
import Placeholder from "./pages/Placeholder";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="bills" element={<Placeholder title="Explain a bill" />} />
        <Route path="guides" element={<GuideLibrary />} />
        <Route path="guides/:id" element={<GuideView />} />
        <Route path="screen-helper" element={<Placeholder title="Screen helper" />} />
        <Route path="ask" element={<Placeholder title="Ask a question" />} />
        <Route path="privacy" element={<Placeholder title="Privacy" />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Route>
    </Routes>
  );
}