-- =================================================================
-- ZENIT - 4 PRODUCTOS ADICIONALES DE CALIDAD DE ESTUDIO
-- =================================================================

INSERT INTO public.foods (
  barcode, name, brand, category, calories, protein, carbs, fats, 
  default_portion_type, serving_size, unit_name, unit_grams, unit_calories, unit_protein, unit_carbs, unit_fats, image, status
) VALUES
('7790080021023', 'Dulce de Leche Colonial', 'La Serenísima', 'Lácteos', 315, 6.5, 55, 7.5, 'unit', '20g (1 cda)', '1 cucharada (20g)', 20, 63, 1.3, 11, 1.5, 'https://ardiaprod.vteximg.com.br/arquivos/ids/263300/Dulce-De-Leche-Colonial-La-Serenisima-400-Gr-_1.jpg', 'approved'),
('22140514001', 'Bife de Chorizo Vacuno Fresco', 'Carnicería Tradicional', 'Carnes & Proteínas', 198, 22, 0, 12, 'grams', '100g', '1 bife (250g)', 250, 495, 55, 0, 30, 'https://carrefourar.vteximg.com.br/arquivos/ids/919934/2301032000000_02.jpg', 'approved'),
('7798311000219', 'Milanesa de Merluza Rebozada', 'Cuisine & Co', 'Pescados y Mariscos', 145, 14, 12, 4.5, 'unit', '125g (1 unidad)', '1 unidad (125g)', 125, 181, 17.5, 15, 5.6, 'https://jumboargentina.vteximg.com.br/arquivos/ids/874136/Milanesa-De-Merluza-Congelada-Cuisine-Co-500g-1-3957.jpg', 'approved'),
('7790670051214', 'Pechuga de Pavo Cocida Feteada 150g', 'Campo Austral', 'Carnes & Proteínas', 95, 19, 1.5, 1.5, 'unit', '50g (3 fetas)', '3 fetas (50g)', 50, 48, 9.5, 0.8, 0.8, 'https://jumboargentina.vteximg.com.br/arquivos/ids/797072/Pechuga-De-Pavo-Campo-Austral-X-150-Gr-1-797072.jpg', 'approved')
ON CONFLICT (barcode) DO NOTHING;

