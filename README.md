# Inventory Management System - Source Code & POC

This directory contains the complete source code for the Inventory Management System, including the Keycloak Authentication Proof of Concept implementation.

---

## 📋 Prerequisites

- Docker Desktop installed
- Node.js 20+ and npm installed
- PostgreSQL client (optional, for manual DB verification)

---

## 🚀 Quick Start

### Step 1: Start Keycloak and PostgreSQL

```bash
# Navigate to this directory
cd 02_Source/"01_Source Code"

# Start containers
docker-compose up -d

# Verify containers are running
docker ps
```

**Expected output:**

```
CONTAINER ID   IMAGE                              STATUS
abc123def456   quay.io/keycloak/keycloak:24.0    Up
789ghi012jkl   postgres:15                        Up
```

**Access Keycloak Admin Console:**

- URL: http://localhost:8080/admin
- Username: `admin`
- Password: `admin`

---

### Step 2: Configure Keycloak

#### 2.1. Create Realm

1. Go to http://localhost:8080/admin
2. Click **Create Realm**
3. Realm name: `inventory-management`
4. Click **Create**

#### 2.2. Create Frontend Client

1. Go to **Clients** → **Create client**
2. Settings:
   - Client ID: `inventory-frontend`
   - Client type: `OpenID Connect`
   - Click **Next**
3. Capability config:
   - Client authentication: **OFF** (public client for SPA)
   - Authorization: **OFF**
   - Authentication flow: Check **Standard flow**
   - Click **Next**
4. Login settings:
   - Valid redirect URIs: `http://localhost:5173/*`
   - Valid post logout redirect URIs: `http://localhost:5173/*`
   - Web origins: `http://localhost:5173`
   - Click **Save**

#### 2.3. Create Backend Client

1. Go to **Clients** → **Create client**
2. Settings:
   - Client ID: `inventory-backend`
   - Client type: `OpenID Connect`
   - Click **Next**
3. Capability config:
   - Client authentication: **ON** (confidential client)
   - Authorization: **OFF**
   - Authentication flow: Uncheck all (bearer-only)
   - Click **Save**

#### 2.4. Create Realm Roles

Go to **Realm roles** → **Create role** and create the following:

| Role Name           | Description                               |
| ------------------- | ----------------------------------------- |
| `admin`             | Full system administrator                 |
| `inventory_manager` | Warehouse manager (can receive inventory) |
| `quality_control`   | QC specialist (can approve/reject lots)   |
| `production`        | Production operator                       |
| `viewer`            | Read-only access                          |

#### 2.5. Create Test Users

Go to **Users** → **Create new user** and create:

| Username | Email             | Password | Assigned Roles    |
| -------- | ----------------- | -------- | ----------------- |
| admin1   | admin1@ims.local  | admin123 | admin             |
| jdoe     | jdoe@ims.local    | jdoe123  | inventory_manager |
| qc1      | qc1@ims.local     | qc123    | quality_control   |
| prod1    | prod1@ims.local   | prod123  | production        |
| viewer1  | viewer1@ims.local | view123  | viewer            |

**For each user:**

1. Set email, username
2. Click **Create**
3. Go to **Credentials** tab → **Set password** (disable "Temporary")
4. Go to **Role mapping** tab → **Assign role** → Select appropriate role

---

### Step 3: Start Backend Server

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Inventory Management System - Backend API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:3000
🔐 Keycloak URL: http://localhost:8080
🗄️  Database: inventory_db
🌍 Environment: development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 4: Start Frontend Application

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output:**

```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🔄 Keycloak Backup & Restore

To backup and restore Keycloak realm configuration (including users, roles, clients, etc.) without needing database backup, use the realm export/import feature. The `inventory-management-realm.json` file in this directory contains the complete realm configuration.

### Export Realm Configuration

#### Option 1: Via Keycloak CLI (Recommended - Includes Users & Passwords)

```powershell
# Export realm using Keycloak CLI
docker exec keycloak /opt/keycloak/bin/kc.sh export --dir /opt/keycloak/data/export --realm inventory-management --users realm_file

# Copy exported file to host
docker cp keycloak:/opt/keycloak/data/export/inventory-management-realm.json ./inventory-management-realm.json

