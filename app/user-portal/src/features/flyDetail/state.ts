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
  savingEdit: boolean;
  editError?: string;
  deleting: boolean;
  deleteError?: string;
}

export const initialFlyDetailState: FlyDetailState = {
  categories: [],
  materials: [],
  materialCategories: [],
  variants: [],
  loading: false,
  savingVariant: false,
  savingMaterials: false,
  savingEdit: false,
  deleting: false,
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
  | { type: "flyDetail/materialsUpdated"; fly: Fly }
  | { type: "flyDetail/editSaving" }
  | { type: "flyDetail/editError"; error: string }
  | { type: "flyDetail/edited"; fly: Fly }
  | { type: "flyDetail/deleting" }
  | { type: "flyDetail/deleteError"; error: string }
  | { type: "flyDetail/deleted" };

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
    case "flyDetail/editSaving":
      return { ...state, savingEdit: true, editError: undefined };
    case "flyDetail/editError":
      return { ...state, savingEdit: false, editError: action.error };
    case "flyDetail/edited":
      return { ...state, savingEdit: false, fly: action.fly };
    case "flyDetail/deleting":
      return { ...state, deleting: true, deleteError: undefined };
    case "flyDetail/deleteError":
      return { ...state, deleting: false, deleteError: action.error };
    case "flyDetail/deleted":
      return { ...state, deleting: false };
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

// PUT /flies/:id takes multipart/form-data (new pictures arrive as uploaded
// files, same as POST); existingPictures/materialIds ride along as JSON strings.
function flyFormData(fields: {
  name: string;
  categoryId: number;
  hookModel: string;
  hookSize: string;
  existingPictures: string[];
  materialIds: number[];
  newPictures?: File[];
}): FormData {
  const body = new FormData();
  body.set("name", fields.name);
  body.set("categoryId", String(fields.categoryId));
  body.set("hookModel", fields.hookModel);
  body.set("hookSize", fields.hookSize);
  body.set("existingPictures", JSON.stringify(fields.existingPictures));
  body.set("materialIds", JSON.stringify(fields.materialIds));
  for (const picture of fields.newPictures ?? []) body.append("pictures", picture);
  return body;
}

export const updateFlyMaterials =
  (materialIds: number[]): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch, getState) => {
    const { fly } = getState().flyDetail;
    if (!fly) return;
    dispatch({ type: "flyDetail/materialsSaving" });
    try {
      const updated = await api<Fly>(`/flies/${fly.id}`, {
        method: "PUT",
        body: flyFormData({ ...fly, existingPictures: fly.pictures, materialIds }),
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

export interface EditFlyInput {
  name: string;
  categoryId: number;
  hookModel: string;
  hookSize: string;
  existingPictures: string[];
  newPictures: File[];
}

export const updateFly =
  (input: EditFlyInput): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch, getState) => {
    const { fly } = getState().flyDetail;
    if (!fly) return;
    dispatch({ type: "flyDetail/editSaving" });
    try {
      const updated = await api<Fly>(`/flies/${fly.id}`, {
        method: "PUT",
        body: flyFormData({ ...input, materialIds: fly.materialIds, newPictures: input.newPictures }),
      });
      dispatch({ type: "flyDetail/edited", fly: updated });
    } catch (err) {
      dispatch({
        type: "flyDetail/editError",
        error: err instanceof Error ? err.message : "Could not update fly",
      });
      throw err;
    }
  };

export const deleteFly =
  (id: number): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    dispatch({ type: "flyDetail/deleting" });
    try {
      await api<void>(`/flies/${id}`, { method: "DELETE" });
      dispatch({ type: "flyDetail/deleted" });
    } catch (err) {
      dispatch({
        type: "flyDetail/deleteError",
        error: err instanceof Error ? err.message : "Could not delete fly",
      });
      throw err;
    }
  };
