import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

import { ThemeToggle } from "./theme_toggle";
import { SettingsMenu } from "./settings_menu";
import { LanguageSwitcher } from "./language_switcher";

const preloadCreatePage = () => {
  void import("../pages/create_page");
};

interface AppMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppMobileSidebar({ isOpen, onClose }: AppMobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const isCollectionsActive = location.pathname.startsWith("/collections");
  const isFavoritesActive = location.pathname === "/favorites";
  const isCreateActive = location.pathname === "/create";

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={onClose}>
      <div
        className="absolute left-0 top-16 bottom-0 w-64 overflow-auto bg-white p-4 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <nav className="flex flex-col gap-2">
          <Link
            to="/"
            onClick={onClose}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium",
              !isCollectionsActive && !isFavoritesActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            {t("nav.home")}
          </Link>
          <Link
            to="/collections"
            onClick={onClose}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium",
              isCollectionsActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            {t("nav.collections")}
          </Link>
          <Link
            to="/favorites"
            onClick={onClose}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium",
              isFavoritesActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            {t("nav.favorites")}
          </Link>
          <Link
            to="/create"
            onClick={onClose}
            onMouseEnter={preloadCreatePage}
            onFocus={preloadCreatePage}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium",
              isCreateActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            {t("actions.createNew")}
          </Link>
        </nav>

        {/* Settings — Theme + Config (desktop header items moved here) */}
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t("settings.title", { defaultValue: "Settings" })}
            </span>
          </div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <ThemeToggle />
          </div>
          <div className="mb-3 px-1">
            <LanguageSwitcher />
          </div>
          <div className="px-1">
            <SettingsMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
