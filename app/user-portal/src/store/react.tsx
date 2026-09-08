import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { Action, Dispatch, Store } from "./store.js";

// Generic React bindings for the reducer store. Concrete types are supplied
// where the store is created (see ./index.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StoreContext = createContext<Store<any, any> | null>(null);

export function StoreProvider<S, A extends Action>({
  store,
  children,
}: {
  store: Store<S, A>;
  children: ReactNode;
}) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

function useStore<S, A extends Action>(): Store<S, A> {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within a StoreProvider");
  return store as Store<S, A>;
}

/** Subscribe to a slice of state; re-renders only when the selected value changes. */
export function useSelector<S, A extends Action, T>(selector: (state: S) => T): T {
  const store = useStore<S, A>();
  return useSyncExternalStore(
    store.subscribe,
    useCallback(() => selector(store.getState()), [store, selector]),
  );
}

export function useDispatch<S, A extends Action>(): Dispatch<S, A> {
  return useStore<S, A>().dispatch;
}
