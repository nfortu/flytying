import { createStore, type Action } from "./store.js";
import { useDispatch as useDispatchGeneric, useSelector as useSelectorGeneric } from "./react.js";
import {
  authReducer,
  initialAuthState,
  type AuthAction,
  type AuthState,
} from "../features/auth/state.js";
import {
  catalogReducer,
  initialCatalogState,
  type CatalogAction,
  type CatalogState,
} from "../features/flies/state.js";

// ---- Root model ------------------------------------------------------------

export interface AppState {
  auth: AuthState;
  catalog: CatalogState;
}

export type AppAction = (AuthAction | CatalogAction) & Action;

const initialState: AppState = {
  auth: initialAuthState,
  catalog: initialCatalogState,
};

// Combine slice reducers. Each slice ignores actions it doesn't recognise.
function rootReducer(state: AppState, action: AppAction): AppState {
  return {
    auth: authReducer(state.auth, action as AuthAction),
    catalog: catalogReducer(state.catalog, action as CatalogAction),
  };
}

export const store = createStore<AppState, AppAction>(rootReducer, initialState);

// ---- Typed hooks -----------------------------------------------------------

export const useSelector = <T>(selector: (state: AppState) => T): T =>
  useSelectorGeneric<AppState, AppAction, T>(selector);

export const useDispatch = () => useDispatchGeneric<AppState, AppAction>();
