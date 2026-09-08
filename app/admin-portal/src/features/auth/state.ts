import type { AuthResponse, User } from "@flytying/shared";
import type { Thunk } from "../../store/store.js";
import { api, setToken } from "../../api/client.js";
import type { AppAction, AppState } from "../../store/index.js";

// ---- Model -----------------------------------------------------------------

export interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "error";
  error?: string;
}

export const initialAuthState: AuthState = { user: null, status: "idle" };

// ---- Actions ---------------------------------------------------------------

export type AuthAction =
  | { type: "auth/loading" }
  | { type: "auth/success"; user: User }
  | { type: "auth/error"; error: string }
  | { type: "auth/logout" };

// ---- Reducer ---------------------------------------------------------------

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "auth/loading":
      return { ...state, status: "loading", error: undefined };
    case "auth/success":
      return { user: action.user, status: "idle", error: undefined };
    case "auth/error":
      return { user: null, status: "error", error: action.error };
    case "auth/logout":
      return { ...initialAuthState };
    default:
      return state;
  }
}

// ---- Intents (thunks) ------------------------------------------------------

export const login =
  (email: string, password: string): Thunk<AppState, AppAction, Promise<void>> =>
  async (dispatch) => {
    dispatch({ type: "auth/loading" });
    try {
      const res = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.user.role !== "admin") {
        setToken(null);
        dispatch({ type: "auth/error", error: "This portal is for administrators only." });
        return;
      }
      setToken(res.token);
      dispatch({ type: "auth/success", user: res.user });
    } catch (err) {
      dispatch({ type: "auth/error", error: err instanceof Error ? err.message : "Login failed" });
    }
  };

export const logout = (): Thunk<AppState, AppAction> => (dispatch) => {
  setToken(null);
  dispatch({ type: "auth/logout" });
};

/** Restore a session from a persisted token on app start. */
export const restoreSession =
  (): Thunk<AppState, AppAction, Promise<void>> => async (dispatch) => {
    try {
      const user = await api<User>("/auth/me");
      if (user.role === "admin") dispatch({ type: "auth/success", user });
      else setToken(null);
    } catch {
      setToken(null);
    }
  };
