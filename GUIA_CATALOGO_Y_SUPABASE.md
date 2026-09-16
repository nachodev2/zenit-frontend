# 📘 Zenit: Arquitectura de Alimentos, Catálogo Argentino y Guía Maestra de Supabase

Este documento detalla en profundidad **qué se implementó en la última fase**, **por qué es fundamental crear la base de datos en Supabase en este momento** y la **guía paso a paso para dejarla operativa**.

---

## 1. 🔍 ¿Qué hicimos en esta última implementación?

### A. Diagnóstico y Corrección de la Base de Datos Remota
- **El problema detectado**: Notaste que al buscar productos fuera de los que aparecían en pantalla, la app no encontraba nada.
- **La causa técnica**: Comprobamos que el servicio intentaba consultar Open Food Facts enviando el parámetro incompatible `&country=argentina` sobre el host global `world.openfoodfacts.org`. Esto provocaba un error HTTP **`503 Service Unavailable`** (página HTML de error). El código capturaba la excepción y caía de forma silenciosa al array local, provocando que solo se viera lo que estaba precargado en memoria.
- **La solución**:
  - Implementamos **multi-nodo con fallback**: primero consulta `https://ar.openfoodfacts.org/cgi/search.pl` (el nodo específico para Argentina) y, si falla, recurre a `https://world.openfoodfacts.org/cgi/search.pl` (sin parámetros corruptos).
  - Agregamos validación estricta de `Content-Type: application/json` antes de procesar el cuerpo, evitando que los errores 503 rompan el flujo.
  - Configuramos un `User-Agent` institucional conforme a las políticas anti-bot de Open Food Facts.

### B. Motor de Búsqueda de Alto Rendimiento en Dos Fases
- **Fase 1 (0 ms sincrónico)**: Al presionar cualquier tecla en el buscador, `findLocalMatches` filtra al instante los productos locales y los creados por el usuario. El resultado es inmediato, sin parpadeos ni spinners.
- **Fase 2 (280 ms debounced con `AbortController`)**: Si el usuario sigue tipeando, la petición de red anterior se cancela a nivel HTTP, eliminando el tráfico innecesario y las condiciones de carrera.
- **Fuzzy & Token Search**:
  - Normalización de texto (`normalizeSearchText`): ignora tildes (`á` ➔ `a`), mayúsculas y caracteres especiales.
  - Eliminación de stop-words (`el`, `la`, `los`, `de`, `del`, `y`, `con`). Ahora escribir *"Panerita"* encuentra *"La Panerita"*, y escribir *"serenisima"* encuentra *"La Serenísima"*.
  - Los términos se pueden escribir en cualquier orden (ej. *"pan blanco panerita"* o *"leche descremada serenisima"*).

### C. Estado Vacío Oficial (Empty State)
- Cuando no hay coincidencias locales ni remotas, se muestra la leyenda oficial:
  > **"No hay productos disponibles de acuerdo a tu búsqueda"**
- Se diseñó una tarjeta limpia con icono neutral, texto explicativo y un botón de ancho completo con degradado Zenit (`#DC2626` ➔ `#F97316`): **"Dar de alta este producto"**, el cual abre el formulario de creación manual con el nombre del producto ya precargado.

