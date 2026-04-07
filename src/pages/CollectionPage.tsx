import { useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPlus, FaClone } from "react-icons/fa";
import { CreateDialog } from "@/components/CreateDialog";
import { ListPageLayout } from "@/components/ListPageLayout";
import type { BreadcrumbItem } from "@/components/ListPageLayout";
import type { TrackRowAction } from "@/components/TrackRow";
import { useCollectionStore } from "@/stores/collection-store";
import { getCollectionBySlug } from "@/constants/collections";
import type { RtttlEntry, CollectionSlug } from "@/utils/rtttl-parser";

export function CollectionPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState<RtttlEntry | null>(null);

  const collectionDef = slug ? getCollectionBySlug(slug) : undefined;

  const collectionItems = useMemo(() => {
    if (!slug) return [...items, ...userItems];
    if (slug === "picaxe")
      return items.filter((item) => item.collection === (slug as CollectionSlug));
    if (slug === "community") return userItems;
    return [...items, ...userItems].filter((item) => item.collection === (slug as CollectionSlug));
  }, [slug, items, userItems]);

  const handleDuplicate = useCallback((item: RtttlEntry) => {
    setDuplicateFrom(item);
    setCreateDialogOpen(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setDuplicateFrom(null);
    setCreateDialogOpen(true);
  }, []);

  const extraRowActions: TrackRowAction[] = useMemo(
    () => [
      { icon: <FaClone size={18} />, title: t("actions.duplicate"), onClick: handleDuplicate },
    ],
    [t, handleDuplicate],
  );

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t("breadcrumb.home"), to: "/" },
    { label: t("breadcrumb.collections"), to: "/collections" },
    ...(collectionDef ? [{ label: t(collectionDef.nameKey) }] : []),
  ];

  const headerActions = (
    <button
      onClick={handleCreateNew}
      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      <FaPlus size={16} />
      <span className="hidden sm:inline">{t("actions.createNew")}</span>
    </button>
  );

  return (
    <>
      <ListPageLayout
        items={collectionItems}
        breadcrumbs={breadcrumbs}
        title={collectionDef ? t(collectionDef.nameKey) : undefined}
        description={collectionDef ? t(collectionDef.descriptionKey) : undefined}
        headerActions={headerActions}
        extraRowActions={extraRowActions}
      />
      <CreateDialog
        isOpen={createDialogOpen}
        duplicateFrom={duplicateFrom}
        onClose={() => {
          setCreateDialogOpen(false);
          setDuplicateFrom(null);
        }}
      />
    </>
  );
}
