import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Note: StrictMode disabled to prevent Keycloak double initialization in dev mode
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
