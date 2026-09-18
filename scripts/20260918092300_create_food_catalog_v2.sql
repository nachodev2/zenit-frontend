-- Migración: Estructura de Catálogo de Alimentos V2
-- No modifica la tabla existente `foods`

-- 1. Crear Enum para la taxonomía de categorías
CREATE TYPE category_taxonomy AS ENUM (
    'frutas_verduras',
    'carnes_pescados',
    'lacteos',
    'huevos',
    'cereales_legumbres',
    'panificados',
    'conservas',
    'bebidas',
    'snacks',
    'condimentos_salsas',
    'aceites_grasas',
    'congelados',
    'suplementos',
    'otros'
);

-- 2. Crear tabla raw_scrapes
CREATE TABLE public.raw_scrapes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) CHECK (source IN ('jumbo', 'carrefour', 'dia', 'manual')),
    source_url TEXT,
    source_category_path TEXT,
    raw_json JSONB,
    scraped_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error'))
);

-- 3. Crear tabla canonical_foods
CREATE TABLE public.canonical_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    category category_taxonomy NOT NULL,
    subcategory VARCHAR(255),
    food_type VARCHAR(100),
    serving_mode VARCHAR(50) CHECK (serving_mode IN ('bulk_weight', 'unit', 'packaged_volume')),
    default_portion_grams NUMERIC,
    
    calories_100g NUMERIC NOT NULL,
    protein_100g NUMERIC NOT NULL,
    carbs_100g NUMERIC NOT NULL,
    fats_100g NUMERIC NOT NULL,
    
    macro_source VARCHAR(50) CHECK (macro_source IN ('official_table', 'label_ocr', 'off_barcode', 'ai_estimated', 'legacy_heuristic')),
    macro_confidence NUMERIC CHECK (macro_confidence >= 0 AND macro_confidence <= 1),
    
    classification_method VARCHAR(50) CHECK (classification_method IN ('source_category_map', 'ai', 'manual')),
    classification_reason TEXT,
    classification_confidence NUMERIC CHECK (classification_confidence >= 0 AND classification_confidence <= 1),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Crear tabla products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_food_id UUID REFERENCES public.canonical_foods(id) ON DELETE SET NULL,
    barcode VARCHAR(64) UNIQUE,
    brand VARCHAR(150),
    source_name VARCHAR(255) NOT NULL,
    package_grams NUMERIC,
    selling_unit VARCHAR(50),
    image TEXT,
    source VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('active', 'pending_review', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.raw_scrapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas de solo lectura para usuarios autenticados
CREATE POLICY "Permitir lectura a usuarios autenticados" 
    ON public.raw_scrapes FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
    ON public.canonical_foods FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Permitir lectura a usuarios autenticados" 
    ON public.products FOR SELECT 
    TO authenticated 
    USING (true);

