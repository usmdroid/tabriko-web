"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  fetchOccasions,
  createOccasion,
  updateOccasion,
  deleteOccasion,
  getAdminCategories,
  AdminOccasion,
  AdminOccasionRequest,
  AdminCategory,
} from "@/lib/admin-api";
import { ResourceTable, Column } from "../_crud/ResourceTable";
import { CrudModal, Field } from "../_crud/CrudModal";
import { ConfirmModal } from "../_crud/ConfirmModal";
import { useCrudResource } from "../_crud/useCrudResource";

const EMPTY_FORM: AdminOccasionRequest = {
  title: "",
  eventDate: "",
  recurringYearly: false,
  emoji: "",
  color: "",
  imageUrl: "",
  categoryId: undefined,
  active: true,
  sortOrder: 0,
};

export default function AdminOccasionsPage() {
  const t = useTranslations("admin.occasions");
  const tAdmin = useTranslations("admin");

  const crud = useCrudResource<AdminOccasion, AdminOccasionRequest, AdminCategory[]>({
    fetchList: fetchOccasions,
    fetchExtra: getAdminCategories,
    create: createOccasion,
    update: updateOccasion,
    remove: (o) => deleteOccasion(o.id),
    emptyForm: EMPTY_FORM,
    toForm: (occ) => ({
      title: occ.title,
      eventDate: occ.eventDate,
      recurringYearly: occ.recurringYearly,
      emoji: occ.emoji ?? "",
      color: occ.color ?? "",
      imageUrl: occ.imageUrl ?? "",
      categoryId: occ.categoryId,
      active: occ.active,
      sortOrder: occ.sortOrder,
    }),
    normalize: (f) => ({
      title: f.title.trim(),
      eventDate: f.eventDate,
      recurringYearly: f.recurringYearly,
      emoji: f.emoji?.trim() || undefined,
      color: f.color?.trim() || undefined,
      imageUrl: f.imageUrl?.trim() || undefined,
      categoryId: f.categoryId,
      active: f.active,
      sortOrder: f.sortOrder,
    }),
    messages: { loadError: tAdmin("loadError"), saveError: tAdmin("saveError") },
  });

  const categories = crud.extra ?? [];
  const activeCategories = categories.filter((c) => !c.archived);
  const categoryName = (categoryId?: number) => {
    if (!categoryId) return "—";
    return categories.find((c) => c.id === categoryId)?.nameUz ?? "—";
  };

  const columns: Column<AdminOccasion>[] = [
    {
      header: t("colTitle"),
      className: "px-4 py-3 font-medium text-primary",
      cell: (occ) => `${occ.emoji ? `${occ.emoji} ` : ""}${occ.title}`,
    },
    { header: t("colDate"), cell: (occ) => occ.eventDate },
    { header: t("colRecurring"), cell: (occ) => (occ.recurringYearly ? t("recurringYearly") : t("recurringOnce")) },
    {
      header: t("colStatus"),
      className: "px-4 py-3",
      cell: (occ) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            occ.active
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {occ.active ? tAdmin("active") : tAdmin("inactive")}
        </span>
      ),
    },
    { header: t("colSort"), cell: (occ) => occ.sortOrder },
    { header: t("colCategory"), cell: (occ) => categoryName(occ.categoryId) },
    {
      header: tAdmin("actionsHeader"),
      className: "px-4 py-3",
      cell: (occ) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => crud.openEdit(occ)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Pencil size={11} />
            {tAdmin("edit")}
          </button>
          <button
            onClick={() => crud.setConfirmTarget(occ)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-500 hover:text-red-500 transition-colors"
          >
            <Trash2 size={11} />
            {tAdmin("delete")}
          </button>
        </div>
      ),
    },
  ];

  const fields: Field<AdminOccasionRequest>[] = [
    { name: "title", label: t("fieldTitle"), type: "text", required: true },
    { name: "eventDate", label: t("fieldDate"), type: "date", required: true },
    { name: "recurringYearly", label: t("fieldRecurring"), type: "checkbox" },
    { name: "emoji", label: t("fieldEmoji"), type: "text", placeholder: "🎉" },
    { name: "color", label: t("fieldColor"), type: "text", placeholder: "#EC407A" },
    { name: "imageUrl", label: t("fieldImage"), type: "url", placeholder: "https://..." },
    {
      name: "categoryId",
      label: t("fieldCategory"),
      type: "select",
      emptyOption: tAdmin("categoryless"),
      options: activeCategories.map((c) => ({ value: c.id, label: c.nameUz })),
    },
    { name: "sortOrder", label: t("fieldSort"), type: "number" },
    { name: "active", label: t("fieldActive"), type: "checkbox" },
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
        columns={columns}
        rows={crud.items}
        loading={crud.loading}
        emptyText={t("empty")}
        rowKey={(occ) => occ.id}
      />

      {crud.showModal && (
        <CrudModal
          titleId="occasion-modal-title"
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
          scroll
        />
      )}

      {crud.confirmTarget && (
        <ConfirmModal
          message={t("deleteConfirm", { title: crud.confirmTarget.title })}
          confirmLabel={tAdmin("delete")}
          cancelLabel={tAdmin("cancel")}
          onConfirm={crud.confirmDelete}
          onClose={() => crud.setConfirmTarget(null)}
          busy={crud.deleting}
        />
      )}
    </div>
  );
}
