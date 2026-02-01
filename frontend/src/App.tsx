import React from "react";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import keycloak from "./auth/keycloak";
import ProtectedRoute from "./components/ProtectedRoute";
import ReceivingForm from "./components/ReceivingForm";

/**
 * Main App Component
 * Configures Keycloak provider and routing
 */
const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={{
          onLoad: "login-required",
          checkLoginIframe: false,
        }}
        onTokens={(tokens) => {
          console.log("Tokens received:", {
            token: tokens.token ? "✅ Present" : "❌ Missing",
            refreshToken: tokens.refreshToken ? "✅ Present" : "❌ Missing",
          });
        }}
      >
        <BrowserRouter>
          <Routes>
            {/* Login placeholder (Keycloak handles actual login) */}
            <Route
              path="/login"
              element={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                  }}
                >
                  Redirecting to Keycloak login...
                </div>
              }
            />

            {/* Receiving page - requires inventory_manager or admin role */}
            <Route
              path="/receiving"
              element={
                <ProtectedRoute roles={["inventory_manager", "admin"]}>
                  <ReceivingForm />
                </ProtectedRoute>
              }
            />

            {/* Default route */}
            <Route path="/" element={<Navigate to="/receiving" replace />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                  }}
                >
                  <h1 style={{ fontSize: "72px" }}>404</h1>
                  <h2>Page Not Found</h2>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </ReactKeycloakProvider>
    </ConfigProvider>
  );
};

export default App;
