import { useState } from "react";
import { useSelector, useDispatch } from "./store/index.js";
import { logout } from "./features/auth/state.js";
import { LoginView } from "./features/auth/LoginView.js";
import { ReferenceView } from "./features/reference/ReferenceView.js";
import { MaterialsEditorView } from "./features/materials/MaterialsEditorView.js";

const TABS = [
  { key: "reference", label: "Reference Data" },
  { key: "materials", label: "Materials Editor" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function App() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [tab, setTab] = useState<TabKey>("reference");

  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">FlyTying Admin</h1>
          <p className="text-sm text-slate-500">Manage reference data used across the platform</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">{user.email}</span>
          <button
            onClick={() => dispatch(logout())}
            className="rounded-md bg-slate-800 px-3 py-1.5 font-medium text-white hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t.key
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "reference" ? <ReferenceView /> : <MaterialsEditorView />}
      </main>
    </div>
  );
}
