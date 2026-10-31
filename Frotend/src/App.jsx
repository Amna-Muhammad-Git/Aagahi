import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import GuideLibrary from "./pages/GuideLibrary";
import GuideView from "./pages/GuideView";
import Placeholder from "./pages/Placeholder";
import Bills from "./pages/Bills";
import Privacy from "./pages/Privacy";
import Ask from "./pages/Ask";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="bills" element={<Bills />} />
        <Route path="guides" element={<GuideLibrary />} />
        <Route path="guides/:id" element={<GuideView />} />
        <Route path="screen-helper" element={<Placeholder title="Screen helper" />} />
        <Route path="ask" element={<Ask />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Placeholder title="Page not found" />} />
        <Route path="privacy" element={<Privacy />} />

      </Route>
    </Routes>
  );
}