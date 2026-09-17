# 📋 Zenit - Checklist de Pendientes y Refinamientos

Documento centralizado para registrar ajustes finos, ideas de pulido visual y detalles técnicos para revisar en futuras iteraciones. Organizado por sección, agrupando tanto tareas completadas como tareas a realizar.

---

## 📸 Foto Asistida (`GuidedScanScreen` / `GuidedQuestionsOverlay`)

### ✅ Completadas
- [x] Flujo wizard de 3 preguntas guiadas (Nombre, Cocción, Porción) con validaciones
- [x] Bloqueo síncrono del disparador (`useRef`) para evitar fotos encoladas en ráfaga al pulsar repetidas veces
- [x] Persistencia del `TextInput` y teclado entre pasos sin rebotes ni desmontajes bruscos
- [x] Fondo 100% opaco y sellado del notch inferior de gestos en Android
- [x] Validaciones de navegación de retroceso (Gestos Android/iOS, `beforeRemove`, paso a paso 3➔2➔1)
- [x] Diálogos de confirmación antes de descartar fotos o cancelar análisis de IA

### 📌 Pendientes / Por revisar
- [ ] Revisión final de prompts a Gemini Vision en casos de comidas con muchos ingredientes

---

## 💧 Hidratación (`WaterTrackerScreen.js` / `WaterTrackerCard.js`)

### ✅ Completadas
- [x] Card de hidratación ultra limpia, minimalista y soft integrada en el tablero 2x2
- [x] Animación de llenado líquido progresivo con oleaje SVG continuo al fondo de la card
- [x] Atajo táctil Long Press (360ms) para sumar +250ml directamente desde la card con feedback elástico y háptico
- [x] Micro-celebración visual y háptica al alcanzar el 100% de la meta (manteniendo agua azul natural, logo de agua en verde y texto '100% completado')
- [x] Reseteo automático a medianoche (00:00 hs) con archivado del día anterior en el historial
- [x] Pantalla completa de tracking (`WaterTrackerScreen.js`) con presets (+150ml mate a +1000ml botella), ajuste manual y cambio de meta diaria
- [x] Sistema de recordatorios de agua periódicos con notificaciones nativas al teléfono (`expo-notifications` + `WaterReminderModal.js`) con selector de frecuencia y prueba inmediata
- [x] Corrección de espaciados y márgenes limpios en el bloque de recordatorios

### 📌 Pendientes / Por revisar
- [ ] Sugerencia inteligente de hidratación (+500ml) conectada al completar una rutina en `GymScreen`

---

## 📱 HomeScreen (`HomeScreen.js`)

### ✅ Completadas
- [x] Card de ancho completo (100%) para **"Registro de peso"** (`WeightHeroCard.js`): ubicada arriba del tablero 2x2, muestra progreso fáctico de solo lectura (peso actual, objetivo, barra de avance, datos de pesaje semanal) sin edición manual ni referencias a báscula/smarthub
- [x] Tablero modular 2x2 en el día actual (`GuidedScanCard`, `GymActivityCard`, `WaterTrackerCard`, `SmartHealthCard`)
- [x] Navegación directa de las 4 cards hacia pantallas completas (sin modales bottom-sheet invasivas)

### 📌 Pendientes / Por revisar
- [ ] Calendario interactivo deslizable (Swipe horizontal): implementar gestos de deslizamiento lateral para navegar semanas en la miniatura (`WeekCalendar.js`) y entre meses/semanas en la vista expandida (`FullCalendarModal.js`)
- [ ] Revisar y validar todas las vistas de estado del HomeScreen:
  - Vista actual (día de hoy en progreso)
  - Día no registrado (sin comidas cargadas)
  - Día completado (macros en objetivo)
  - Día excedido (superó calorías/macros)
  - Día insuficiente (déficit extremo o incompleto)
- [ ] Card de Ejercicios (`GymActivityCard.js`): refinar y sincronizar los datos una vez que esté 100% finalizada la pantalla `GymScreen`
- [ ] Última sección del HomeScreen - Galería Visual de Fotos Diarias (`VisualGallery.js`): terminar la lógica de persistencia, almacenamiento local/nube y visualización de las fotos de los platos registrados en el día (desayuno, almuerzo, merienda, cena)

---

## 🏋️ Gym & Actividad (`GymScreen.js` / `GymActivityCard.js`)

### ✅ Completadas
- [x] Navegación dedicada hacia la pantalla de Gym desde el tablero y el navbar

