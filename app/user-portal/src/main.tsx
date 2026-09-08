import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StoreProvider } from "./store/react.js";
import { store } from "./store/index.js";
import { restoreSession } from "./features/auth/state.js";
import { App } from "./App.js";
import "./index.css";

// Kick off session restore before first paint; the view reacts to the result.
store.dispatch(restoreSession());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
);
