-- =================================================================
-- ZENIT - MIGRACIÓN MAESTRA SUPABASE
-- 1. Limpieza de Alimentos para Mascotas (Dog Chow, Felix, Whiskas, etc.)
-- 2. Extensión pg_trgm & Índices GIN de Alto Rendimiento (<30ms)
-- 3. Row Level Security (RLS) & Políticas de Seguridad
-- =================================================================

-- -------------------------------------------------------------
-- 1. LIMPIEZA DE ALIMENTOS PARA ANIMALES / MASCOTAS
-- -------------------------------------------------------------
DELETE FROM public.foods 
WHERE barcode IN (
  '7891000423325', '7891000423318', '7891000423332', '8445290927149', '8445290926722',
  '7891000241080', '8445290667571', '8445290584984', '8445291478701', '8445290585004',
  '7613287230423', '7798139791786', '7798139790017', '8851393004180', '7797453973823',
  '7797453973793', '7797453000413'
)
OR (
  (name ILIKE '%perro%' AND name NOT ILIKE '%vino%')
  OR (name ILIKE '%gato%' AND name NOT ILIKE '%gatorade%' AND name NOT ILIKE '%rigatoni%')
  OR brand ILIKE ANY (ARRAY['%dog chow%', '%cat chow%', '%whiskas%', '%pedigree%', '%felix%', '%gati%', '%purina%', '%temptations%', '%pets class%'])
);

-- -------------------------------------------------------------
-- 2. INDEXACIÓN DE TEXTO COMPLETO Y TRIGRAMAS (pg_trgm)
-- -------------------------------------------------------------
-- Habilitar extensión de trigramas si no existe
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice GIN sobre (nombre + marca + categoría) para acelerar ILIKE '%termino%' a <30ms
CREATE INDEX IF NOT EXISTS idx_foods_search_trgm 
ON public.foods 
USING gin ((name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(category, '')) gin_trgm_ops);

-- Índice B-Tree para escaneo instantáneo por código de barras
CREATE INDEX IF NOT EXISTS idx_foods_barcode 
ON public.foods (barcode);

-- Índice B-Tree para filtro por estado de aprobación
CREATE INDEX IF NOT EXISTS idx_foods_status 
ON public.foods (status);

-- -------------------------------------------------------------
-- 3. SEGURIDAD: ROW LEVEL SECURITY (RLS) Y POLÍTICAS
-- -------------------------------------------------------------
-- Activar RLS en la tabla
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores si existieran
DROP POLICY IF EXISTS "Permitir lectura publica de alimentos aprobados" ON public.foods;
DROP POLICY IF EXISTS "Permitir a usuarios enviar alimentos para moderacion" ON public.foods;

-- Política 1 (Lectura): Cualquier usuario o app puede leer alimentos aprobados
CREATE POLICY "Permitir lectura publica de alimentos aprobados"
ON public.foods
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Política 2 (Alta Comunitaria): Los usuarios solo pueden insertar alimentos con status 'pending'
CREATE POLICY "Permitir a usuarios enviar alimentos para moderacion"
ON public.foods
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending');

-- NOTA: UPDATE y DELETE quedan bloqueados para anon/authenticated.
-- Solo pueden ejecutarse por administradores o procesos backend vía service_role.

