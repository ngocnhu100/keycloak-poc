import { useKeycloak } from "@react-keycloak/web";
import { Navigate } from "react-router-dom";
import { Spin, Button, Result } from "antd";
import { LogoutOutlined, StopOutlined } from "@ant-design/icons";
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
        <div className="access-denied">
          <Result
            status="403"
            title="Access denied"
            subTitle="You don't have permission to view this page."
            icon={<StopOutlined />}
            extra={[
              <div key="roles" className="access-denied__meta">
                <div>
                  <strong>Required roles:</strong> {roles.join(", ")}
                </div>
                <div>
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
                </div>
              </div>,
              <Button
                key="logout"
                type="primary"
                size="large"
                icon={<LogoutOutlined />}
                onClick={() =>
                  keycloak.logout({ redirectUri: window.location.origin })
                }
              >
                Sign out
              </Button>,
            ]}
          />
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
