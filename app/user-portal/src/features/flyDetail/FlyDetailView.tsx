import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Fly, FlyCategory, FlyVariant, Material } from "@flytying/shared";
import { FlyIcon } from "../../components/FlyIcon.js";
import { PicturesField } from "../../components/PicturesField.js";
import { useDispatch, useSelector } from "../../store/index.js";
import {
  addVariant,
  deleteFly,
  loadFlyDetail,
  updateFly,
  updateFlyMaterials,
  type EditFlyInput,
  type NewVariantInput,
} from "./state.js";

const field =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

const iconButton = "rounded-md p-1 hover:bg-slate-100";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M10 5a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 10 5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function DeleteFlyDialog({
  flyName,
  deleting,
  deleteError,
  onConfirm,
  onCancel,
}: {
  flyName: string;
  deleting: boolean;
  deleteError?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-fly-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-lg"
      >
        <h3 id="delete-fly-heading" className="font-semibold text-slate-800">
          Delete {flyName}?
        </h3>
        <p className="text-sm text-slate-600">
          This will permanently remove this fly pattern, including its materials and variants. This cannot be undone.
        </p>
        {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditFlyDialog({
  fly,
  categories,
  saving,
  editError,
  onSave,
  onClose,
}: {
  fly: Fly;
  categories: FlyCategory[];
  saving: boolean;
  editError?: string;
  onSave: (input: EditFlyInput) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(fly.name);
  const [categoryId, setCategoryId] = useState<number | "">(fly.categoryId);
  const [hookModel, setHookModel] = useState(fly.hookModel);
  const [hookSize, setHookSize] = useState(fly.hookSize);
  const [existingPictures, setExistingPictures] = useState<string[]>(fly.pictures);
  const [newPictures, setNewPictures] = useState<File[]>([]);

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
    try {
      await onSave({ name, categoryId: Number(categoryId), hookModel, hookSize, existingPictures, newPictures });
      onClose();
    } catch {
      // editError is already surfaced from state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Edit fly pattern</h3>
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
        <div className="flex gap-2">
          <input
            className={field}
            placeholder="Hook model"
            value={hookModel}
            onChange={(e) => setHookModel(e.target.value)}
          />
          <input
            className={field}
            placeholder="Size (e.g. 12-16)"
            value={hookSize}
            onChange={(e) => setHookSize(e.target.value)}
          />
        </div>
        <PicturesField
          existingPictures={existingPictures}
          onRemoveExisting={(i) => setExistingPictures((p) => p.filter((_, idx) => idx !== i))}
          pictures={newPictures}
          onChange={setNewPictures}
        />
        {editError && <p className="text-sm text-red-600">{editError}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onClose} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

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

function MaterialRow({
  fly,
  material,
  materials,
  materialCategoryName,
  canEdit,
  savingMaterials,
  onSave,
}: {
  fly: Fly;
  material: Material;
  materials: Material[];
  materialCategoryName: (id: number) => string;
  canEdit: boolean;
  savingMaterials: boolean;
  onSave: (materialIds: number[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number | "">(material.id);

  const choices = materials.filter((m) => m.id === material.id || !fly.materialIds.includes(m.id));

  const startEdit = () => {
    setValue(material.id);
    setEditing(true);
  };

  const confirm = async () => {
    if (value === "" || value === material.id) {
      setEditing(false);
      return;
    }
    await onSave(fly.materialIds.map((id) => (id === material.id ? Number(value) : id)));
    setEditing(false);
  };

  const remove = () => onSave(fly.materialIds.filter((id) => id !== material.id));

  return (
    <li className="flex items-center justify-between gap-2 rounded-md bg-white px-4 py-2 text-sm shadow-sm">
      {editing ? (
        <>
          <select className={`${field} mr-2`} value={value} onChange={(e) => setValue(Number(e.target.value) || "")}>
            {choices.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={confirm}
              disabled={savingMaterials}
              aria-label="Save material"
              className={`${iconButton} text-emerald-700 disabled:opacity-50`}
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button onClick={() => setEditing(false)} aria-label="Cancel edit" className={`${iconButton} text-slate-400`}>
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <>
          <span>
            <span className="font-medium text-slate-800">{material.name}</span>{" "}
            <span className="text-slate-500">— {materialCategoryName(material.categoryId)}</span>
          </span>
          {canEdit && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={startEdit}
                aria-label={`Edit ${material.name}`}
                className={`${iconButton} text-slate-500 hover:text-slate-700`}
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={remove}
                disabled={savingMaterials}
                aria-label={`Remove ${material.name}`}
                className={`${iconButton} text-slate-500 hover:text-red-600 disabled:opacity-50`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </li>
  );
}

function AddMaterialRow({
  availableMaterials,
  materialCategoryName,
  savingMaterials,
  onAdd,
  onCancel,
}: {
  availableMaterials: Material[];
  materialCategoryName: (id: number) => string;
  savingMaterials: boolean;
  onAdd: (materialId: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<number | "">("");

  const confirm = async () => {
    if (value === "") return;
    await onAdd(Number(value));
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded-md bg-white px-4 py-2 text-sm shadow-sm">
      <select className={`${field} mr-2`} value={value} onChange={(e) => setValue(Number(e.target.value) || "")}>
        <option value="">Select a material…</option>
        {availableMaterials.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} — {materialCategoryName(m.categoryId)}
          </option>
        ))}
      </select>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={confirm}
          disabled={savingMaterials || value === ""}
          aria-label="Save material"
          className={`${iconButton} text-emerald-700 disabled:opacity-50`}
        >
          <CheckIcon className="h-4 w-4" />
        </button>
        <button onClick={onCancel} aria-label="Cancel add" className={`${iconButton} text-slate-400`}>
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function MaterialsSection({
  fly,
  materials,
  materialCategoryName,
  canEdit,
}: {
  fly: Fly;
  materials: Material[];
  materialCategoryName: (id: number) => string;
  canEdit: boolean;
}) {
  const dispatch = useDispatch();
  const savingMaterials = useSelector((s) => s.flyDetail.savingMaterials);
  const materialsError = useSelector((s) => s.flyDetail.materialsError);
  const [adding, setAdding] = useState(false);

  const flyMaterials = materials.filter((m) => fly.materialIds.includes(m.id));
  const availableToAdd = materials.filter((m) => !fly.materialIds.includes(m.id));

  const save = (materialIds: number[]) => dispatch(updateFlyMaterials(materialIds));

  const addMaterial = async (materialId: number) => {
    await save([...fly.materialIds, materialId]);
    setAdding(false);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Materials</h3>
        {canEdit && (
          <button
            onClick={() => setAdding(true)}
            aria-label="Add material"
            className="rounded-full p-1.5 text-emerald-700 hover:bg-emerald-50"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {materialsError && <p className="text-sm text-red-600">{materialsError}</p>}

      {flyMaterials.length === 0 && !adding ? (
        <p className="text-slate-500">No materials recorded for this pattern.</p>
      ) : (
        <ul className="space-y-2">
          {flyMaterials.map((m) => (
            <MaterialRow
              key={m.id}
              fly={fly}
              material={m}
              materials={materials}
              materialCategoryName={materialCategoryName}
              canEdit={canEdit}
              savingMaterials={savingMaterials}
              onSave={save}
            />
          ))}
          {adding && (
            <AddMaterialRow
              availableMaterials={availableToAdd}
              materialCategoryName={materialCategoryName}
              savingMaterials={savingMaterials}
              onAdd={addMaterial}
              onCancel={() => setAdding(false)}
            />
          )}
        </ul>
      )}
    </section>
  );
}

export function FlyDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    fly,
    categories,
    materials,
    materialCategories,
    variants,
    loading,
    error,
    deleting,
    deleteError,
    savingEdit,
    editError,
  } = useSelector((s) => s.flyDetail);
  const user = useSelector((s) => s.auth.user);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingOpen, setEditingOpen] = useState(false);

  const flyId = Number(id);

  useEffect(() => {
    if (Number.isFinite(flyId)) void dispatch(loadFlyDetail(flyId));
  }, [dispatch, flyId]);

  const handleDelete = async () => {
    if (!fly) return;
    try {
      await dispatch(deleteFly(fly.id));
      navigate("/");
    } catch {
      // deleteError is already surfaced from state
    }
  };

  const handleEdit = (input: EditFlyInput) => dispatch(updateFly(input));

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

  const canEdit = !!user && (user.role === "admin" || fly.ownerId === user.id);

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(-1)} className="text-sm font-medium text-emerald-700 hover:text-emerald-600">
        ← Back
      </button>

      <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm sm:flex-row">
        {fly.pictures[0] ? (
          <img src={fly.pictures[0]} alt={fly.name} className="h-48 w-48 rounded-lg object-cover" />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <FlyIcon className="h-24 w-36" />
          </div>
        )}
        <div className="flex flex-1 items-start justify-between gap-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">{fly.name}</h2>
            <p className="text-emerald-700">{categoryName(fly.categoryId)}</p>
            {(fly.hookModel || fly.hookSize) && (
              <p className="text-sm text-slate-500">
                Hook: {fly.hookModel || "—"} {fly.hookSize && `(${fly.hookSize})`}
              </p>
            )}
          </div>
          {canEdit && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setEditingOpen(true)}
                aria-label={`Edit ${fly.name}`}
                className={`${iconButton} text-slate-400 hover:text-slate-600`}
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Delete ${fly.name}`}
                className={`${iconButton} text-slate-400 hover:text-red-600`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {editingOpen && (
        <EditFlyDialog
          fly={fly}
          categories={categories}
          saving={savingEdit}
          editError={editError}
          onSave={handleEdit}
          onClose={() => setEditingOpen(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteFlyDialog
          flyName={fly.name}
          deleting={deleting}
          deleteError={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      <MaterialsSection fly={fly} materials={materials} materialCategoryName={materialCategoryName} canEdit={canEdit} />

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
