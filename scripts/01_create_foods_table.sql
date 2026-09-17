-- =================================================================
-- PASO 1: CREAR TABLA MAESTRA 'foods', ÍNDICES Y SEGURIDAD RLS
-- Copiá y pegá este script en el SQL Editor de Supabase y dale a RUN
-- =================================================================

-- 1. Habilitar extensión para búsqueda ultra rápida y tolerante a errores
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Crear tabla maestra de alimentos si no existe
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(150),
    category VARCHAR(100) DEFAULT 'Alimento',
    
    -- Macros base por 100g / 100ml
    calories NUMERIC NOT NULL DEFAULT 0,
    protein NUMERIC NOT NULL DEFAULT 0,
    carbs NUMERIC NOT NULL DEFAULT 0,
    fats NUMERIC NOT NULL DEFAULT 0,
    
    -- Normalización de porciones y envases
    default_portion_type VARCHAR(20) DEFAULT 'unit', -- 'unit' o 'grams'
    serving_size VARCHAR(100),
    unit_name VARCHAR(100),
    unit_grams NUMERIC DEFAULT 100,
    unit_calories NUMERIC,
    unit_protein NUMERIC,
    unit_carbs NUMERIC,
    unit_fats NUMERIC,
    
    -- Imagen y moderación comunitaria
    image TEXT,
    status VARCHAR(20) DEFAULT 'approved', -- 'approved', 'pending', 'rejected'
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices de alta velocidad (<30ms de respuesta)
CREATE INDEX IF NOT EXISTS idx_foods_search ON public.foods USING gin (
    (name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(category, '')) gin_trgm_ops
);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON public.foods (barcode);
CREATE INDEX IF NOT EXISTS idx_foods_status ON public.foods (status);

-- 4. Seguridad (Row Level Security)
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores si existieran para evitar errores de duplicado
DROP POLICY IF EXISTS "Lectura publica de alimentos aprobados" ON public.foods;
DROP POLICY IF EXISTS "Permitir lectura publica de alimentos aprobados" ON public.foods;
DROP POLICY IF EXISTS "Usuarios pueden proponer alimentos" ON public.foods;

-- Política 1: Lectura libre para la app de productos aprobados
CREATE POLICY "Lectura publica de alimentos aprobados"
    ON public.foods FOR SELECT
    TO anon, authenticated
    USING (status = 'approved');

-- Política 2: Usuarios pueden subir alimentos con status pendiente
CREATE POLICY "Usuarios pueden proponer alimentos"
    ON public.foods FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'pending' OR status IS NULL);