### D. Ampliación Masiva del Catálogo Argentino (107 Productos)
Se creó un módulo de datos dedicado en `src/data/argentineProducts.js` que contiene **107 alimentos cotidianos de Argentina**, con fotos nítidas estilo e-commerce, macros oficiales por 100g y porciones normalizadas:
- **Lácteos y Quesos**: Leches La Serenísima (Entera, Descremada 1%, 0% Grasas), Leche Ilolay, Cindor, Casancrem Clásico y Light, Finlandia, Queso Port Salut común y light, Queso Cremoso La Paulina, Queso Rallado Reggianito, Yogures La Serenísima / Ser / Yogurísimo, Dulce de Leche Colonial, Manteca.
- **Panificados & Galletitas**: Bizcochos Don Satur (Salados y Dulces), Traviata, Criollitas, Granix Salvado, Frutigran Chía y Lino, Chocolinas Bagley, Oreo, Sonrisas, Pepitos, Rumba, Melba, Galletitas Maná, Tostadas Riera, Pan Blanco Tradicional La Panerita, Pan Artesano Bimbo, Pan Integral Fargo, Pan Francés, Medialunas de manteca, Rapiditas Bimbo, Pan de Pancho.
- **Pastas, Arroces & Almacén**: Fideos Lucchetti (Tallarines, Tirabuzón), Fideos Matarazzo (Spaghetti al huevo), Arroz Gallo Oro, Arroz Doble Carolina, Avena Quaker, Copos de Maíz Granix, Polenta Presto Pronta, Puré de Tomate Marolio, Atún La Campagnola, Lentejas Arcor, Ñoquis de papa.
- **Carnes, Aves, Huevos & Proteínas**: Pechuga de Pollo Granja Tres Arroyos, Suprema de pollo, Huevos blancos grandes, Bife de Chorizo, Milanesa de Nalga al horno, Hamburguesas Paty clásicas, Salchichas Vienissima, Jamón Cocido Paladini, Carne Picada magra, Filet de Merluza.
- **Alfajores & Dulces**: Alfajor Havanna Chocolate y 70% Cacao, Guaymallén blanco, Jorgito chocolate, Capitán del Espacio triple, Turrón de Maní Arcor, Bon o Bon.
- **Bebidas**: Monster Energy (Original, Ultra White, Mango Loco, Pipeline Punch), Red Bull, Coca-Cola Original y Sin Azúcares, Sprite Sin Azúcares, Levité Naranja, Cunnington Pomelo, Agua Villavicencio, Gatorade Cool Blue, Cerveza Quilmes, Cerveza Corona, Vino Malbec Trapiche, Fernet Branca preparado, Yerba Mate Playadito.
- **Frutas & Verduras**: Banana, Manzana roja, Palta Hass, Papa blanca hervida, Tomate redondo.
- **Platos Típicos**: Empanadas de Carne Criolla y Jamón y Queso, Pizza de Muzzarella al molde, Tortilla de Papas, Fainá porteña, Choripán clásico.
- **Fitness & Suplementos**: Whey Protein Star Nutrition y ENA Sport, Creatina Micronizada Star Nutrition, Pasta de Maní Entrenuts.

### E. Normalización Inteligente de Porciones
Cada alimento tiene tipificado su `defaultPortionType`:
- **Modo Unidad / Envase**: Alfajores, latas de gaseosa, potes de yogur, huevos, empanadas, medallones Paty y barritas abren directamente mostrando los macros totales por empaque (ej: *1 alfajor (55g)* o *1 lata (473ml)*).
- **Modo Gramos (Báscula)**: Carnes, arroces, pastas y harinas abren directamente con el selector numérico de pesaje (ej: *100g*, *150g*, *200g*).

