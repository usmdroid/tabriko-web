"use client";

import { useState } from "react";
import { Plus, Pencil, ArchiveX, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  restoreCategory,
  AdminCategory,
  AdminCategoryRequest,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";
import { ResourceTable, Column } from "../_crud/ResourceTable";
import { CrudModal, Field } from "../_crud/CrudModal";
import { ConfirmModal } from "../_crud/ConfirmModal";
import { useCrudResource } from "../_crud/useCrudResource";

const EMPTY_FORM: AdminCategoryRequest = { nameUz: "", nameRu: "", nameEn: "", iconUrl: "" };
const ROW = "border-b border-line last:border-0 hover:bg-card/50 transition-colors";

export default function AdminCategoriesPage() {
  const t = useTranslations("admin.categories");
  const tAdmin = useTranslations("admin");

  const crud = useCrudResource<AdminCategory, AdminCategoryRequest>({
    fetchList: getAdminCategories,
    create: createCategory,
    update: updateCategory,
    remove: (c) => archiveCategory(c.id),
    emptyForm: EMPTY_FORM,
    toForm: (cat) => ({ nameUz: cat.nameUz, nameRu: cat.nameRu, nameEn: cat.nameEn, iconUrl: cat.iconUrl ?? "" }),
    normalize: (f) => ({
      nameUz: f.nameUz.trim(),
      nameRu: f.nameRu.trim(),
      nameEn: f.nameEn.trim(),
      ...(f.iconUrl?.trim() ? { iconUrl: f.iconUrl.trim() } : {}),
    }),
    messages: { loadError: tAdmin("loadError"), saveError: tAdmin("saveError") },
  });

  const [restoring, setRestoring] = useState<Record<number, boolean>>({});

  const active = crud.items.filter((c) => !c.archived);
  const archived = crud.items.filter((c) => c.archived);

  async function handleRestore(cat: AdminCategory) {
    setRestoring((r) => ({ ...r, [cat.id]: true }));
    try {
      await restoreCategory(cat.id);
      await crud.reload();
    } catch (e) {
      if (e instanceof ApiError) crud.setError(e.message);
    } finally {
      setRestoring((r) => ({ ...r, [cat.id]: false }));
    }
  }

  const nameColumns: Column<AdminCategory>[] = [
    { header: t("colUz"), className: "px-4 py-3 font-medium text-primary", cell: (c) => c.nameUz },
    { header: t("colRu"), cell: (c) => c.nameRu },
    { header: t("colEn"), cell: (c) => c.nameEn },
  ];

  const activeColumns: Column<AdminCategory>[] = [
    ...nameColumns,
    {
      header: tAdmin("actionsHeader"),
      className: "px-4 py-3",
      cell: (cat) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => crud.openEdit(cat)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Pencil size={11} />
            {tAdmin("edit")}
          </button>
          <button
            onClick={() => crud.setConfirmTarget(cat)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-500 hover:text-red-500 transition-colors"
          >
            <ArchiveX size={11} />
            {t("archive")}
          </button>
        </div>
      ),
    },
  ];

  const archivedColumns: Column<AdminCategory>[] = [
    ...nameColumns,
    {
      header: tAdmin("actionsHeader"),
      className: "px-4 py-3",
      cell: (cat) => (
        <button
          onClick={() => handleRestore(cat)}
          disabled={restoring[cat.id]}
          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
        >
          {restoring[cat.id] ? <Spinner size={11} /> : <RotateCcw size={11} />}
          {t("restore")}
        </button>
      ),
    },
  ];

  const fields: Field<AdminCategoryRequest>[] = [
    { name: "nameUz", label: t("fieldNameUz"), type: "text", required: true },
    { name: "nameRu", label: t("fieldNameRu"), type: "text", required: true },
    { name: "nameEn", label: t("fieldNameEn"), type: "text", required: true },
    { name: "iconUrl", label: t("fieldIcon"), type: "url", placeholder: "https://..." },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-primary">{t("title")}</h1>
        <button
          onClick={crud.openCreate}
          className="flex items-center gap-1.5 btn-neon rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={15} />
          {tAdmin("add")}
        </button>
      </div>

      {crud.error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {crud.error}
        </p>
      )}

      <ResourceTable
        columns={activeColumns}
        rows={active}
        loading={crud.loading}
        emptyText={t("emptyActive")}
        rowKey={(c) => c.id}
        skeletonCellClassName="h-4 w-24"
        cardClassName="mb-6"
        header={
          <div className="px-4 py-3 border-b border-line">
            <span className="text-sm font-medium text-primary">{t("activeGroup")}</span>
            {!crud.loading && (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                {active.length}
              </span>
            )}
          </div>
        }
      />

      {!crud.loading && archived.length > 0 && (
        <ResourceTable
          columns={archivedColumns}
          rows={archived}
          loading={false}
          emptyText=""
          rowKey={(c) => c.id}
          rowClassName={() => `${ROW} opacity-70`}
          header={
            <div className="px-4 py-3 border-b border-line">
              <span className="text-sm font-medium text-primary">{t("archivedGroup")}</span>
              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 text-xs font-medium">
                {archived.length}
              </span>
            </div>
          }
        />
      )}

      {crud.showModal && (
        <CrudModal
          titleId="category-modal-title"
          title={crud.editTarget ? t("editTitle") : t("createTitle")}
          fields={fields}
          form={crud.form}
          setForm={crud.setForm}
          onSubmit={crud.save}
          onClose={crud.closeModal}
          saving={crud.saving}
          error={crud.modalError}
          saveLabel={tAdmin("save")}
          cancelLabel={tAdmin("cancel")}
        />
      )}

      {crud.confirmTarget && (
        <ConfirmModal
          message={t("archiveConfirm", { name: crud.confirmTarget.nameUz })}
          confirmLabel={t("archive")}
          cancelLabel={tAdmin("cancel")}
          onConfirm={crud.confirmDelete}
          onClose={() => crud.setConfirmTarget(null)}
          busy={crud.deleting}
        />
      )}
    </div>
  );
}
