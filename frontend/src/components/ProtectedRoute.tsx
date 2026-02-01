import { useKeycloak } from "@react-keycloak/web";
import { Navigate } from "react-router-dom";
import { Spin, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

/**
 * Protected Route component
 * Ensures user is authenticated and has required roles
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { keycloak, initialized } = useKeycloak();

  // Wait for Keycloak to initialize
  if (!initialized) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Initializing authentication..." fullscreen />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!keycloak.authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements if specified
  if (roles && roles.length > 0) {
    const userRoles = keycloak.tokenParsed?.realm_access?.roles || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>🚫</h1>
          <h2>Access Denied</h2>
          <p>You don't have permission to view this page.</p>
          <p style={{ marginTop: "10px", color: "#999" }}>
            <strong>Required roles:</strong> {roles.join(", ")}
          </p>
          <p style={{ color: "#999" }}>
            <strong>Your roles:</strong>{" "}
            {userRoles
              .filter((r) =>
                [
                  "admin",
                  "inventory_manager",
                  "quality_control",
                  "production",
                  "viewer",
                ].includes(r),
              )
              .join(", ") || "None"}
          </p>
          <Button
            type="primary"
            danger
            size="large"
            icon={<LogoutOutlined />}
            onClick={() =>
              keycloak.logout({ redirectUri: window.location.origin })
            }
            style={{ marginTop: "30px" }}
          >
            Logout
          </Button>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
