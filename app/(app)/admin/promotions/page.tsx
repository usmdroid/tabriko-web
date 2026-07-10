"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAdminCategories,
  AdminPromotion,
  AdminPromotionRequest,
  AdminCategory,
} from "@/lib/admin-api";
import { ResourceTable, Column } from "../_crud/ResourceTable";
import { CrudModal, Field } from "../_crud/CrudModal";
import { ConfirmModal } from "../_crud/ConfirmModal";
import { useCrudResource } from "../_crud/useCrudResource";

const EMPTY_FORM: AdminPromotionRequest = {
  title: "",
  subtitle: "",
  imageUrl: "",
  color: "",
  categoryId: undefined,
  externalUrl: "",
  active: true,
  sortOrder: 0,
};

export default function AdminPromotionsPage() {
  const t = useTranslations("admin.promotions");
  const tAdmin = useTranslations("admin");

  const crud = useCrudResource<AdminPromotion, AdminPromotionRequest, AdminCategory[]>({
    fetchList: fetchPromotions,
    fetchExtra: getAdminCategories,
    create: createPromotion,
    update: updatePromotion,
    remove: (p) => deletePromotion(p.id),
    emptyForm: EMPTY_FORM,
    toForm: (promo) => ({
      title: promo.title,
      subtitle: promo.subtitle ?? "",
      imageUrl: promo.imageUrl ?? "",
      color: promo.color ?? "",
      categoryId: promo.categoryId,
      externalUrl: promo.externalUrl ?? "",
      active: promo.active,
      sortOrder: promo.sortOrder,
    }),
    normalize: (f) => ({
      title: f.title.trim(),
      subtitle: f.subtitle?.trim() || undefined,
      imageUrl: f.imageUrl?.trim() || undefined,
      color: f.color?.trim() || undefined,
      categoryId: f.categoryId,
      externalUrl: f.externalUrl?.trim() || undefined,
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

  const columns: Column<AdminPromotion>[] = [
    { header: t("colTitle"), className: "px-4 py-3 font-medium text-primary", cell: (promo) => promo.title },
    { header: t("colSubtitle"), cell: (promo) => promo.subtitle || "—" },
    {
      header: t("colStatus"),
      className: "px-4 py-3",
      cell: (promo) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            promo.active
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {promo.active ? tAdmin("active") : tAdmin("inactive")}
        </span>
      ),
    },
    { header: t("colSort"), cell: (promo) => promo.sortOrder },
    { header: t("colCategory"), cell: (promo) => categoryName(promo.categoryId) },
    {
      header: tAdmin("actionsHeader"),
      className: "px-4 py-3",
      cell: (promo) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => crud.openEdit(promo)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Pencil size={11} />
            {tAdmin("edit")}
          </button>
          <button
            onClick={() => crud.setConfirmTarget(promo)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-500 hover:text-red-500 transition-colors"
          >
            <Trash2 size={11} />
            {tAdmin("delete")}
          </button>
        </div>
      ),
    },
  ];

  const fields: Field<AdminPromotionRequest>[] = [
    { name: "title", label: t("fieldTitle"), type: "text", required: true },
    { name: "subtitle", label: t("fieldSubtitle"), type: "text", placeholder: t("fieldSubtitlePlaceholder") },
    { name: "color", label: t("fieldColor"), type: "text", placeholder: "#667EEA" },
    { name: "imageUrl", label: t("fieldImage"), type: "url", placeholder: "https://..." },
    { name: "externalUrl", label: t("fieldExternalUrl"), type: "url", placeholder: "https://..." },
    {
      name: "categoryId",
      label: t("fieldCategory"),
      type: "select",
      emptyOption: tAdmin("categoryless"),
      options: activeCategories.map((c) => ({ value: c.id, label: c.nameUz })),
      helpText: t("fieldCategoryHint"),
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
        rowKey={(promo) => promo.id}
      />

      {crud.showModal && (
        <CrudModal
          titleId="promotion-modal-title"
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
