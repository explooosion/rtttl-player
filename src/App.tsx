import { lazy, Suspense, useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import { ThemeProvider } from "./components/theme_provider";
import { ScrollToTop } from "./components/scroll_to_top";
import { AppShell } from "./components/app_shell";
import { PageLoader } from "./components/page_loader";

const LandingPage = lazy(() =>
  import("./pages/landing_page").then((m) => ({ default: m.LandingPage })),
);
const CollectionsPage = lazy(() =>
  import("./pages/collections_page").then((m) => ({ default: m.CollectionsPage })),
);
const CollectionPage = lazy(() =>
  import("./pages/collection_page").then((m) => ({ default: m.CollectionPage })),
);
const FavoritesPageRoute = lazy(() =>
  import("./pages/favorites_page_route").then((m) => ({ default: m.FavoritesPageRoute })),
);
const CreatorPage = lazy(() =>
  import("./pages/creator_page").then((m) => ({ default: m.CreatorPage })),
);
const TermsPage = lazy(() => import("./pages/terms_page").then((m) => ({ default: m.TermsPage })));
const PrivacyPolicyPage = lazy(() =>
  import("./pages/privacy_policy_page").then((m) => ({ default: m.PrivacyPolicyPage })),
);
const CookiePolicyPage = lazy(() =>
  import("./pages/cookie_policy_page").then((m) => ({ default: m.CookiePolicyPage })),
);
const LoginPage = lazy(() => import("./pages/login_page").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import("./pages/register_page").then((m) => ({ default: m.RegisterPage })),
);
const AccountPage = lazy(() =>
  import("./pages/account_page").then((m) => ({ default: m.AccountPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/profile_page").then((m) => ({ default: m.ProfilePage })),
);
const PasswordPage = lazy(() =>
  import("./pages/password_page").then((m) => ({ default: m.PasswordPage })),
);

/**
 * Module-level cache for the create-page chunk.
 * Shared between the preload function in app_shell and CreatePageRoute here.
 * All dynamic imports for the same specifier share the browser's module cache,
 * so calling import("./pages/create_page") multiple times is safe and free.
 */
let _createPageCache: { CreatePage: React.ComponentType } | null = null;

/**
 * Creates the create page without React.lazy + Suspense.
 * Reason: HashRouter wraps navigation in startTransition, which suppresses
 * Suspense fallbacks — the old page stays frozen instead of showing the loader.
 * Using useState lets React commit the PageLoader immediately on navigation.
 */
function CreatePageRoute() {
  const [Mod, setMod] = useState<{ CreatePage: React.ComponentType } | null>(_createPageCache);

  useEffect(() => {
    if (Mod) {
      return;
    }
    void import("./pages/create_page").then((m) => {
      _createPageCache = m;
      setMod(m);
    });
  }, [Mod]);

  if (!Mod) {
    return <PageLoader />;
  }

  return <Mod.CreatePage />;
}

function App() {
  useEffect(() => {
    // Preload the create-page chunk in the background after initial render
    // so navigation is instant for most users.
    void import("./pages/create_page").then((m) => {
      _createPageCache = m;
    });
  }, []);

  return (
    <ThemeProvider>
      <HashRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* DAW editor — standalone fullscreen route (no AppShell) */}
            <Route path="/create" element={<CreatePageRoute />} />
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
        </Suspense>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
