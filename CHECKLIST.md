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

## 🎨 UI / UX General, Sonidos & Animaciones

### ✅ Completadas
- [x] Estandarización de paleta Zenit (`ZENIT_GRADIENT`, `#F97316`, `#0284C7`, `#10B981`)
- [x] Curvas de animación suaves con `Easing.out(Easing.cubic)` (sin rebotes rígidos)

### 📌 Pendientes / Por revisar
- [ ] Pulido de micro-interacciones hápticas globales
