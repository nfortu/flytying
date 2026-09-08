import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Fly } from "@flytying/shared";
import { useDispatch, useSelector } from "../../store/index.js";
import { createFly, loadCatalog, setView, type CatalogView as View } from "./state.js";

function FlyCard({ fly, categoryName }: { fly: Fly; categoryName: string }) {
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm">
      {fly.pictures[0] ? (
        <img src={fly.pictures[0]} alt={fly.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-emerald-100 text-emerald-700">
          🪶
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
    </article>
  );
}

function CreateFlyForm() {
  const dispatch = useDispatch();
  const categories = useSelector((s) => s.catalog.categories);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [hookModel, setHookModel] = useState("");
  const [hookSize, setHookSize] = useState("");
  const [picture, setPicture] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

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
          pictures: picture.trim() ? [picture.trim()] : [],
        }),
      );
      setName("");
      setCategoryId("");
      setHookModel("");
      setHookSize("");
      setPicture("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save fly");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
      >
        + New pattern
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-800">New fly pattern</h3>
      <input className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <select className={field} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")}>
        <option value="">Select a category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input className={field} placeholder="Hook model" value={hookModel} onChange={(e) => setHookModel(e.target.value)} />
        <input className={field} placeholder="Size (e.g. 12-16)" value={hookSize} onChange={(e) => setHookSize(e.target.value)} />
      </div>
      <input className={field} placeholder="Picture URL (optional)" value={picture} onChange={(e) => setPicture(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CatalogView() {
  const dispatch = useDispatch();
  const { flies, myFlies, categories, view, loading, error } = useSelector((s) => s.catalog);

  useEffect(() => {
    void dispatch(loadCatalog());
  }, [dispatch]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: number) => map.get(id) ?? "Unknown";
  }, [categories]);

  const shown = view === "all" ? flies : myFlies;

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
        <div className="flex gap-2">
          {tab("all", "All patterns")}
          {tab("mine", "My patterns")}
        </div>
        <CreateFlyForm />
      </div>

      {loading && <p className="text-slate-500">Loading flies…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && shown.length === 0 && (
        <p className="text-slate-500">
          {view === "mine" ? "You haven't added any patterns yet." : "No patterns yet."}
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