### 📌 Pendientes / Por revisar
- [ ] Finalizar primero el desarrollo de la pantalla completa `GymScreen.js` (rutinas, ejercicios, sets, tracking)
- [ ] Conectar y atacar la card de ejercicios (`GymActivityCard.js` en HomeScreen) tras finalizar `GymScreen`

---

## ⚖️ Registro de Peso & Métricas Fácticas (`WeightTrackerScreen.js` / `WeightHeroCard.js` / `SmartHealthCard.js`)

### ✅ Completadas
- [x] Card de ancho completo de **"Registro de peso"** en HomeScreen (`WeightHeroCard.js`): estrictamente fáctica y de solo lectura (valores inmutables desde la card, actualizables únicamente por pesaje semanal)
- [x] Pantalla completa de **"Detalles del Pesaje"** (`WeightTrackerScreen.js`) inspirada en OKOK: hero con barra de rango segmentada, comparativa vs última vez y vs meta, 14 métricas corporales fácticas de bioimpedancia con modal de interpretación de salud, pestaña de historial cronológico y registro de pesaje semanal con recálculo automático

### 📌 Pendientes / Por revisar
- [ ] Integración Bluetooth BLE con Báscula Física: configuración de permisos nativos (`react-native-ble-plx`), scanner de tramas BLE, parser de datos de pesaje/impedancia con la báscula de testing física
- [ ] Card de Smart Hub (`SmartHealthCard.js` en el tablero 2x2): se tocará y refinará una vez que desarrollemos el módulo de conectividad / dispositivos Bluetooth en las configuraciones de la app
- [ ] Flujo de pesaje semanal: registrar la medición periódica fija (datos fácticos de peso, masa muscular, % grasa) que alimentará automáticamente la card de "Registro de peso"

---

## 🚀 Onboarding & Cálculo Nutricional Inteligente (Refactorización Futura)

### 📌 Hoja de Ruta del Flujo (Cranear e implementar a futuro):
1. **Objetivo Principal**:
   - Preguntar meta de entrada: *Perder grasa* • *Ganar músculo* • *Mantener peso*.
2. **Método Deseado**:
   - Elección de enfoque: *Plan nutricional guiado* vs. *Contar calorías y macros libremente*.
3. **Datos Biométricos ("Sobre Ti")**:
   - Pasos individuales y fluidos: Sexo biológico, edad, altura y peso actual.
4. **Nivel de Actividad Diaria**:
   - Escala: *Sedentario* • *Ligeramente activo* • *Moderadamente activo* • *Muy activo* • *Atleta profesional*.
   - Diseño 100% responsive que se adapte perfectamente a cualquier resolución de pantalla.
5. **Entrenamiento de Fuerza (Clave para Proteínas)**:
   - Preguntar explícitamente si realiza entrenamiento de fuerza ("desafiar músculos con pesas, bandas elásticas o propio peso corporal").
   - Explicación pedagógica en pantalla: es el factor determinante para calcular el ratio óptimo de gramos de proteína por kg de peso corporal.
6. **Preferencia / Tipo de Dieta**:
   - Selector visual: *Recomendada (Balanceada)* • *Alta en Proteínas* • *Baja en Carbohidratos (Low Carb)* • *Keto (Cetogénica)* • *Baja en Grasas (Low Fat)*.
7. **Personalización de Meta & Velocidad (Pace)**:
   - Peso actual ➔ Peso objetivo.
   - Velocidad de progreso con pros/contras claros:
     - **Recomendado / Óptimo**: Gran pérdida de grasa preservando al 100% la masa muscular, alimentación sostenible y resultados visibles a mediano plazo.
     - **Rápido**: Mayor déficit, resultados más veloces pero más restrictivo y con ligero riesgo de pérdida de masa magra/ósea si es muy agresivo.
     - **Lento / Flexible**: Alimentación flexible y menos restrictiva, favoreciendo el desarrollo de masa muscular y recomposición corporal con fuerza.
8. **Periodización Dinámica (Déficit / Superávit Progresivo)**:
   - Indagar a fondo el objetivo para iniciar con un déficit/superávit moderado y ajustar automáticamente las calorías semana a semana según los registros fácticos de la báscula.

