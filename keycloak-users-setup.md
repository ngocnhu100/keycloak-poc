# Keycloak Users Setup Guide

## Quick Setup: 5 Users cho Inventory Management

### User 1: Admin

- Username: `admin1`
- Email: `admin1@ims.local`
- Password: `admin123`
- Role: `admin`

### User 2: Inventory Manager

- Username: `jdoe`
- Email: `jdoe@ims.local`
- Password: `jdoe123`
- Role: `inventory_manager`

### User 3: Quality Control

- Username: `qc1`
- Email: `qc1@ims.local`
- Password: `qc123`
- Role: `quality_control`

### User 4: Production

- Username: `prod1`
- Email: `prod1@ims.local`
- Password: `prod123`
- Role: `production`

### User 5: Viewer

- Username: `viewer1`
- Email: `viewer1@ims.local`
- Password: `view123`
- Role: `viewer`

---

## Automated Setup Script (Copy-Paste vào Keycloak Admin Console)

**Steps:**

1. Login to Keycloak Admin: https://your-keycloak.fly.dev/admin
2. Navigate to **inventory-management** realm
3. Users → Add User (lặp lại 5 lần với thông tin trên)
4. Mỗi user:
   - Tab Credentials → Set password (Temporary: OFF)
   - Tab Role Mapping → Assign role tương ứng

---

## Alternative: REST API Script (PowerShell)

```powershell
# Get admin token
$tokenResponse = Invoke-RestMethod -Uri "https://your-keycloak.fly.dev/realms/master/protocol/openid-connect/token" -Method Post -Body @{
    client_id = "admin-cli"
    username = "admin"
    password = "your-admin-password"
    grant_type = "password"
}

$token = $tokenResponse.access_token

# Create users
$users = @(
    @{ username = "admin1"; email = "admin1@ims.local"; password = "admin123"; role = "admin" },
    @{ username = "jdoe"; email = "jdoe@ims.local"; password = "jdoe123"; role = "inventory_manager" },
    @{ username = "qc1"; email = "qc1@ims.local"; password = "qc123"; role = "quality_control" },
    @{ username = "prod1"; email = "prod1@ims.local"; password = "prod123"; role = "production" },
    @{ username = "viewer1"; email = "viewer1@ims.local"; password = "view123"; role = "viewer" }
)

foreach ($user in $users) {
    # Create user
    Invoke-RestMethod -Uri "https://your-keycloak.fly.dev/admin/realms/inventory-management/users" `
        -Method Post `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
        -Body (@{
            username = $user.username
            email = $user.email
            emailVerified = $true
            enabled = $true
        } | ConvertTo-Json)

    Write-Host "Created user: $($user.username)"
}
```

---

## Khuyến nghị cho Production

**Lưu file này cùng với:**

- `inventory-management-realm.json` (realm config không có users)
- Recreate users thủ công sau khi import realm
- Hoặc export database backup đầy đủ
