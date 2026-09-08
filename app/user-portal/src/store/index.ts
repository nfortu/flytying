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
import {
  flyDetailReducer,
  initialFlyDetailState,
  type FlyDetailAction,
  type FlyDetailState,
} from "../features/flyDetail/state.js";

// ---- Root model ------------------------------------------------------------

export interface AppState {
  auth: AuthState;
  catalog: CatalogState;
  flyDetail: FlyDetailState;
}

export type AppAction = (AuthAction | CatalogAction | FlyDetailAction) & Action;

const initialState: AppState = {
  auth: initialAuthState,
  catalog: initialCatalogState,
  flyDetail: initialFlyDetailState,
};

// Combine slice reducers. Each slice ignores actions it doesn't recognise.
function rootReducer(state: AppState, action: AppAction): AppState {
  return {
    auth: authReducer(state.auth, action as AuthAction),
    catalog: catalogReducer(state.catalog, action as CatalogAction),
    flyDetail: flyDetailReducer(state.flyDetail, action as FlyDetailAction),
  };
}

export const store = createStore<AppState, AppAction>(rootReducer, initialState);

// ---- Typed hooks -----------------------------------------------------------

export const useSelector = <T>(selector: (state: AppState) => T): T =>
  useSelectorGeneric<AppState, AppAction, T>(selector);

export const useDispatch = () => useDispatchGeneric<AppState, AppAction>();
