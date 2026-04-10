import { useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPlus } from "react-icons/fa";

import { ListPageLayout } from "../layouts/list_page_layout";
import type { BreadcrumbItem } from "../layouts/list_page_layout";
import { useCollectionStore } from "../stores/collection_store";
import { getCollectionBySlug } from "../constants/collections";
import type { CollectionSlug } from "../utils/rtttl_parser";

/** Triggers create-page chunk download on hover/focus, before the user clicks. */
const preloadCreatePage = () => {
  void import("../pages/create_page");
};

export function CollectionPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);

  const collectionDef = slug ? getCollectionBySlug(slug) : undefined;

  const collectionItems = useMemo(() => {
    if (!slug) {
      return [...items, ...userItems];
    }
    if (slug === "picaxe") {
      return items.filter((item) => item.collection === (slug as CollectionSlug));
    }
    if (slug === "community") {
      return [...items.filter((item) => item.collection === "community"), ...userItems];
    }
    return [...items, ...userItems].filter((item) => item.collection === (slug as CollectionSlug));
  }, [slug, items, userItems]);

  const handleCreateNew = useCallback(() => {
    navigate("/create");
  }, [navigate]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t("breadcrumb.home"), to: "/" },
    { label: t("breadcrumb.collections"), to: "/collections" },
    ...(collectionDef ? [{ label: t(collectionDef.nameKey) }] : []),
  ];

  const headerActions =
    slug === "community" ? (
      <button
        onClick={handleCreateNew}
        onMouseEnter={preloadCreatePage}
        onFocus={preloadCreatePage}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <FaPlus size={16} />
        <span className="hidden sm:inline">{t("actions.createNew")}</span>
      </button>
    ) : undefined;

  return (
    <ListPageLayout
      items={collectionItems}
      breadcrumbs={breadcrumbs}
      title={collectionDef ? t(collectionDef.nameKey) : undefined}
      description={collectionDef ? t(collectionDef.descriptionKey) : undefined}
      source={collectionDef?.source}
      headerActions={headerActions}
    />
  );
}
