-- ============================================================================
-- 🚀 SCRIPT DEFINITIVO DE BASE DE DATOS: GLOW BEAUTY POS
-- Sincronizado milimétricamente con el backend en Node.js (ESM)
-- MEJORA 3 INTEGRADA: Control de Idempotencia y Blindaje Antifraude en Devoluciones
-- ============================================================================

-- Habilitar extensión para generación de UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUMS Y TIPOS PERSONALIZADOS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('ADMIN', 'SUPERVISOR', 'CASHIER');
CREATE TYPE cash_session_status AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE sale_status AS ENUM ('COMPLETED', 'REFUNDED', 'PARTIAL_REFUNDED');
CREATE TYPE payment_method_type AS ENUM ('CASH', 'CARD', 'TRANSFER', 'MIXED');

-- ----------------------------------------------------------------------------
-- 2. TABLA: USERS (Personal del punto de venta)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'CASHIER',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: INVENTORY (Catálogo de cosméticos y stock)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    tone VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    min_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    category_id UUID DEFAULT NULL, -- Relación flexible para expansiones futuras
    description VARCHAR(200) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Restricción de seguridad compuesta para evitar duplicar el mismo producto en el mismo tono
    CONSTRAINT unique_sku_tone UNIQUE (sku, tone)
);

-- ----------------------------------------------------------------------------
-- 4. TABLA: CASH_SESSIONS (Control de turnos y flujos de efectivo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (opening_balance >= 0),
    closing_balance NUMERIC(12, 2) DEFAULT NULL,
    real_cash NUMERIC(12, 2) DEFAULT NULL,
    status cash_session_status NOT NULL DEFAULT 'OPEN',
    notes VARCHAR(255) DEFAULT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create fkey explicit name index match for: users!cash_sessions_user_id_fkey
ALTER TABLE cash_sessions 
DROP CONSTRAINT IF EXISTS cash_sessions_user_id_fkey,
ADD CONSTRAINT cash_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- ----------------------------------------------------------------------------
-- 5. TABLA: INVENTORY_LOGS (Kardex contable y auditoría de movimientos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES inventory(id) ON DELETE SET NULL, -- NULL si es movimiento manual de caja chica
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    change_amount INTEGER NOT NULL, -- Positivo (Entrada), Negativo (Salida/Venta/Merma)
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. TABLA: SALES (Cabecera de tickets de cobro masivos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE RESTRICT,
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    payment_method payment_method_type NOT NULL DEFAULT 'CASH',
    cash_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cash_amount >= 0),
    digital_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (digital_amount >= 0),
    status sale_status NOT NULL DEFAULT 'COMPLETED',
    notes VARCHAR(200) DEFAULT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 7. TABLA: SALES_ITEMS (Desglose analítico de renglones del ticket)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_sale NUMERIC(12, 2) NOT NULL CHECK (price_at_sale >= 0)
);

-- ----------------------------------------------------------------------------
-- 8. TABLA: RETURNS (Cabecera de mermas y cancelaciones)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    /* 
     * ⚡ INYECCIÓN DE LA MEJORA 3: Restricción de Unicidad (Idempotencia Dura).
     * Al añadir 'UNIQUE', el motor relacional de PostgreSQL garantiza de forma estricta 
     * que una venta ('sale_id') solo pueda poseer un único registro de reclamación 
     * de reembolso asentado en las tablas, bloqueando desfalcos por transacciones duplicadas.
     */
    sale_id UUID NOT NULL UNIQUE REFERENCES sales(id) ON DELETE RESTRICT,
    refund_total NUMERIC(12, 2) NOT NULL CHECK (refund_total >= 0),
    reason VARCHAR(150) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for explicit join constraints: users!returns_created_by_fkey
ALTER TABLE returns 
DROP CONSTRAINT IF EXISTS returns_created_by_fkey,
ADD CONSTRAINT returns_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

-- ----------------------------------------------------------------------------
-- 9. TABLA: RETURN_ITEMS (Renglones desglosados de mercancía devuelta)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- ============================================================================
-- 🛠️ AUTOMATIZACIONES Y CAPA DE PROCEDIMIENTOS ALMACENADOS (RPC)
-- ============================================================================

-- A. Función RPC: modify_stock (Invocada por inventoryRepository y returnsService)
CREATE OR REPLACE FUNCTION modify_stock(
    p_id UUID, 
    delta INTEGER, 
    p_user_id UUID, 
    p_reason VARCHAR
) 
RETURNS VOID AS $$
BEGIN
    UPDATE inventory 
    SET stock = stock + delta 
    WHERE id = p_id;

    INSERT INTO inventory_logs (product_id, user_id, change_amount, reason)
    VALUES (p_id, p_user_id, delta, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. TRIGGER: Tránsito automático de stock al confirmar tickets de venta masivos
CREATE OR REPLACE FUNCTION tr_process_sale_stock_and_logs() 
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_product_name VARCHAR;
    v_product_brand VARCHAR;
    v_product_tone VARCHAR;
    v_current_stock INTEGER;
BEGIN
    FOR item IN SELECT product_id, quantity, price_at_sale FROM sales_items WHERE sale_id = NEW.id LOOP
        
        SELECT name, brand, tone, stock INTO v_product_name, v_product_brand, v_product_tone, v_current_stock 
        FROM inventory WHERE id = item.product_id;

        IF v_current_stock < item.quantity THEN
            RAISE EXCEPTION 'Stock insuficiente en vitrina para [%] % (%)! Solo quedan % piezas.', 
                v_product_brand, v_product_name, v_product_tone, v_current_stock;
        END IF;

        PERFORM modify_stock(
            item.product_id, 
            -item.quantity, 
            NEW.created_by, 
            'VENTA REGISTRADA TICKET ID: ' || NEW.id
        );

END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_stock_on_sale ON sales;
CREATE TRIGGER tr_update_stock_on_sale
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION tr_process_sale_stock_and_logs();
