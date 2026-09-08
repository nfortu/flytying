import type { Fly, FlyCategory } from "@flytying/shared";
import type { Thunk } from "../../store/store.js";
import { api } from "../../api/client.js";
import type { AppAction, AppState } from "../../store/index.js";

// ---- Model -----------------------------------------------------------------

export type CatalogView = "all" | "mine";

export interface CatalogState {
  flies: Fly[];
  myFlies: Fly[];
  categories: FlyCategory[];
  view: CatalogView;
  loading: boolean;
  error?: string;
}

export const initialCatalogState: CatalogState = {
  flies: [],
  myFlies: [],
  categories: [],
  view: "all",
  loading: false,
};

// ---- Actions ---------------------------------------------------------------

export type CatalogAction =
  | { type: "catalog/loading" }
  | { type: "catalog/error"; error: string }
  | { type: "catalog/loaded"; flies: Fly[]; myFlies: Fly[]; categories: FlyCategory[] }
  | { type: "catalog/setView"; view: CatalogView }
  | { type: "catalog/flyAdded"; fly: Fly };

// ---- Reducer ---------------------------------------------------------------

export function catalogReducer(state: CatalogState, action: CatalogAction): CatalogState {
  switch (action.type) {
    case "catalog/loading":
      return { ...state, loading: true, error: undefined };
    case "catalog/error":
      return { ...state, loading: false, error: action.error };
    case "catalog/loaded":
      return {
        ...state,
        flies: action.flies,
        myFlies: action.myFlies,
        categories: action.categories,
        loading: false,
      };
    case "catalog/setView":
      return { ...state, view: action.view };
    case "catalog/flyAdded":
      return {
        ...state,
        flies: [...state.flies, action.fly],
        myFlies: [...state.myFlies, action.fly],
      };
    default:
      return state;
  }
}

// ---- Intents (thunks) ------------------------------------------------------

export const loadCatalog = (): Thunk<AppState, AppAction, Promise<void>> => async (dispatch) => {
  dispatch({ type: "catalog/loading" });
  try {
    const [flies, myFlies, categories] = await Promise.all([
      api<Fly[]>("/flies"),
      api<Fly[]>("/flies/mine"),
      api<FlyCategory[]>("/fly-categories"),
    ]);
    dispatch({ type: "catalog/loaded", flies, myFlies, categories });
  } catch (err) {
    dispatch({ type: "catalog/error", error: err instanceof Error ? err.message : "Failed to load flies" });
  }
};

export const setView =
  (view: CatalogView): Thunk<AppState, AppAction> =>
  (dispatch) =>
    dispatch({ type: "catalog/setView", view });

export interface NewFlyInput {
  name: string;
  categoryId: number;
  hookModel: string;
  hookSize: string;
  pictures: string[];
}

export const createFly =
  (input: NewFlyInput): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    const fly = await api<Fly>("/flies", {
      method: "POST",
      body: JSON.stringify({ ...input, materialIds: [] }),
    });
    dispatch({ type: "catalog/flyAdded", fly });
  };
