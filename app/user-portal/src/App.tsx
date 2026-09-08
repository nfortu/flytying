import { useSelector, useDispatch } from "./store/index.js";
import { logout } from "./features/auth/state.js";
import { LoginView } from "./features/auth/LoginView.js";
import { CatalogView } from "./features/flies/CatalogView.js";

export function App() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-emerald-100 bg-white px-6 py-4 shadow-sm">
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
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <CatalogView />
      </main>
    </div>
  );
}
