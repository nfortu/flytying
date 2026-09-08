/**
 * Minimal reducer store implementing unidirectional data flow.
 *
 *   View --dispatch(intent)--> [effects] --dispatch(action)--> reducer --> state --> View
 *
 * Intents are either plain action objects or "thunks" (functions that receive
 * dispatch/getState) so side effects like API calls live outside reducers.
 */

export interface Action<T extends string = string> {
  type: T;
  [key: string]: unknown;
}

export type Reducer<S, A extends Action> = (state: S, action: A) => S;

export type Thunk<S, A extends Action, R = void> = (
  dispatch: Dispatch<S, A>,
  getState: () => S,
) => R;

export type Dispatch<S, A extends Action> = {
  (action: A): void;
  <R>(thunk: Thunk<S, A, R>): R;
};

export interface Store<S, A extends Action> {
  getState: () => S;
  dispatch: Dispatch<S, A>;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<S, A extends Action>(
  reducer: Reducer<S, A>,
  initialState: S,
): Store<S, A> {
  let state = initialState;
  const listeners = new Set<() => void>();

  const getState = () => state;

  const dispatch = ((action: A | Thunk<S, A, unknown>): unknown => {
    if (typeof action === "function") {
      return (action as Thunk<S, A, unknown>)(dispatch, getState);
    }
    state = reducer(state, action);
    listeners.forEach((l) => l());
    return undefined;
  }) as Dispatch<S, A>;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, dispatch, subscribe };
}
