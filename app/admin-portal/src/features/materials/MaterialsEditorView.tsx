import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Material, MaterialCategory } from "@flytying/shared";
import { useDispatch, useSelector } from "../../store/index.js";
import { deleteMaterial, loadMaterials, saveMaterial } from "./state.js";

const btn = "rounded-md px-3 py-1.5 text-sm font-medium";
const input = "rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

function MaterialRow({
  material,
  categories,
  onSave,
  onDelete,
}: {
  material: Material;
  categories: MaterialCategory[];
  onSave: (categoryId: number, name: string, details: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [categoryId, setCategoryId] = useState(material.categoryId);
  const [name, setName] = useState(material.name);
  const [details, setDetails] = useState(material.details);
  const [busy, setBusy] = useState(false);

  const categoryName = categories.find((c) => c.id === material.categoryId)?.name ?? "Unknown";

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave(categoryId, name, details);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-2">
        <select
          className={input}
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className={`${input} flex-1`}
          placeholder="Material name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={`${input} flex-1`}
          placeholder="Details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <button className={`${btn} bg-emerald-600 text-white`} disabled={busy} onClick={save}>
          Save
        </button>
        <button className={`${btn} bg-slate-200`} onClick={() => setEditing(false)}>
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between border-b border-slate-100 py-2">
      <div>
        <span className="font-medium text-slate-800">{material.name}</span>
        <span className="ml-2 text-sm text-slate-500">{categoryName}</span>
        {material.details && <span className="ml-2 text-sm text-slate-400">— {material.details}</span>}
      </div>
      <div className="flex gap-2">
        <button className={`${btn} bg-slate-100`} onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className={`${btn} bg-red-50 text-red-700`} onClick={() => void onDelete()}>
          Delete
        </button>
      </div>
    </li>
  );
}

function AddMaterialForm({
  categories,
  onAdd,
}: {
  categories: MaterialCategory[];
  onAdd: (categoryId: number, name: string, details: string) => Promise<void>;
}) {
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || categoryId === "") return;
    setBusy(true);
    try {
      await onAdd(Number(categoryId), name, details);
      setName("");
      setDetails("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
      <select className={input} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")}>
        <option value="">Category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        className={`${input} flex-1`}
        placeholder="New material name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={`${input} flex-1`}
        placeholder="Details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <button className={`${btn} bg-slate-800 text-white`} disabled={busy || categories.length === 0} type="submit">
        Add
      </button>
    </form>
  );
}

export function MaterialsEditorView() {
  const dispatch = useDispatch();
  const { materials, categories, loading, error } = useSelector((s) => s.materials);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");

  useEffect(() => {
    void dispatch(loadMaterials());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return materials.filter((m) => {
      if (categoryFilter !== "" && m.categoryId !== categoryFilter) return false;
      if (term && !m.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [materials, search, categoryFilter]);

  if (loading) return <p className="text-slate-500">Loading materials…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Materials</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className={`${input} flex-1`}
          placeholder="Search materials…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={input}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(Number(e.target.value) || "")}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {categories.length === 0 && (
        <p className="mb-3 text-sm text-amber-600">
          No material categories exist yet — add one in the Reference Data tab before creating materials.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-slate-500">No materials found.</p>
      ) : (
        <ul>
          {filtered.map((m) => (
            <MaterialRow
              key={m.id}
              material={m}
              categories={categories}
              onSave={(categoryId, name, details) => dispatch(saveMaterial(categoryId, name, details, m.id))}
              onDelete={() => dispatch(deleteMaterial(m.id))}
            />
          ))}
        </ul>
      )}

      <AddMaterialForm
        categories={categories}
        onAdd={(categoryId, name, details) => dispatch(saveMaterial(categoryId, name, details))}
      />
    </section>
  );
}
