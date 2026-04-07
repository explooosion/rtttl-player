import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/*" element={<Layout />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
