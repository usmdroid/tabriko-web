"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getAdminRequisites,
  createRequisite,
  updateRequisite,
  deleteRequisite,
  AdminRequisite,
  AdminRequisiteRequest,
} from "@/lib/admin-api";
import { ResourceTable, Column } from "../_crud/ResourceTable";
import { CrudModal, Field } from "../_crud/CrudModal";
import { ConfirmModal } from "../_crud/ConfirmModal";
import { useCrudResource } from "../_crud/useCrudResource";

const EMPTY_FORM: AdminRequisiteRequest = { name: "", emoji: "" };

export default function AdminRequisitesPage() {
  const t = useTranslations("admin.requisites");
  const tAdmin = useTranslations("admin");

  const crud = useCrudResource<AdminRequisite, AdminRequisiteRequest>({
    fetchList: getAdminRequisites,
    create: createRequisite,
    update: (id, data) => updateRequisite(id, data),
    remove: (item) => deleteRequisite(item.id),
    emptyForm: EMPTY_FORM,
    toForm: (item) => ({ name: item.name, emoji: item.emoji ?? "" }),
    normalize: (f) => ({ ...f, name: f.name.trim(), emoji: f.emoji.trim() }),
    messages: { loadError: tAdmin("loadError"), saveError: tAdmin("saveError") },
  });

  const columns: Column<AdminRequisite>[] = [
    {
      header: t("colEmoji"),
      className: "px-4 py-3 w-16",
      cell: (r) => r.emoji ? <span>{r.emoji}</span> : <span className="text-muted">—</span>,
    },
    {
      header: t("colName"),
      className: "px-4 py-3 font-medium text-primary",
      cell: (r) => r.name,
    },
    {
      header: tAdmin("actionsHeader"),
      className: "px-4 py-3",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => crud.openEdit(r)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Pencil size={11} />
            {tAdmin("edit")}
          </button>
          <button
            onClick={() => crud.setConfirmTarget(r)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-500 hover:text-red-500 transition-colors"
          >
            <Trash2 size={11} />
            {tAdmin("delete")}
          </button>
        </div>
      ),
    },
  ];

  const fields: Field<AdminRequisiteRequest>[] = [
    { name: "name", label: t("fieldName"), type: "text", required: true },
    { name: "emoji", label: t("fieldEmoji"), type: "text" },
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
        emptyText={t("emptyState")}
        rowKey={(r) => r.id}
        skeletonCellClassName="h-4 w-24"
      />

      {crud.showModal && (
        <CrudModal
          titleId="requisite-modal-title"
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
          message={t("deleteConfirm", { name: crud.confirmTarget.name })}
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