# Verify export (check number of users)
$json = Get-Content inventory-management-realm.json | ConvertFrom-Json
Write-Host "Total users exported: $($json.users.Count)"
$json.users | Select-Object username, email | Format-Table
```

**Expected output:**

```
Total users exported: 5

username firstName LastName email
-------- --------- -------- -----
admin1   Admin     User     admin1@ims.local
jdoe     John      Doe      jdoe@ims.local
qc1      QC        Inspector qc1@ims.local
prod1    Production Staff    prod1@ims.local
viewer1  View      Only     viewer1@ims.local
```

#### Option 2: Via Keycloak Admin Console

1. Access Keycloak Admin Console at http://localhost:8080/admin
2. Login with admin credentials
3. Select the `inventory-management` realm
4. Go to **Realm settings** → **Action** → **Partial export**
5. Toggle **ON**: **Include groups and roles** and **Include clients**
6. Click **Export**

**Note:** This method may not export user passwords, only configuration.

### Restore Realm Configuration

#### Option 1: Via Keycloak Admin Console

1. Access Keycloak Admin Console at http://localhost:8080/admin
2. Login with admin credentials
3. Click **Create realm**
4. Select **Browse** and upload `inventory-management-realm.json`
5. Click **Create**

#### Option 2: Via REST API

```powershell
# Get access token
$tokenResponse = Invoke-WebRequest -Uri "http://localhost:8080/realms/master/protocol/openid-connect/token" `
  -Method POST `
  -ContentType "application/x-www-form-urlencoded" `
  -UseBasicParsing `
  -Body @{
    grant_type = "password"
    client_id = "admin-cli"
    username = "admin"
    password = "admin"
  }
$token = ($tokenResponse.Content | ConvertFrom-Json).access_token

# Then import
Invoke-WebRequest -Uri "http://localhost:8080/admin/realms" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
  -UseBasicParsing `
  -InFile "inventory-management-realm.json"
```

**Note:** This method recreates the realm from scratch with all users, roles, and clients. No database backup is required for configuration-only restore.

---

## 🧪 Testing the POC

### Test Case 1: Login as Inventory Manager

1. Open http://localhost:5173
2. You will be redirected to Keycloak login page
3. Login with:
   - Username: `jdoe`
   - Password: `jdoe123`
4. You should be redirected back to the Receiving form

**Expected result:** ✅ Login successful, form displayed with user info

---

### Test Case 2: Create Inventory Lot

1. Select a material from dropdown (e.g., "Vitamin D3 100K")
2. Enter quantity: `100.500`
3. Select expiry date: Future date (e.g., 2026-12-31)
4. Fill optional fields (supplier, manufacturer lot, etc.)
5. Click **Create Lot**

**Expected result:** ✅ Success message with generated lot number (e.g., "LOT-20260130-3742")

**Verify in database:**

```bash
docker exec -it postgres psql -U postgres -d inventory_db

SELECT * FROM "InventoryLots" ORDER BY received_date DESC LIMIT 1;
```

---

### Test Case 3: Access Denied for Viewer Role

1. Logout from current session
2. Login with:
   - Username: `viewer1`
   - Password: `view123`
3. Try to access http://localhost:5173/receiving

**Expected result:** ❌ Access Denied message displayed

---

## 📁 Project Structure

```
02_Source Code/01_Source Code/
├── docker-compose.yml           # Keycloak + PostgreSQL
├── init-db.sql                  # Database initialization
├── backend/                     # Express API
│   ├── src/
│   │   ├── config/             # Database & Keycloak config
│   │   ├── middleware/         # JWT verification + RBAC
│   │   ├── models/             # Sequelize models
│   │   ├── controllers/        # Business logic
│   │   ├── routes/             # API routes
│   │   └── server.ts           # Server entry point
│   └── package.json
└── frontend/                    # React SPA
    ├── src/
    │   ├── auth/               # Keycloak configuration
    │   ├── services/           # API client with interceptors
    │   ├── components/         # React components
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

For complete technical documentation, see [06_Proof of Concept.md](./06_Proof%20of%20Concept.md)

---

## 👥 Contributors

**SEC_Team_02** - Software Engineering Capstone 2026
