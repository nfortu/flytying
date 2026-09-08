import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "../../store/index.js";
import {
  deleteBrand,
  deleteFlyCategory,
  deleteMaterialCategory,
  loadReference,
  saveBrand,
  saveFlyCategory,
  saveMaterialCategory,
} from "./state.js";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

const btn = "rounded-md px-3 py-1.5 text-sm font-medium";
const input = "rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

/** A row that flips between read mode and an inline edit form. */
function Row({
  label,
  sublabel,
  onSave,
  onDelete,
  fields,
}: {
  label: string;
  sublabel?: string;
  onSave: (values: string[]) => Promise<void>;
  onDelete: () => Promise<void>;
  fields: { placeholder: string; initial: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(fields.map((f) => f.initial));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await onSave(values);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-2">
        {fields.map((f, i) => (
          <input
            key={i}
            className={input + " flex-1"}
            placeholder={f.placeholder}
            value={values[i]}
            onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
          />
        ))}
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
        <span className="font-medium text-slate-800">{label}</span>
        {sublabel && <span className="ml-2 text-sm text-slate-500">{sublabel}</span>}
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

/** Inline "add new" form with N text fields. */
function AddForm({ fields, onAdd }: { fields: string[]; onAdd: (values: string[]) => Promise<void> }) {
  const [values, setValues] = useState(fields.map(() => ""));
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values[0].trim()) return;
    setBusy(true);
    try {
      await onAdd(values);
      setValues(fields.map(() => ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
      {fields.map((placeholder, i) => (
        <input
          key={i}
          className={input + " flex-1"}
          placeholder={placeholder}
          value={values[i]}
          onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
        />
      ))}
      <button className={`${btn} bg-slate-800 text-white`} disabled={busy} type="submit">
        Add
      </button>
    </form>
  );
}

export function ReferenceView() {
  const dispatch = useDispatch();
  const { brands, flyCategories, materialCategories, loading, error } = useSelector((s) => s.reference);

  useEffect(() => {
    void dispatch(loadReference());
  }, [dispatch]);

  if (loading) return <p className="text-slate-500">Loading reference data…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Brands">
        <ul>
          {brands.map((b) => (
            <Row
              key={b.id}
              label={b.name}
              fields={[{ placeholder: "Brand name", initial: b.name }]}
              onSave={([name]) => dispatch(saveBrand(name, b.id))}
              onDelete={() => dispatch(deleteBrand(b.id))}
            />
          ))}
        </ul>
        <AddForm fields={["New brand name"]} onAdd={([name]) => dispatch(saveBrand(name))} />
      </Card>

      <Card title="Material categories">
        <ul>
          {materialCategories.map((c) => (
            <Row
              key={c.id}
              label={c.name}
              fields={[{ placeholder: "Category name", initial: c.name }]}
              onSave={([name]) => dispatch(saveMaterialCategory(name, c.id))}
              onDelete={() => dispatch(deleteMaterialCategory(c.id))}
            />
          ))}
        </ul>
        <AddForm fields={["New category name"]} onAdd={([name]) => dispatch(saveMaterialCategory(name))} />
      </Card>

      <Card title="Fly categories">
        <ul>
          {flyCategories.map((c) => (
            <Row
              key={c.id}
              label={c.name}
              sublabel={c.details}
              fields={[
                { placeholder: "Name", initial: c.name },
                { placeholder: "Details", initial: c.details },
              ]}
              onSave={([name, details]) => dispatch(saveFlyCategory(name, details, c.id))}
              onDelete={() => dispatch(deleteFlyCategory(c.id))}
            />
          ))}
        </ul>
        <AddForm
          fields={["Name", "Details"]}
          onAdd={([name, details]) => dispatch(saveFlyCategory(name, details))}
        />
      </Card>
    </div>
  );
}
