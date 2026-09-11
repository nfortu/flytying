import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Fly } from "@flytying/shared";
import { FlyIcon } from "../../components/FlyIcon.js";
import { PicturesField } from "../../components/PicturesField.js";
import { useDispatch, useSelector } from "../../store/index.js";
import { createFly, loadCatalog, setCategoryFilter, setView, type CatalogView as View } from "./state.js";

function FlyCard({ fly, categoryName }: { fly: Fly; categoryName: string }) {
  return (
    <Link
      to={`/flies/${fly.id}`}
      className="block overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      {fly.pictures[0] ? (
        <img src={fly.pictures[0]} alt={fly.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-emerald-100 text-emerald-700">
          <FlyIcon className="h-16 w-24" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800">{fly.name}</h3>
        <p className="text-sm text-emerald-700">{categoryName}</p>
        {(fly.hookModel || fly.hookSize) && (
          <p className="mt-1 text-sm text-slate-500">
            Hook: {fly.hookModel || "—"} {fly.hookSize && `(${fly.hookSize})`}
          </p>
        )}
      </div>
    </Link>
  );
}

function CreateFlyForm({ onClose }: { onClose: () => void }) {
  const dispatch = useDispatch();
  const categories = useSelector((s) => s.catalog.categories);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [hookModel, setHookModel] = useState("");
  const [hookSize, setHookSize] = useState("");
  const [pictures, setPictures] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || categoryId === "") return;
    setBusy(true);
    setError(undefined);
    try {
      await dispatch(
        createFly({
          name,
          categoryId: Number(categoryId),
          hookModel,
          hookSize,
          pictures,
        }),
      );
      setName("");
      setCategoryId("");
      setHookModel("");
      setHookSize("");
      setPictures([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save fly");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl space-y-4 rounded-xl bg-white p-8 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">New fly pattern</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <input className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className={field} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")}>
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <input className={field} placeholder="Hook model" value={hookModel} onChange={(e) => setHookModel(e.target.value)} />
          <input className={field} placeholder="Size (e.g. 12-16)" value={hookSize} onChange={(e) => setHookSize(e.target.value)} />
        </div>
        <PicturesField pictures={pictures} onChange={setPictures} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onClose} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export function CatalogView() {
  const dispatch = useDispatch();
  const { flies, myFlies, categories, view, categoryFilter, loading, error } = useSelector((s) => s.catalog);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void dispatch(loadCatalog());
  }, [dispatch]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: number) => map.get(id) ?? "Unknown";
  }, [categories]);

  const base = view === "all" ? flies : myFlies;
  const shown = useMemo(
    () => (categoryFilter === "all" ? base : base.filter((f) => f.categoryId === categoryFilter)),
    [base, categoryFilter],
  );

  const tab = (v: View, label: string) => (
    <button
      onClick={() => dispatch(setView(v))}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        view === v ? "bg-emerald-700 text-white" : "bg-white text-slate-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {tab("all", "All patterns")}
            {tab("mine", "My patterns")}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) =>
              dispatch(setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value)))
            }
            aria-label="Filter by category"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          + New pattern
        </button>
      </div>

      {createOpen && <CreateFlyForm onClose={() => setCreateOpen(false)} />}

      {loading && <p className="text-slate-500">Loading flies…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && shown.length === 0 && (
        <p className="text-slate-500">
          {categoryFilter !== "all"
            ? "No patterns in this category yet."
            : view === "mine"
              ? "You haven't added any patterns yet."
              : "No patterns yet."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((fly) => (
          <FlyCard key={fly.id} fly={fly} categoryName={categoryName(fly.categoryId)} />
        ))}
      </div>
    </div>
  );
}
