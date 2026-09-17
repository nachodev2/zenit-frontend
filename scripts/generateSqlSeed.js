const fs = require('fs');
const path = require('path');
const { POPULAR_ARGENTINE_PRODUCTS } = require('../src/data/argentineProducts');

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  return "'" + String(val).replace(/'/g, "''") + "'";
}

const values = POPULAR_ARGENTINE_PRODUCTS.map((p) => {
  return `(${esc(p.barcode)}, ${esc(p.name)}, ${esc(p.brand)}, ${esc(p.category || 'Alimento')}, ${p.calories || 0}, ${p.protein || 0}, ${p.carbs || 0}, ${p.fats || 0}, ${esc(p.defaultPortionType || 'unit')}, ${esc(p.servingSize)}, ${esc(p.unitName)}, ${p.unitGrams || 100}, ${p.unitCalories != null ? p.unitCalories : 'NULL'}, ${p.unitProtein != null ? p.unitProtein : 'NULL'}, ${p.unitCarbs != null ? p.unitCarbs : 'NULL'}, ${p.unitFats != null ? p.unitFats : 'NULL'}, ${esc(p.image)}, 'approved')`;
}).join(',\n');

const sql = `-- =================================================================
-- CARGA MASIVA DE ALIMENTOS ARGENTINOS ZENIT (107 PRODUCTOS)
-- =================================================================

INSERT INTO public.foods (
  barcode, name, brand, category,
  calories, protein, carbs, fats,
  default_portion_type, serving_size, unit_name, unit_grams,
  unit_calories, unit_protein, unit_carbs, unit_fats,
  image, status
) VALUES
${values}
ON CONFLICT (barcode) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fats = EXCLUDED.fats,
  default_portion_type = EXCLUDED.default_portion_type,
  serving_size = EXCLUDED.serving_size,
  unit_name = EXCLUDED.unit_name,
  unit_grams = EXCLUDED.unit_grams,
  unit_calories = EXCLUDED.unit_calories,
  unit_protein = EXCLUDED.unit_protein,
  unit_carbs = EXCLUDED.unit_carbs,
  unit_fats = EXCLUDED.unit_fats,
  image = EXCLUDED.image,
  status = 'approved';
`;

fs.writeFileSync(path.resolve(__dirname, 'seed_foods.sql'), sql, 'utf8');
console.log('✅ Archivo scripts/seed_foods.sql generado con éxito.');

