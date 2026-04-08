import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const logoSrc = `${import.meta.env.BASE_URL}icons/favicon-32x32.png`;

export function DawHeader() {
  const { t } = useTranslation();

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 dark:border-gray-800 dark:bg-gray-900">
      <Link to="/" className="flex items-center gap-1.5">
        <img src={logoSrc} alt="RTTTL Hub" className="h-5 w-5" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">RTTTL Hub</span>
      </Link>
      <span className="mx-1 text-gray-300 dark:text-gray-700">|</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{t("create.title")}</span>
      <div className="flex-1" />
      <ThemeToggle />
      <LanguageSwitcher />
    </header>
  );
}
