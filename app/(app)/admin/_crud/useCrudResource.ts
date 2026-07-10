"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { isAbortError } from "@/lib/hooks";

export interface CrudOptions<T extends { id: number }, Req, Extra = undefined> {
  fetchList: (signal?: AbortSignal) => Promise<T[]>;
  fetchExtra?: (signal?: AbortSignal) => Promise<Extra>;
  create: (data: Req) => Promise<unknown>;
  update: (id: number, data: Req) => Promise<unknown>;
  remove: (item: T) => Promise<unknown>;
  emptyForm: Req;
  toForm: (item: T) => Req;
  normalize?: (form: Req) => Req;
  messages: { loadError: string; saveError: string };
}

export function useCrudResource<T extends { id: number }, Req, Extra = undefined>(
  options: CrudOptions<T, Req, Extra>,
) {
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });

  const [items, setItems] = useState<T[]>([]);
  const [extra, setExtra] = useState<Extra | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<T | null>(null);
  const [form, setForm] = useState<Req>(options.emptyForm);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const [confirmTarget, setConfirmTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    const o = optsRef.current;
    setLoading(true);
    setError("");
    try {
      const [list, ex] = await Promise.all([
        o.fetchList(signal),
        o.fetchExtra ? o.fetchExtra(signal) : Promise.resolve(undefined),
      ]);
      if (signal?.aborted) return;
      setItems(list);
      setExtra(ex as Extra);
    } catch (e) {
      if (isAbortError(e)) return;
      if (e instanceof ApiError) setError(e.message);
      else setError(o.messages.loadError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setForm(optsRef.current.emptyForm);
    setModalError("");
    setShowModal(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditTarget(item);
    setForm(optsRef.current.toForm(item));
    setModalError("");
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => setShowModal(false), []);

  const save = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const o = optsRef.current;
    setSaving(true);
    setModalError("");
    try {
      const payload = o.normalize ? o.normalize(form) : form;
      if (editTarget) await o.update(editTarget.id, payload);
      else await o.create(payload);
      setShowModal(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setModalError(err.message);
      else setModalError(o.messages.saveError);
    } finally {
      setSaving(false);
    }
  }, [form, editTarget, load]);

  const confirmDelete = useCallback(async () => {
    const o = optsRef.current;
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await o.remove(confirmTarget);
      setConfirmTarget(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setDeleting(false);
    }
  }, [confirmTarget, load]);

  return {
    items,
    extra,
    loading,
    error,
    setError,
    reload: load,
    showModal,
    editTarget,
    form,
    setForm,
    saving,
    modalError,
    openCreate,
    openEdit,
    closeModal,
    save,
    confirmTarget,
    setConfirmTarget,
    deleting,
    confirmDelete,
  };
}
