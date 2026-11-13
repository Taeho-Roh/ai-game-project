import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import PackStartPage from "@/pages/PackStartPage";
import PlayPage from "@/pages/PlayPage";
import CueHomePage from "@/pages/CueHomePage";
import CueSheetPage from "@/pages/CueSheetPage";
import CueLivePage from "@/pages/CueLivePage";
import NotFoundPage from "@/pages/NotFoundPage";
import { ScrollToTop } from "@/components/ScrollToTop";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pack/:packId" element={<PackStartPage />} />
        <Route path="/play/:packId" element={<PlayPage />} />
        <Route path="/pd" element={<CueHomePage />} />
        <Route path="/pd/:sheetId" element={<CueSheetPage />} />
        <Route path="/pd/:sheetId/live" element={<CueLivePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
