-- =================================================================
-- ZENIT: 04_CLEANUP_PET_FOODS_AND_FIX_IMAGES.SQL
-- 1. Elimina alimentos de mascotas (perros/gatos) filtrados por error
-- 2. Corrige packshot HD oficial para ENA True Made Whey Protein
-- =================================================================

-- 1. Purgar alimentos de mascotas detectados en Supabase
DELETE FROM public.foods
WHERE barcode IN (
  '7891000423325', -- Dog Chow adulto Alta Proteína 85g
  '7891000423318', -- Dog Chow adulto multi proteína 85g
  '7891000423332', -- Dog Chow adulto triple Proteina 85g
  '8445290927149', -- Dog Chow adulto alta proteína 2.7 kg
  '8445290926722', -- Dog Chow Alta Proteína 1 Kg
  '7891000241080', -- Felix Salmón 85 Gr
  '8445290667571', -- Gati Pescado Y Salmón 8 Kg
  '8445290584984', -- Gati Pescado Y Salmón 1 Kg
  '8445291478701', -- Gati Pescado y Salmón Adultos 500 Grs
  '8445290585004', -- Gati Pescado y Salmón Adultos 3 Kg
  '7613287230423', -- Purina One Gato Salmón 500 Gr
  '7798139791786', -- Pet's Class Salmón Perro 85gr
  '7798139790017', -- Pet's Class Gatos Salmón Rosado 340 Grs
  '8851393004180', -- Temptations Salmon Y Queso 48gr
  '7797453973823', -- Whiskas Salmon 80gr
  '7797453973793', -- Whiskas Salmon 40gr
  '7797453000413'  -- Whiskas Adulto Salmon 85gr
);

-- Purgar de forma preventiva cualquier otro producto para mascotas
DELETE FROM public.foods
WHERE brand ILIKE ANY (ARRAY['%dog chow%', '%cat chow%', '%whiskas%', '%felix%', '%gati%', '%pedigree%', '%purina one%', '%temptations%', '%pet''s class%', '%pets class%', '%royal canin%', '%vitalcan%', '%sabrositos%'])
   OR name ILIKE ANY (ARRAY['%alimento para perro%', '%alimento para gato%', '%comida para perro%', '%comida para gato%', '%snack para perro%', '%snack para gato%', '%alimento humedo para gato%', '%alimento humedo para perro%']);

-- 2. Actualizar imagen oficial de True Made Whey Protein ENA Sport (reemplazar link roto 404 de Open Food Facts)
UPDATE public.foods
SET image = 'https://jumboargentina.vteximg.com.br/arquivos/ids/925375/Proteina-En-Polvo-Ena-Sport-Chocolate-900gr-1-1062611.jpg'
WHERE barcode = '7798080000025';

-- 3. Asegurar que las leches clásicas La Serenísima estén con sus códigos EAN oficiales
INSERT INTO public.foods (
  barcode, name, brand, category, calories, protein, carbs, fats,
  default_portion_type, serving_size, unit_name, unit_grams,
  unit_calories, unit_protein, unit_carbs, unit_fats, image, status
)
VALUES
(
  '7790742335500',
  'Leche Entera Clásica La Serenísima Botella 1 Lt',
  'LA SERENISIMA',
  'Lácteos y Huevos',
  58, 3.1, 4.7, 3.0,
  'unit', '200ml (1 vaso)', '1 vaso (200ml)', 200,
  116, 6.2, 9.4, 6.0,
  'https://ardiaprod.vteximg.com.br/arquivos/ids/343521/Leche-Entera-Clasica-La-Serenisima-Botella-Larga-Vida-1-Lt-_1.jpg',
  'approved'
),
(
  '7790742363008',
  'Leche Entera Clásica La Serenísima Larga Vida 1 Lt',
  'LA SERENISIMA',
  'Lácteos y Huevos',
  58, 3.1, 4.7, 3.0,
  'unit', '200ml (1 vaso)', '1 vaso (200ml)', 200,
  116, 6.2, 9.4, 6.0,
  'https://ardiaprod.vteximg.com.br/arquivos/ids/343521/Leche-Entera-Clasica-La-Serenisima-Botella-Larga-Vida-1-Lt-_1.jpg',
  'approved'
),
(
  '7790742335401',
  'Leche Parcialmente Descremada 1% La Serenísima Botella Verde 1 Lt',
  'LA SERENISIMA',
  'Lácteos y Huevos',
  44, 3.2, 4.8, 1.0,
  'unit', '200ml (1 vaso)', '1 vaso (200ml)', 200,
  88, 6.4, 9.6, 2.0,
  'https://ardiaprod.vteximg.com.br/arquivos/ids/343522/Leche-Parcialmente-Descremada-1-La-Serenisima-Botella-1-Lt-_1.jpg',
  'approved'
),
(
  '7790742333605',
  'Leche Descremada 0% La Serenísima Botella Azul 1 Lt',
  'LA SERENISIMA',
  'Lácteos y Huevos',
  35, 3.3, 4.9, 0.1,
  'unit', '200ml (1 vaso)', '1 vaso (200ml)', 200,
  70, 6.6, 9.8, 0.2,
  'https://ardiaprod.vteximg.com.br/arquivos/ids/343520/Leche-Descremada-0-La-Serenisima-Botella-1-Lt-_1.jpg',
  'approved'
)
ON CONFLICT (barcode) DO UPDATE SET
  image = EXCLUDED.image,
  name = EXCLUDED.name,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fats = EXCLUDED.fats,
  unit_calories = EXCLUDED.unit_calories,
  unit_protein = EXCLUDED.unit_protein,
  unit_carbs = EXCLUDED.unit_carbs,
  unit_fats = EXCLUDED.unit_fats;

