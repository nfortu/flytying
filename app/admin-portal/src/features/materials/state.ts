import type { Material, MaterialCategory } from "@flytying/shared";
import type { Thunk } from "../../store/store.js";
import { api } from "../../api/client.js";
import type { AppAction, AppState } from "../../store/index.js";

// ---- Model -----------------------------------------------------------------

export interface MaterialsState {
  materials: Material[];
  categories: MaterialCategory[];
  loading: boolean;
  error?: string;
}

export const initialMaterialsState: MaterialsState = {
  materials: [],
  categories: [],
  loading: false,
};

// ---- Actions ---------------------------------------------------------------

export type MaterialsAction =
  | { type: "materials/loading" }
  | { type: "materials/error"; error: string }
  | { type: "materials/loaded"; materials: Material[]; categories: MaterialCategory[] }
  | { type: "materials/upsert"; material: Material }
  | { type: "materials/remove"; id: number };

// ---- Reducer ---------------------------------------------------------------

function upsert<T extends { id: number }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const next = list.slice();
  next[idx] = item;
  return next;
}

export function materialsReducer(state: MaterialsState, action: MaterialsAction): MaterialsState {
  switch (action.type) {
    case "materials/loading":
      return { ...state, loading: true, error: undefined };
    case "materials/error":
      return { ...state, loading: false, error: action.error };
    case "materials/loaded":
      return { materials: action.materials, categories: action.categories, loading: false };
    case "materials/upsert":
      return { ...state, materials: upsert(state.materials, action.material) };
    case "materials/remove":
      return { ...state, materials: state.materials.filter((m) => m.id !== action.id) };
    default:
      return state;
  }
}

// ---- Intents (thunks) ------------------------------------------------------

export const loadMaterials = (): Thunk<AppState, AppAction, Promise<void>> => async (dispatch) => {
  dispatch({ type: "materials/loading" });
  try {
    const [materials, categories] = await Promise.all([
      api<Material[]>("/materials"),
      api<MaterialCategory[]>("/material-categories"),
    ]);
    dispatch({ type: "materials/loaded", materials, categories });
  } catch (err) {
    dispatch({ type: "materials/error", error: err instanceof Error ? err.message : "Failed to load materials" });
  }
};

/** Brand assignment isn't managed from this screen; existing brandIds are preserved on edit. */
export const saveMaterial =
  (categoryId: number, name: string, details: string, id?: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch, getState) => {
    const existing = id ? getState().materials.materials.find((m) => m.id === id) : undefined;
    const material = await api<Material>(id ? `/materials/${id}` : "/materials", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify({ categoryId, name, details, brandIds: existing?.brandIds ?? [] }),
    });
    dispatch({ type: "materials/upsert", material });
  };

export const deleteMaterial =
  (id: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    await api(`/materials/${id}`, { method: "DELETE" });
    dispatch({ type: "materials/remove", id });
  };