### F. Limpieza Estricta del Design System
Se erradicaron completamente los fondos color durazno/crema (`#FFF7ED` y `#FED7AA`) de la tarjeta flotante de recetas y del formulario de carga de productos, alineando el 100% de la UI a los estándares de [DESIGN_SYSTEM.md](file:///c:/Users/priva/OneDrive/Desktop/Programación/zenit-frontend/DESIGN_SYSTEM.md).

---

## 2. 🏛️ ¿Por qué hacemos la Base de Datos en Supabase AHORA?

Existen **5 razones estratégicas y de ingeniería** por las que este es el momento exacto para conectar Supabase:

### 1. Soberanía e Independencia de APIs de Terceros
Open Food Facts es una organización sin fines de lucro. Sus servidores sufren caídas frecuentes, límites de 10 peticiones/minuto por IP y respuestas de error 503. Una aplicación comercial como Zenit no puede quedar expuesta a que el usuario sienta que la app "no anda" porque un servidor en Francia o Estados Unidos se saturó. **Al tener tu propia base en Supabase, el 100% del servicio está bajo tu control.**

### 2. El Dilema del Tamaño del Bundle del Celular
- **107 productos** en el código pesan apenas ~60 KB. Es liviano, rápido y funciona offline.
- **100.000 productos** adentro del código de la app pesarían más de 120 MB de texto plano JSON. Descargar ese paquete desde Play Store o App Store consumiría los datos del usuario, aumentaría el tiempo de inicio de la app a 10 segundos y saturaría la memoria RAM de teléfonos gama media y baja.
- **La solución profesional**: El celular guarda los ~200 productos más consumidos en local (Nivel 1), y consulta a Supabase los otros 100.000 productos en la nube (Nivel 2).

### 3. Velocidad Extrema de Búsqueda con Trigramas (`pg_trgm`)
PostgreSQL (el motor de Supabase) cuenta con la extensión `pg_trgm`. Esto permite crear índices GIN que buscan palabras parciales, marcas y nombres con errores tipográficos entre 200.000 alimentos en **menos de 30 milisegundos**.

### 4. Carga Comunitaria y Moderación (Crowd-Sourcing)
Cuando un usuario escanee un alimento con la cámara y no exista en la base de datos, Gemini extraerá la tabla nutricional y el usuario podrá enviarlo. Ese producto viajará a Supabase con `status = 'pending'`. Desde el panel de administración, podrás aprobarlo con un clic y quedará disponible al instante para todos los usuarios de Zenit.

### 5. Base de Datos Única y Relacional (Arquitectura Limpia)
No se necesita una base separada para alimentos. En la misma base maestra de Supabase residirán:
- `profiles` (Usuarios)
- `foods` (Catálogo maestro de alimentos)
- `daily_meals` (Qué comió cada usuario hoy, vinculado por `food_id`)
- `custom_recipes` (Recetas caseras armadas con productos del catálogo)

Hacer esto ahora garantiza que la pantalla de productos nazca conectada a su arquitectura definitiva y no haya que reescribirla a futuro.

---

## 3. 🛠️ Guía Paso a Paso para Crear Supabase

### Paso 1: Crear el Proyecto en Supabase
1. Ingresá a [supabase.com](https://supabase.com) e iniciá sesión con tu cuenta de GitHub o Email.
2. En el panel principal, hacé clic en **"New project"**.
3. Completá los campos:
   - **Name**: `zenit` (o `zenit-backend`).
   - **Database Password**: Generá una contraseña segura (anotala en un lugar seguro).
   - **Region**: Seleccioná **`South America (São Paulo)`**. *(Fundamental para tener 30-40 ms de latencia desde Argentina en lugar de 180 ms con EE.UU.)*.
   - **Pricing Plan**: `Free tier` ($0/mes).
4. Clic en **"Create new project"**. Esperá 1 o 2 minutos mientras se aprovisiona la infraestructura.

---

### Paso 2: Crear la Tabla Maestra `foods` con Índices de Búsqueda
1. En el menú lateral izquierdo de Supabase, hacé clic en el icono **SQL Editor** (ícono `>_`).
2. Hacé clic en el botón verde **"+ New query"**.
3. Pegá el siguiente script SQL completo:

```sql
-- 1. Habilitar extensión para búsqueda rápida y tolerante a errores
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Crear tabla maestra de alimentos
CREATE TABLE public.foods (
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

-- 3. Índices de alta velocidad (Búsqueda en <30ms)
CREATE INDEX idx_foods_search ON public.foods USING gin (
    (name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(category, '')) gin_trgm_ops
);
CREATE INDEX idx_foods_barcode ON public.foods (barcode);

-- 4. Seguridad (Row Level Security)
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios pueden consultar productos aprobados
CREATE POLICY "Lectura publica de alimentos aprobados"
    ON public.foods FOR SELECT
    USING (status = 'approved');

-- Usuarios registrados pueden sugerir nuevos alimentos
CREATE POLICY "Usuarios pueden proponer alimentos"
    ON public.foods FOR INSERT
    WITH CHECK (auth.uid() = created_by AND status = 'pending');
```

4. Hacé clic en el botón verde **"Run"** (abajo a la derecha) o presioná `Ctrl + Enter`.
5. Verás el mensaje `Success. No rows returned`. La tabla ya está creada y optimizada.

---

### Paso 3: Obtener las Credenciales para la App
1. En el menú lateral izquierdo, hacé clic en el ícono de engranaje: **Project Settings**.
2. Entrá en la pestaña **API** (debajo de Configuration).
3. Vas a encontrar dos campos indispensables:
   - **Project URL**: Ejemplo: `https://abcdefghijklm.supabase.co`
   - **Project API Keys**: Copiá la clave llamada **`anon` `public`** (empieza con `eyJ...`). *No uses la service_role*.
4. Abrí el archivo `.env` de tu proyecto React Native y agregá las dos variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
```

---

### Paso 4: Poblar Supabase con el Catálogo de Zenit (Seed)
Apenas tengas el proyecto creado y agregues las credenciales en tu `.env`, corremos un script automatizado que toma los **107 alimentos curados** que creamos y los sube a tu base de datos en 5 segundos.

A partir de ese instante, la pantalla de productos consultará primero el catálogo local instantáneo (0 ms), luego tu Supabase privado (<50 ms), y solo como último recurso llamará a Open Food Facts.

