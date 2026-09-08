import type { Brand, FlyCategory, MaterialCategory } from "@flytying/shared";
import type { Thunk } from "../../store/store.js";
import { api } from "../../api/client.js";
import type { AppAction, AppState } from "../../store/index.js";

// ---- Model -----------------------------------------------------------------

export interface ReferenceState {
  brands: Brand[];
  flyCategories: FlyCategory[];
  materialCategories: MaterialCategory[];
  loading: boolean;
  error?: string;
}

export const initialReferenceState: ReferenceState = {
  brands: [],
  flyCategories: [],
  materialCategories: [],
  loading: false,
};

// ---- Actions ---------------------------------------------------------------

export type ReferenceAction =
  | { type: "ref/loading" }
  | { type: "ref/error"; error: string }
  | { type: "ref/loaded"; brands: Brand[]; flyCategories: FlyCategory[]; materialCategories: MaterialCategory[] }
  | { type: "ref/brandUpsert"; brand: Brand }
  | { type: "ref/brandRemove"; id: number }
  | { type: "ref/flyCategoryUpsert"; category: FlyCategory }
  | { type: "ref/flyCategoryRemove"; id: number }
  | { type: "ref/materialCategoryUpsert"; category: MaterialCategory }
  | { type: "ref/materialCategoryRemove"; id: number };

// ---- Reducer ---------------------------------------------------------------

function upsert<T extends { id: number }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const next = list.slice();
  next[idx] = item;
  return next;
}

export function referenceReducer(state: ReferenceState, action: ReferenceAction): ReferenceState {
  switch (action.type) {
    case "ref/loading":
      return { ...state, loading: true, error: undefined };
    case "ref/error":
      return { ...state, loading: false, error: action.error };
    case "ref/loaded":
      return {
        brands: action.brands,
        flyCategories: action.flyCategories,
        materialCategories: action.materialCategories,
        loading: false,
      };
    case "ref/brandUpsert":
      return { ...state, brands: upsert(state.brands, action.brand) };
    case "ref/brandRemove":
      return { ...state, brands: state.brands.filter((b) => b.id !== action.id) };
    case "ref/flyCategoryUpsert":
      return { ...state, flyCategories: upsert(state.flyCategories, action.category) };
    case "ref/flyCategoryRemove":
      return { ...state, flyCategories: state.flyCategories.filter((c) => c.id !== action.id) };
    case "ref/materialCategoryUpsert":
      return { ...state, materialCategories: upsert(state.materialCategories, action.category) };
    case "ref/materialCategoryRemove":
      return { ...state, materialCategories: state.materialCategories.filter((c) => c.id !== action.id) };
    default:
      return state;
  }
}

// ---- Intents (thunks) ------------------------------------------------------

export const loadReference = (): Thunk<AppState, AppAction, Promise<void>> => async (dispatch) => {
  dispatch({ type: "ref/loading" });
  try {
    const [brands, flyCategories, materialCategories] = await Promise.all([
      api<Brand[]>("/brands"),
      api<FlyCategory[]>("/fly-categories"),
      api<MaterialCategory[]>("/material-categories"),
    ]);
    dispatch({ type: "ref/loaded", brands, flyCategories, materialCategories });
  } catch (err) {
    dispatch({ type: "ref/error", error: err instanceof Error ? err.message : "Failed to load data" });
  }
};

// Brands
export const saveBrand =
  (name: string, id?: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    const brand = await api<Brand>(id ? `/brands/${id}` : "/brands", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify({ name }),
    });
    dispatch({ type: "ref/brandUpsert", brand });
  };

export const deleteBrand =
  (id: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    await api(`/brands/${id}`, { method: "DELETE" });
    dispatch({ type: "ref/brandRemove", id });
  };

// Fly categories
export const saveFlyCategory =
  (name: string, details: string, id?: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    const category = await api<FlyCategory>(id ? `/fly-categories/${id}` : "/fly-categories", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify({ name, details }),
    });
    dispatch({ type: "ref/flyCategoryUpsert", category });
  };

export const deleteFlyCategory =
  (id: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    await api(`/fly-categories/${id}`, { method: "DELETE" });
    dispatch({ type: "ref/flyCategoryRemove", id });
  };

// Material categories
export const saveMaterialCategory =
  (name: string, id?: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    const category = await api<MaterialCategory>(
      id ? `/material-categories/${id}` : "/material-categories",
      { method: id ? "PUT" : "POST", body: JSON.stringify({ name }) },
    );
    dispatch({ type: "ref/materialCategoryUpsert", category });
  };

export const deleteMaterialCategory =
  (id: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    await api(`/material-categories/${id}`, { method: "DELETE" });
    dispatch({ type: "ref/materialCategoryRemove", id });
  };
