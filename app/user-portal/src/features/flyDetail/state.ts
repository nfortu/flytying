import type { Fly, FlyCategory, FlyVariant, Material, MaterialCategory } from "@flytying/shared";
import type { Thunk } from "../../store/store.js";
import { api } from "../../api/client.js";
import type { AppAction, AppState } from "../../store/index.js";

// ---- Model -----------------------------------------------------------------

export interface FlyDetailState {
  fly?: Fly;
  categories: FlyCategory[];
  materials: Material[];
  materialCategories: MaterialCategory[];
  variants: FlyVariant[];
  loading: boolean;
  error?: string;
  savingVariant: boolean;
  variantError?: string;
  savingMaterials: boolean;
  materialsError?: string;
}

export const initialFlyDetailState: FlyDetailState = {
  categories: [],
  materials: [],
  materialCategories: [],
  variants: [],
  loading: false,
  savingVariant: false,
  savingMaterials: false,
};

// ---- Actions ---------------------------------------------------------------

export type FlyDetailAction =
  | { type: "flyDetail/loading" }
  | { type: "flyDetail/error"; error: string }
  | {
      type: "flyDetail/loaded";
      fly: Fly;
      categories: FlyCategory[];
      materials: Material[];
      materialCategories: MaterialCategory[];
      variants: FlyVariant[];
    }
  | { type: "flyDetail/variantSaving" }
  | { type: "flyDetail/variantError"; error: string }
  | { type: "flyDetail/variantAdded"; variant: FlyVariant }
  | { type: "flyDetail/materialsSaving" }
  | { type: "flyDetail/materialsError"; error: string }
  | { type: "flyDetail/materialsUpdated"; fly: Fly };

// ---- Reducer ---------------------------------------------------------------

export function flyDetailReducer(state: FlyDetailState, action: FlyDetailAction): FlyDetailState {
  switch (action.type) {
    case "flyDetail/loading":
      return { ...initialFlyDetailState, loading: true };
    case "flyDetail/error":
      return { ...state, loading: false, error: action.error };
    case "flyDetail/loaded":
      return {
        ...state,
        fly: action.fly,
        categories: action.categories,
        materials: action.materials,
        materialCategories: action.materialCategories,
        variants: action.variants,
        loading: false,
        error: undefined,
      };
    case "flyDetail/variantSaving":
      return { ...state, savingVariant: true, variantError: undefined };
    case "flyDetail/variantError":
      return { ...state, savingVariant: false, variantError: action.error };
    case "flyDetail/variantAdded":
      return {
        ...state,
        savingVariant: false,
        variants: [...state.variants, action.variant],
      };
    case "flyDetail/materialsSaving":
      return { ...state, savingMaterials: true, materialsError: undefined };
    case "flyDetail/materialsError":
      return { ...state, savingMaterials: false, materialsError: action.error };
    case "flyDetail/materialsUpdated":
      return { ...state, savingMaterials: false, fly: action.fly };
    default:
      return state;
  }
}

// ---- Intents (thunks) ------------------------------------------------------

export const loadFlyDetail =
  (id: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    dispatch({ type: "flyDetail/loading" });
    try {
      const [fly, categories, materials, materialCategories, variants] = await Promise.all([
        api<Fly>(`/flies/${id}`),
        api<FlyCategory[]>("/fly-categories"),
        api<Material[]>("/materials"),
        api<MaterialCategory[]>("/material-categories"),
        api<FlyVariant[]>(`/flies/${id}/variants`),
      ]);
      dispatch({ type: "flyDetail/loaded", fly, categories, materials, materialCategories, variants });
    } catch (err) {
      dispatch({ type: "flyDetail/error", error: err instanceof Error ? err.message : "Failed to load fly" });
    }
  };

export interface NewVariantInput {
  name: string;
  pictures: string[];
  substitutions: { baseMaterialId: number; replacementMaterialId: number }[];
}

export const addVariant =
  (flyId: number, input: NewVariantInput): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    dispatch({ type: "flyDetail/variantSaving" });
    try {
      const variant = await api<FlyVariant>(`/flies/${flyId}/variants`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      dispatch({ type: "flyDetail/variantAdded", variant });
    } catch (err) {
      dispatch({
        type: "flyDetail/variantError",
        error: err instanceof Error ? err.message : "Could not save variant",
      });
      throw err;
    }
  };

export const updateFlyMaterials =
  (materialIds: number[]): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch, getState) => {
    const { fly } = getState().flyDetail;
    if (!fly) return;
    dispatch({ type: "flyDetail/materialsSaving" });
    try {
      const updated = await api<Fly>(`/flies/${fly.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: fly.name,
          categoryId: fly.categoryId,
          hookModel: fly.hookModel,
          hookSize: fly.hookSize,
          pictures: fly.pictures,
          materialIds,
        }),
      });
      dispatch({ type: "flyDetail/materialsUpdated", fly: updated });
    } catch (err) {
      dispatch({
        type: "flyDetail/materialsError",
        error: err instanceof Error ? err.message : "Could not update materials",
      });
      throw err;
    }
  };
