import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppShell } from "@/components/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { CollectionsPage } from "@/pages/CollectionsPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { FavoritesPageRoute } from "@/pages/FavoritesPageRoute";
import { CreatorPage } from "@/pages/CreatorPage";
import { TermsPage } from "@/pages/TermsPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { CookiePolicyPage } from "@/pages/CookiePolicyPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AccountPage } from "@/pages/AccountPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { PasswordPage } from "@/pages/PasswordPage";
import { CreatePage } from "@/pages/CreatePage";

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          {/* DAW editor — standalone fullscreen route (no AppShell) */}
          <Route path="/create" element={<CreatePage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/favorites" element={<FavoritesPageRoute />} />
            <Route path="/creators/:creatorId" element={<CreatorPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/profile" element={<ProfilePage />} />
            <Route path="/account/password" element={<PasswordPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
