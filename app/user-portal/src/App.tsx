import { Link, Routes, Route, useMatch } from "react-router-dom";
import { useSelector, useDispatch } from "./store/index.js";
import { logout } from "./features/auth/state.js";
import { LoginView } from "./features/auth/LoginView.js";
import { CatalogView } from "./features/flies/CatalogView.js";
import { FlyDetailView } from "./features/flyDetail/FlyDetailView.js";

function Breadcrumbs() {
  const flyMatch = useMatch("/flies/:id");
  const fly = useSelector((s) => s.flyDetail.fly);

  const crumbs: { label: string; to?: string }[] = [{ label: "Home", to: "/" }];
  if (flyMatch) {
    crumbs.push({ label: fly?.name ?? "Loading…" });
  }

  return (
    <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5 text-slate-300">/</span>}
          {crumb.to ? (
            <Link to={crumb.to} className="hover:text-emerald-700">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-700">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function App() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900">
      <header className="border-b border-emerald-100 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-emerald-800">FlyTying</h1>
            <p className="text-sm text-slate-500">Browse patterns and keep track of your flies</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">{user.email}</span>
            <button
              onClick={() => dispatch(logout())}
              className="rounded-md bg-emerald-700 px-3 py-1.5 font-medium text-white hover:bg-emerald-600"
            >
              Sign out
            </button>
          </div>
        </div>
        <div className="mt-3">
          <Breadcrumbs />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/" element={<CatalogView />} />
          <Route path="/flies/:id" element={<FlyDetailView />} />
        </Routes>
      </main>
    </div>
  );
}
