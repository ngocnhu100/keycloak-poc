-- =============================================================================
-- Inventory Management System - Database Initialization Script
-- POC: Keycloak Integration
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Create Keycloak Database
-- -----------------------------------------------------------------------------
CREATE DATABASE keycloak_db;

-- Create dedicated Keycloak user
CREATE USER keycloak WITH PASSWORD 'keycloak';

-- Grant all privileges on Keycloak database
GRANT ALL PRIVILEGES ON DATABASE keycloak_db TO keycloak;

-- Connect to keycloak_db to set schema permissions
\c keycloak_db;
GRANT ALL ON SCHEMA public TO keycloak;

-- -----------------------------------------------------------------------------
-- Create Inventory Management System Database
-- -----------------------------------------------------------------------------
\c postgres;

CREATE DATABASE inventory_db;

-- Grant privileges to default postgres user
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO postgres;

-- Connect to inventory_db to create tables
\c inventory_db;

-- -----------------------------------------------------------------------------
-- Table: Materials (Master Data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Materials" (
    material_id VARCHAR(20) PRIMARY KEY,
    part_number VARCHAR(20) NOT NULL UNIQUE,
    material_name VARCHAR(100) NOT NULL,
    material_type VARCHAR(50) NOT NULL CHECK (
        material_type IN (
            'API', 
            'Excipient', 
            'Dietary Supplement', 
            'Container', 
            'Closure', 
            'Process Chemical', 
            'Testing Material'
        )
    ),
    storage_conditions VARCHAR(100),
    specification_document VARCHAR(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample materials
INSERT INTO "Materials" (material_id, part_number, material_name, material_type, storage_conditions, specification_document)
VALUES 
    ('MAT-001', 'PART-10001', 'Vitamin D3 100K', 'API', '2-8°C, dry', 'SPEC-API-001'),
    ('MAT-002', 'PART-10002', 'Calcium Carbonate', 'Excipient', 'Room temp, dry', 'SPEC-EXC-001'),
    ('MAT-003', 'PART-10003', 'Magnesium Stearate', 'Excipient', 'Room temp, dry', 'SPEC-EXC-002'),
    ('MAT-004', 'PART-20001', 'HDPE Bottle 100ml', 'Container', 'Room temp', 'SPEC-CON-001'),
    ('MAT-005', 'PART-30001', 'Multivitamin Tablet', 'Dietary Supplement', '15-25°C, dry', 'SPEC-FG-001')
ON CONFLICT (material_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Table: InventoryLots
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "InventoryLots" (
    lot_number VARCHAR(20) PRIMARY KEY,
    material_id VARCHAR(20) NOT NULL REFERENCES "Materials"(material_id),
    quantity_received DECIMAL(10, 3) NOT NULL CHECK (quantity_received > 0),
    quantity_available DECIMAL(10, 3) NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    lot_status VARCHAR(20) NOT NULL DEFAULT 'Quarantine' CHECK (
        lot_status IN ('Quarantine', 'Approved', 'Rejected', 'In Use', 'Depleted')
    ),
    supplier VARCHAR(100),
    manufacturer_lot VARCHAR(50),
    expiry_date DATE NOT NULL,
    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    storage_location VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(50),
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_inventory_lots_material_id ON "InventoryLots"(material_id);
CREATE INDEX idx_inventory_lots_status ON "InventoryLots"(lot_status);
CREATE INDEX idx_inventory_lots_expiry ON "InventoryLots"(expiry_date);

-- Insert sample lots
INSERT INTO "InventoryLots" (
    lot_number, material_id, quantity_received, quantity_available, 
    lot_status, supplier, manufacturer_lot, expiry_date, storage_location
)
VALUES 
    ('LOT-20260115-1001', 'MAT-001', 500.000, 500.000, 'Quarantine', 'Supplier A', 'MFG-VD3-2026-01', '2027-01-15', 'COLD-A-01'),
    ('LOT-20260120-2001', 'MAT-002', 1000.000, 1000.000, 'Approved', 'Supplier B', 'MFG-CAC-2026-01', '2028-01-20', 'ROOM-B-05'),
    ('LOT-20260125-3001', 'MAT-003', 250.000, 250.000, 'Approved', 'Supplier C', 'MFG-MGS-2026-01', '2027-12-31', 'ROOM-C-02')
ON CONFLICT (lot_number) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Table: Users (Keycloak user snapshot for joins)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Users" (
    user_id VARCHAR(36) PRIMARY KEY, -- Keycloak sub
    username VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON "Users"(username);

-- -----------------------------------------------------------------------------
-- Table: InventoryTransactions (Audit Trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "InventoryTransactions" (
    transaction_id SERIAL PRIMARY KEY,
    lot_number VARCHAR(20) NOT NULL REFERENCES "InventoryLots"(lot_number),
    transaction_type VARCHAR(20) NOT NULL CHECK (
        transaction_type IN ('Receipt', 'Dispense', 'Adjust', 'Return', 'Waste')
    ),
    quantity DECIMAL(10, 3) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performed_by VARCHAR(36) NOT NULL REFERENCES "Users"(user_id),
    reason VARCHAR(200),
    reference_document VARCHAR(50)
);

CREATE INDEX idx_transactions_lot ON "InventoryTransactions"(lot_number);
CREATE INDEX idx_transactions_date ON "InventoryTransactions"(transaction_date);
CREATE INDEX idx_transactions_performed_by ON "InventoryTransactions"(performed_by);

-- -----------------------------------------------------------------------------
-- Table: QCTests (Quality Control)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "QCTests" (
    test_id SERIAL PRIMARY KEY,
    lot_number VARCHAR(20) NOT NULL REFERENCES "InventoryLots"(lot_number),
    test_type VARCHAR(50) NOT NULL,
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_result VARCHAR(20) NOT NULL CHECK (
        test_result IN ('Pass', 'Fail', 'Pending', 'N/A')
    ),
    tested_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    approved_date TIMESTAMP,
    remarks TEXT
);

CREATE INDEX idx_qc_tests_lot ON "QCTests"(lot_number);

-- -----------------------------------------------------------------------------
-- Table: ProductionBatches
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ProductionBatches" (
    batch_number VARCHAR(20) PRIMARY KEY,
    product_id VARCHAR(20) NOT NULL REFERENCES "Materials"(material_id),
    batch_size DECIMAL(10, 3) NOT NULL,
    batch_status VARCHAR(20) NOT NULL DEFAULT 'In Progress' CHECK (
        batch_status IN ('In Progress', 'Completed', 'Released', 'Rejected', 'Quarantine')
    ),
    production_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    created_by VARCHAR(50),
    notes TEXT
);

-- -----------------------------------------------------------------------------
-- Table: BatchComponents (BOM)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BatchComponents" (
    component_id SERIAL PRIMARY KEY,
    batch_number VARCHAR(20) NOT NULL REFERENCES "ProductionBatches"(batch_number),
    lot_number VARCHAR(20) NOT NULL REFERENCES "InventoryLots"(lot_number),
    material_id VARCHAR(20) NOT NULL REFERENCES "Materials"(material_id),
    quantity_used DECIMAL(10, 3) NOT NULL CHECK (quantity_used > 0),
    dispensed_by VARCHAR(50),
    dispensed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_batch_components_batch ON "BatchComponents"(batch_number);
CREATE INDEX idx_batch_components_lot ON "BatchComponents"(lot_number);

-- -----------------------------------------------------------------------------
-- Success Message
-- -----------------------------------------------------------------------------
\echo '✅ Database initialization completed successfully!'
\echo '📊 Created databases: keycloak_db, inventory_db'
\echo '📋 Created tables: Users, Materials, InventoryLots, InventoryTransactions, QCTests, ProductionBatches, BatchComponents'
\echo '🔑 Sample data inserted'
