import Keycloak from "keycloak-js";

/**
 * Keycloak client configuration
 * This connects to the Keycloak server and uses the inventory-frontend client
 */
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: "inventory-management",
  clientId: "inventory-frontend",
});

export default keycloak;
