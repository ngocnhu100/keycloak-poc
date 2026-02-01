import dotenv from "dotenv";

dotenv.config();

export const keycloakConfig = {
  url: process.env.KEYCLOAK_URL || "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM || "inventory-management",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "inventory-backend",

  // Derived URLs
  get jwksUri() {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/certs`;
  },

  get issuer() {
    return `${this.url}/realms/${this.realm}`;
  },
};
