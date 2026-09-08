import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { FlyVariant } from "@flytying/shared";
import { useDispatch, useSelector } from "../../store/index.js";
import { addVariant, loadFlyDetail, type NewVariantInput } from "./state.js";

const field =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

function AddVariantForm({ flyId, materialIds }: { flyId: number; materialIds: number[] }) {
  const dispatch = useDispatch();
  const materials = useSelector((s) => s.flyDetail.materials);
  const savingVariant = useSelector((s) => s.flyDetail.savingVariant);
  const variantError = useSelector((s) => s.flyDetail.variantError);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subs, setSubs] = useState<{ baseMaterialId: number | ""; replacementMaterialId: number | "" }[]>([]);

  const baseMaterials = materials.filter((m) => materialIds.includes(m.id));

  const addRow = () => setSubs((s) => [...s, { baseMaterialId: "", replacementMaterialId: "" }]);
  const removeRow = (i: number) => setSubs((s) => s.filter((_, idx) => idx !== i));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const substitutions = subs
      .filter((s) => s.baseMaterialId !== "" && s.replacementMaterialId !== "")
      .map((s) => ({
        baseMaterialId: Number(s.baseMaterialId),
        replacementMaterialId: Number(s.replacementMaterialId),
      }));
    const input: NewVariantInput = { name, pictures: [], substitutions };
    try {
      await dispatch(addVariant(flyId, input));
      setName("");
      setSubs([]);
      setOpen(false);
    } catch {
      // variantError is already surfaced from state
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
      >
        + New variant
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-800">New variant</h3>
      <input className={field} placeholder="Name (e.g. Olive)" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Material substitutions (optional)</p>
        {subs.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              className={field}
              value={row.baseMaterialId}
              onChange={(e) =>
                setSubs((s) => s.map((r, idx) => (idx === i ? { ...r, baseMaterialId: Number(e.target.value) || "" } : r)))
              }
            >
              <option value="">Base material…</option>
              {baseMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <span className="text-slate-400">→</span>
            <select
              className={field}
              value={row.replacementMaterialId}
              onChange={(e) =>
                setSubs((s) =>
                  s.map((r, idx) => (idx === i ? { ...r, replacementMaterialId: Number(e.target.value) || "" } : r)),
                )
              }
            >
              <option value="">Replacement…</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => removeRow(i)} className="text-sm text-red-600">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow} className="text-sm font-medium text-emerald-700 hover:text-emerald-600">
          + Add substitution
        </button>
      </div>

      {variantError && <p className="text-sm text-red-600">{variantError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={savingVariant}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {savingVariant ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}

function VariantCard({ variant, materialName }: { variant: FlyVariant; materialName: (id: number) => string }) {
  return (
    <article className="rounded-xl bg-white p-4 shadow-sm">
      <h4 className="font-semibold text-slate-800">{variant.name}</h4>
      {variant.substitutions.length === 0 ? (
        <p className="mt-1 text-sm text-slate-500">Same materials as the base pattern.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {variant.substitutions.map((s, i) => (
            <li key={i}>
              {materialName(s.baseMaterialId)} <span className="text-slate-400">→</span> {materialName(s.replacementMaterialId)}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function FlyDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { fly, categories, materials, materialCategories, variants, loading, error } = useSelector(
    (s) => s.flyDetail,
  );

  const flyId = Number(id);

  useEffect(() => {
    if (Number.isFinite(flyId)) void dispatch(loadFlyDetail(flyId));
  }, [dispatch, flyId]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (catId: number) => map.get(catId) ?? "Unknown";
  }, [categories]);

  const materialCategoryName = useMemo(() => {
    const map = new Map(materialCategories.map((c) => [c.id, c.name]));
    return (catId: number) => map.get(catId) ?? "Unknown";
  }, [materialCategories]);

  const materialName = useMemo(() => {
    const map = new Map(materials.map((m) => [m.id, m.name]));
    return (matId: number) => map.get(matId) ?? "Unknown material";
  }, [materials]);

  if (loading) return <p className="text-slate-500">Loading fly…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!fly) return null;

  const flyMaterials = materials.filter((m) => fly.materialIds.includes(m.id));

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(-1)} className="text-sm font-medium text-emerald-700 hover:text-emerald-600">
        ← Back
      </button>

      <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm sm:flex-row">
        {fly.pictures[0] ? (
          <img src={fly.pictures[0]} alt={fly.name} className="h-48 w-48 rounded-lg object-cover" />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-emerald-100 text-5xl text-emerald-700">
            🪶
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">{fly.name}</h2>
          <p className="text-emerald-700">{categoryName(fly.categoryId)}</p>
          {(fly.hookModel || fly.hookSize) && (
            <p className="text-sm text-slate-500">
              Hook: {fly.hookModel || "—"} {fly.hookSize && `(${fly.hookSize})`}
            </p>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-800">Materials</h3>
        {flyMaterials.length === 0 ? (
          <p className="text-slate-500">No materials recorded for this pattern.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {flyMaterials.map((m) => (
              <li key={m.id} className="rounded-md bg-white px-4 py-2 text-sm shadow-sm">
                <span className="font-medium text-slate-800">{m.name}</span>{" "}
                <span className="text-slate-500">— {materialCategoryName(m.categoryId)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Variants</h3>
          <AddVariantForm flyId={fly.id} materialIds={fly.materialIds} />
        </div>
        {variants.length === 0 ? (
          <p className="text-slate-500">No variants yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {variants.map((v) => (
              <VariantCard key={v.id} variant={v} materialName={materialName} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