### 💡 Recomendaciones para máxima precisión y conexión con la app:
- [ ] **Alimentar todo el Store de entrada**: Que el Onboarding inicialice inmediatamente `weightTracker` (peso actual, peso objetivo, IMC) para que la card del Home nazca viva sin valores mock.
- [ ] **Cálculo de Hidratación Personalizada**: Establecer la meta diaria de agua en `useUserStore` automáticamente en base a la fórmula: `(Peso actual en kg × 35 ml) + extra por nivel de actividad`.
- [ ] **Estimación de Fecha Meta**: Mostrar al finalizar el Onboarding una fecha estimada y realista de llegada al objetivo basada en el ritmo semanal elegido (ej. *"Alcanzarás tus 78 kg aproximadamente el 14 de Noviembre"*).
- [ ] **Cálculo con Masa Magra (Katch-McArdle)**: Priorizar fórmulas sobre masa libre de grasa para evitar inflar calorías en personas con sobrepeso o subestimar en personas musculosas.

---

## ⚙️ Configuración, Perfil y Store (`useUserStore.js`)

### ✅ Completadas
- [x] Persistencia de hidratación diaria, historial, recordatorios de agua y límites de escaneo
- [x] Rollover automático a medianoche para reseteo diario de agua y cuotas

### 📌 Pendientes / Por revisar
- [ ] Revisar persistencia de metas nutricionales y sincronización en la nube (Supabase)

---

## 🍗 Alimentos, Recetas y Favoritos (`FoodScreen.js`)

### ✅ Completadas
- [x] **Reemplazo de icono en barra de navegación**: Cambiado icono de lupa (`Search`) por patita de pollo (`Drumstick` de Lucide) en el navbar principal tanto en `App.js` como en `src/screens/_layout.js`.
- [x] **Estructura en 3 pestañas segmentadas**:
  1. **`Productos`**: Catálogo y buscador en tiempo real conectado con la API abierta Open Food Facts Argentina + fallback exhaustivo de productos locales (La Serenísima, Arcor, Granix, Lucchetti, etc.).
  2. **`Mis recetas`**: Creador dinámico de recetas compuestas con cálculo automático de macros totales (Kcal, Proteínas, Carbohidratos, Grasas) y botón de registro directo al día en 1 toque.
  3. **`Favoritos`**: Muro visual de platos y alimentos marcados con corazón (❤️) sincronizados desde `ScanScreen` y el buscador de comidas.
- [x] **Cards de productos limpias y 100% visuales**: Tarjetas en cuadrícula tipo e-commerce / catálogo Apple mostrando únicamente la foto de alta calidad del producto, nombre y marca (sin saturar con macros en la card).
- [x] **Modal interactiva de detalle de producto con Selector Inteligente (Unidad vs. Gramos)**:
  - **Modo Por Envase / Unidad**: Si seleccionás Monster, alfajores, yogures, huevos o snacks, arranca en **"1 lata (473ml)"**, **"1 alfajor (55g)"**, **"1 pote (120g)"** o **"1 unidad"** con sus macros totales por envase ya calculados, con selector de unidades (`[-] 1 [+]` para 1, 2 o 3 latas/unidades).
  - **Modo Pesar en Gramos (g)**: Pestaña para alternar al instante si el usuario pesa la comida en báscula (arroz, pollo, avena) con selector numérico y chips rápidos (50g, 100g, 150g, 200g).
  - 4 cards visuales de macronutrientes (Kcal, Proteínas, Carbos, Grasas) que se recalculan en tiempo real según la unidad o peso seleccionado.
  - Los dos botones de acción: *"Sumar a la ingesta de mi día"* (con `ZENIT_GRADIENT`) y *"Agregar a una receta"* (con icono de recetario/carrito).
- [x] **Carro de compras de recetas (E-commerce Style)**:
  - Barra flotante inferior en tiempo real que aparece al tener 1 o más productos en la receta (`🛒 X ingredientes • X kcal • Xg Prot`), permitiendo abrir el carrito en cualquier momento.
  - Modal del carrito con ajuste dinámico de gramos por ingrediente (`+` / `-`), botón para eliminar ítems (`Trash2`), cálculo automático de macros totales acumulados y dos opciones de guardado (*"Guardar en Mis Recetas"* o *"Guardar y Consumir Hoy"*).
- [x] **Integración con Open Food Facts & Catálogo Argentino**: Imágenes apetitosas precargadas para productos nacionales masivos (La Serenísima, Lucchetti, Arcor, Granix, Gallo, Quaker, etc.).
- [x] **Alineación 100% con `DESIGN_SYSTEM.md`**: Implementación canónica del **Anillo Hero Kcal (`#DC2626` ➔ `#F97316`)**, el **Trío de Sub-anillos (`PROT`, `CARB`, `GRASA`)**, la **Píldora Inteligente de IA (`SmartInsightCapsule` en `#0F172A`)** y los botones primarios con sombra cálida.

