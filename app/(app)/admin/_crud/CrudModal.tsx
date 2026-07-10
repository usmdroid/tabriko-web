"use client";

import { X } from "lucide-react";
import { Spinner } from "@/app/components/Spinner";
import { Modal } from "@/app/components/Modal";

export type FieldType = "text" | "url" | "date" | "number" | "checkbox" | "select";

export interface Field<Req> {
  name: keyof Req & string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: number; label: string }[];
  emptyOption?: string;
  helpText?: string;
}

const INPUT =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent";

interface CrudModalProps<Req> {
  titleId: string;
  title: string;
  fields: Field<Req>[];
  form: Req;
  setForm: React.Dispatch<React.SetStateAction<Req>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  saving: boolean;
  error?: string;
  saveLabel: string;
  cancelLabel: string;
  scroll?: boolean;
}

export function CrudModal<Req>({
  titleId,
  title,
  fields,
  form,
  setForm,
  onSubmit,
  onClose,
  saving,
  error,
  saveLabel,
  cancelLabel,
  scroll = false,
}: CrudModalProps<Req>) {
  const set = (name: string, value: unknown) =>
    setForm((f) => ({ ...f, [name]: value }) as Req);

  const panelClass = `surface-card w-full max-w-sm p-6 flex flex-col gap-4${
    scroll ? " max-h-[90vh] overflow-y-auto" : ""
  }`;

  return (
    <Modal as="form" onSubmit={onSubmit} onClose={onClose} labelledBy={titleId} className={panelClass}>
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="text-base font-semibold text-primary">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="text-muted hover:text-primary" aria-label={cancelLabel}>
          <X size={18} />
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {fields.map((field) => {
        const raw = (form as Record<string, unknown>)[field.name];

        if (field.type === "checkbox") {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm text-primary">
              <input
                type="checkbox"
                checked={Boolean(raw)}
                onChange={(e) => set(field.name, e.target.checked)}
                className="rounded border-line"
              />
              {field.label}
            </label>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{field.label}</label>
              <select
                value={(raw as number | undefined) ?? ""}
                onChange={(e) => set(field.name, e.target.value ? Number(e.target.value) : undefined)}
                className={INPUT}
              >
                {field.emptyOption !== undefined && <option value="">{field.emptyOption}</option>}
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {field.helpText && <p className="text-xs text-muted">{field.helpText}</p>}
            </div>
          );
        }

        return (
          <div key={field.name} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{field.label}</label>
            <input
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              value={field.type === "number" ? (raw as number) : ((raw as string | undefined) ?? "")}
              onChange={(e) =>
                set(field.name, field.type === "number" ? Number(e.target.value) : e.target.value)
              }
              className={INPUT}
            />
          </div>
        );
      })}

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
        >
          {saving && <Spinner size={13} />}
          {saveLabel}
        </button>
      </div>
    </Modal>
  );
}
