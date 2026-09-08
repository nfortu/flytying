import { createStore, type Action } from "./store.js";
import { useDispatch as useDispatchGeneric, useSelector as useSelectorGeneric } from "./react.js";
import {
  authReducer,
  initialAuthState,
  type AuthAction,
  type AuthState,
} from "../features/auth/state.js";
import {
  referenceReducer,
  initialReferenceState,
  type ReferenceAction,
  type ReferenceState,
} from "../features/reference/state.js";
import {
  materialsReducer,
  initialMaterialsState,
  type MaterialsAction,
  type MaterialsState,
} from "../features/materials/state.js";

// ---- Root model ------------------------------------------------------------

export interface AppState {
  auth: AuthState;
  reference: ReferenceState;
  materials: MaterialsState;
}

export type AppAction = (AuthAction | ReferenceAction | MaterialsAction) & Action;

const initialState: AppState = {
  auth: initialAuthState,
  reference: initialReferenceState,
  materials: initialMaterialsState,
};

// Combine slice reducers. Each slice ignores actions it doesn't recognise.
function rootReducer(state: AppState, action: AppAction): AppState {
  return {
    auth: authReducer(state.auth, action as AuthAction),
    reference: referenceReducer(state.reference, action as ReferenceAction),
    materials: materialsReducer(state.materials, action as MaterialsAction),
  };
}

export const store = createStore<AppState, AppAction>(rootReducer, initialState);

// ---- Typed hooks -----------------------------------------------------------

export const useSelector = <T>(selector: (state: AppState) => T): T =>
  useSelectorGeneric<AppState, AppAction, T>(selector);

export const useDispatch = () => useDispatchGeneric<AppState, AppAction>();