### ✅ Completadas
- [x] **Conexión de escáner de código de barras físico con cámara**: Integrado directamente en el escáner nativo (`ScanScreen`) con alternador *Foto IA / Código de Barras*, detección automática y apertura de modal de resultado idéntica a Gemini.
- [x] **Modo Predeterminado Zenit AI y Reset**: Cada vez que el usuario vuelve o toca el escáner, se resetea automáticamente a Foto IA.
- [x] **Cuotas del Zenit Coach**: 8 interacciones diarias compartidas (de hasta 4 mensajes cada una) entre alimentos analizados con IA y códigos de barras.
- [x] **Código de barras ilimitado**: Escaneo libre sin consumo de cupo diario de escaneos IA.

### 📌 Pendientes / Por revisar
- [ ] Marcado de favoritos directo desde `FoodScreen` para recetas propias.

---

## 🗄️ Base de Datos, Motor de Búsqueda y Catálogo de Alimentos (Supabase & Cloud)

### ✅ Completadas (Fase 1 - Catálogo Maestro `foods` para FoodScreen)
- [x] **0. Carga Masiva y Ampliación del Catálogo de Alimentos Argentinos (`POPULAR_ARGENTINE_PRODUCTS`)**:
  - Incorporación de 107 productos nacionales habituales (La Serenísima, Ilolay, Granix, Traviata, Don Satur, Lucchetti, Matarazzo, Havanna, Jorgito, Guaymallén, Monster, etc.).
  - Deduplicados con códigos de barras reales EAN-13.
  - Normalización precisa de porciones (`defaultPortionType: 'unit' | 'grams'`).
- [x] **1. Estandarización y Calidad Visual de Imágenes**:
  - Fotos de calidad e-commerce uniforme (`resizeMode="contain"` con fondo neutro sin mutilación).
  - Conversión automática a alta resolución `.400.jpg` (`toHighResImage`).
- [x] **2. Búsqueda Flexible y Tolerante a Errores (Fuzzy & Token Search)**:
  - Normalización de tildes/acentos, eliminación de stopwords (`el`, `la`, `los`, `de`, `del`).
  - Búsqueda por palabras clave independientes del orden.
- [x] **3. Optimización Drástica de Velocidad de Búsqueda**:
  - Debounce optimizado (280ms) y cancelación HTTP con `AbortController`.
  - Caché local en memoria (`SEARCH_CACHE`) para consultas en 0ms.
- [x] **4. Estado Vacío Amigable (Empty State)**:
  - Leyenda oficial: *"No hay productos disponibles de acuerdo a tu búsqueda"*.
  - Botón CTA *"Dar de alta este producto"* con degradado Zenit oficial y autocompletado del nombre.
- [x] **5. Arquitectura de Cliente Supabase (`src/services/supabaseClient.js`)**:
  - Cliente seguro con validación de entorno `isSupabaseConfigured` y fallback tolerante a fallos.
- [x] **6. Arquitectura 100% Propietaria Zenit (Eliminación Completa de Open Food Facts)**:
  - Eliminación total de consultas externas a Open Food Facts en búsqueda y escáner para erradicar fotos caseras, envases vacíos y productos desordenados o extranjeros.
  - El buscador responde únicamente desde catálogo local verificado (Tier 1) y Supabase privado (Tier 2).
  - Ordenamiento inteligente de presentaciones por volumen/gramaje ascendente para una misma marca/producto (ej: Coca-Cola de 220ml mini lata a 3L familiar).
  - Códigos no encontrados retornan `null` y abren el formulario de registro para enviar a la cola de moderación del administrador (`status: 'pending'`).
- [x] **7. Cosecha Masiva de Góndolas Argentinas con Fotos de Estudio HD (`scripts/scrapeSupermarketsAr.js`)**:
  - Crawler exhaustivo conectado a las góndolas de Día Online / VTEX (Gaseosas, Aguas, Cervezas, Lácteos, Quesos, Galletitas, Golosinas, Pastas, etc.).
  - Motor de resolución bromatológica calibrado con precedencia estricta para evitar falsos positivos.
  - **1.329 alimentos de consumo nacional masivo** con fotos oficiales de estudio sobre fondo blanco impoluto y códigos EAN-13 listos en `scripts/supermarkets_argentina_seed.sql`.
- [x] **8. Familia Completa de Coca-Cola Calibrada (220ml a 3L)**:
  - Incorporación en catálogo local de todas las presentaciones comerciales de Coca-Cola Sabor Original (220ml, 354ml, 500ml, 600ml, 1.25L, 1.5L, 2.25L, 3L) y Coca-Cola Sin Azúcar (220ml, 354ml, 500ml, 600ml, 1.5L, 2.25L) con fotos de estudio HD y escalado matemático exacto de macros.
- [x] **9. Renovación de Frescos & Orgánicos con Fotos de Estudio**:
  - Reemplazo de fotos genéricas con fondo de Unsplash en el catálogo local por packshots oficiales de estudio sobre fondo blanco para alimentos naturales (Banana Fresca, Pechuga de Pollo Granja, Huevos Blancos Maple, Palta Hass, Manzana Roja, Tomate Redondo, Bife de Chorizo, Carne Picada Magra, Filet de Merluza, Medialunas de Manteca).
- [x] **10. Cosecha Fitness, Orgánicos e Importados de Jumbo & Carrefour (`scripts/crawlJumboCarrefour.js`)**:
  - Integración de los catálogos premium de Jumbo y Carrefour (Suplementos Whey, Creatina, Barras Proteicas, Leches Vegetales Silk/NotCo, Línea Sin TACC, Carrefour Bio, Chocolates Lindt, Pastas Barilla).
  - Deduplicación estricta contra catálogo local y Día Online: **389 productos nuevos únicos** (alcanzando 1.718 alimentos de supermercado con fotos HD de estudio en `scripts/jumbo_carrefour_seed.sql`).
- [x] **11. Catálogo Maestro Consolidado Único de Supermercados (`scripts/buildMasterCatalogSeed.js` ➔ `scripts/zenit_master_foods_seed.sql`)**:
  - Unificación integral de todas las fuentes en un **único archivo SQL maestro** listo para inyectar en Supabase en un solo clic:
    - **119** productos locales calibrados de oro (Coca-Cola completa, Serenísima, Havanna, Monster, etc.).
    - **1.306** productos de Día Online.
    - **1.698** productos de Jumbo Argentina (Almacén, Carnes, Pescados, Quesos, Lácteos, Congelados, Frutas, Pastas Frescas, Fitness).
    - **500** productos de Carrefour Argentina (Bio, Sin Gluten, Desayuno, etc.).
  - **3.611 productos únicos de alimentos y bebidas** con fotos de estudio HD sobre fondo blanco puro, porciones bromatológicas calibradas y filtro estricto de higiene (cero no comestibles, cero duplicados).
  - Buscador PostgREST optimizado para búsquedas multi-término (`"coca zero"`, `"leche descremada"`).

---

### 📌 Pendientes / Base de Datos a Futuro (Fase 2 - Arquitectura Maestra)
- [ ] **1. Tabla `profiles` (Usuarios & Metas Nutricionales)**:
  - Sincronización en la nube de perfil, sexo biológico, edad, altura, peso actual, peso meta y macros diarios calculados (`calories`, `protein`, `carbs`, `fats`).
- [ ] **2. Tabla `daily_meals` (Registro Diario de Ingesta)**:
  - Almacenar en la nube qué comió el usuario cada día, fecha/hora, tipo de comida (desayuno, almuerzo, merienda, cena), porción consumida y referencia `food_id`.
- [ ] **3. Tablas `custom_recipes` y `recipe_ingredients` (Recetario Casero)**:
  - Guardar recetas compuestas creadas por el usuario desde el carro de compras de `FoodScreen` y relacionar sus ingredientes de catálogo.
- [ ] **4. Tabla `weight_logs` (Historial de Pesaje & Bioimpedancia)**:
  - Persistencia de los 14 parámetros corporales del pesaje semanal registrados en `WeightTrackerScreen.js`.
- [ ] **5. Tabla `water_logs` (Historial de Hidratación)**:
  - Registro histórico del consumo de agua diario y cumplimiento de metas.
- [ ] **6. Carga Comunitaria & Panel de Administración (Moderación)**:
  - Flujo para que productos creados por usuarios suban con `status: 'pending'`.
  - Panel o módulo de administración con rol `admin` para revisar, aprobar o rechazar alimentos antes de que sean públicos.
- [ ] **7. Estrategia Offline-First & Sincronización Bidireccional**:
  - Capa de sincronización automática en background entre Zustand / AsyncStorage y Supabase al recuperar conectividad a internet.

---

## 🎨 UI / UX General, Sonidos & Animaciones

### ✅ Completadas
- [x] Estandarización de paleta Zenit (`ZENIT_GRADIENT`, `#F97316`, `#0284C7`, `#10B981`)
- [x] Curvas de animación suaves con `Easing.out(Easing.cubic)` (sin rebotes rígidos)

### 📌 Pendientes / Por revisar
- [ ] Pulido de micro-interacciones hápticas globales
