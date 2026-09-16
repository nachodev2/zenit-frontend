# 🎨 ZENIT DESIGN SYSTEM (Manual de Identidad & Guía Visual Canónica)

> **Regla Suprema de Zenit:**  
> Ninguna pantalla o componente nuevo debe improvisar estilos. La identidad visual de Zenit es limpia, premium, de alto contraste (blanco puro + negro azabache) y unificada por el **degradado ardiente Zenit (`#DC2626` ➔ `#F97316`)** como firma indiscutible de la marca.

---

## 1. 🔍 Desglose Anatómico de la Captura Canónica (El Corazón de Zenit)

La tarjeta central de macros resume a la perfección el lenguaje visual que debe permear el 100% de la aplicación:

```
┌────────────────────────────────────────────────────────┐
│                                                  [ ✎ ] │  <-- Acción sutil (Círculo #F8FAFC)
│                                                        │
│                    ╭─────────────╮                     │
│                 ╭──╯             ╰──╮                  │
│                │        2522        │                  │  <-- Número Titán (Negro #000, 42px, 900)
│                │        Kcal        │                  │  <-- Unidad Media (Gris #64748B, 18px, 600)
│                │     RESTANTES      │                  │  <-- Estado (Naranja #EA580C, 11px, 800, tracking)
│                 ╰──╮             ╭──╯                  │
│                    ╰─────────────╯                     │  <-- Anillo Hero Gradiente Zenit (Grosor 10-12)
│                                                        │
│        ╭─────╮          ╭─────╮          ╭─────╮       │
│       │ 141g  │        │ 393g  │        │  43g │       │  <-- Trío Sub-Anillos Gradiente Zenit
│       │ DISPO │        │ DISPO │        │ DISPO│       │  <-- Texto interno (Valor + estado naranja)
│        ╰─────╯          ╰─────╯          ╰─────╯       │
│         PROT             CARB            GRASA         │  <-- Etiquetas inferiores (Gris #94A3B8, 12px)
│                                                        │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ [✨]  Tarde ideal para un snack alto en proteínas. ┃ │  <-- Smart Capsule IA (Negro #0F172A, Pill)
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└────────────────────────────────────────────────────────┘
```

---

## 2. 🎯 Paleta Cromática Oficial

Zenit **NO** es un arcoíris. Todos los indicadores de meta y energía comparten la paleta unificada de fuego y vitalidad.

### Gradiente Oficial (El Fuego Zenit)
```javascript
export const ZENIT_GRADIENT = ['#DC2626', '#F97316'];
// Inicia en Rojo Fuego (#DC2626) y culmina en Naranja Radiante (#F97316)
// Dirección recomendada: Horizontal ({ x: 0, y: 0 } -> { x: 1, y: 0 })
// En anillos circulares: Gradiente angular continuo
```

### Fondos y Superficies
- **Fondo Base de la App:** `#FAFAFA` o `#F8FAFC` (Gris casi imperceptible que hace resaltar las tarjetas).
- **Tarjetas Principales (Cards):** `#FFFFFF` puro.
- **Bordes de Tarjetas:** `#F1F5F9` (1px, sutil, jamás negro ni gris pesado).
- **Superficies Secundarias (Inputs, Pills inactivas):** `#F8FAFC` o `#F1F5F9`.
- **Fondos de Acento Coloreados (PROHIBIDOS EN CARDS/BLOQUES):** Queda terminantemente prohibido rellenar tarjetas, selectores de porción o bloques de calorías con fondos anaranjados pastel o crema (`#FFF7ED` / `#FED7AA`). Para contrastar con el fondo, se usa el fondo nativo del contenedor (`#FFFFFF` o `#0F172A`) enmarcado con el **borde en LinearGradient Zenit**.

### Tipografía y Contraste (Regla Bimodal Estricta)
- **Títulos Importantes y Rótulos de Destacado:** `#EA580C` o `#F97316` (Naranja ardiente Zenit para destacar jerarquía clave).
- **Métricas Primarias y Números:** `#0F172A` / `#000000` en Modo Claro y `#FFFFFF` en Modo Oscuro (contraste puro, nunca gris lavado).
- **Textos Generales y Subtítulos:** Estrictamente **Negro** (`#0F172A` / `#475569`) en Modo Claro o **Blanco** (`#FFFFFF` / `#CBD5E1`) en Modo Oscuro. Prohibido usar textos cobrizos, marrones o tonos intermedios sobre las cards.
- **Unidades, Placeholders y Fechas:** `#94A3B8` en claro, `#64748B` en oscuro.

---

## 3. ✍️ Sistema Tipográfico & Jerarquía Numérica

La app se entiende sin leer párrafos densos gracias a la escala numérica:

| Elemento | Tamaño | Peso (FontWeight) | Color | Ejemplo Visual |
| :--- | :--- | :--- | :--- | :--- |
| **Métrica Hero** | 38px – 44px | `900` (Black) | `#000000` / `#0F172A` | `2522` |
| **Sub-métrica Anillo** | 16px – 18px | `900` (Black) | `#0F172A` | `141g` |
| **Unidad Hero** | 16px – 18px | `600` (SemiBold) | `#64748B` | `Kcal` |
| **Estado Tracking** | 10px – 11px | `800` (Bold) | `#EA580C` | `RESTANTES` / `DISPO` |
| **Etiqueta Macro** | 11px – 12px | `800` (Bold) | `#94A3B8` | `PROT` • `CARB` • `GRASA` |
| **Títulos de Pantalla** | 20px – 24px | `900` (Black) | `#0F172A` | `Alimentos` • `Progreso` |
| **Texto Cápsula IA** | 12px – 13px | `600` (SemiBold) | `#FFFFFF` | `Tarde ideal para...` |

> 💡 **Regla tipográfica de los números:** Las unidades (`g`, `kcal`, `ml`) deben tener menor peso o menor tamaño que el número para que el ojo capte el valor de un solo vistazo.

---

## 4. 🧩 Componentes Canónicos Reutilizables

### A. Anillo de Progreso Zenit (`ProgressRing`) — EXCLUSIVO de HomeScreen
- **Ubicación Exclusiva:** **ÚNICAMENTE en HomeScreen**. En el dashboard principal representa el total diario de calorías y macros.
- **Regla de No Redundancia:** En modales de alimentos, recetas o detalles de productos **NO** se usan anillos para no saturar visualmente. En su lugar, se usan las 4 cards visuales de macronutrientes Zenit.
- **Estilo:** Trazo circular con extremos redondeados (`strokeLinecap="round"`).
- **Color de Fondo Inactivo:** `#F1F5F9` o `#F8FAFC`.
- **Color Activo:** LinearGradient oficial `#DC2626` ➔ `#F97316`.
- **Estructura Interna:** Siempre apilada en el centro:
  1. Número en bold (`fontSize: 38`, `fontWeight: '900'`)
  2. Unidad en gris (`fontSize: 16`, `color: '#64748B'`)
  3. Badge de estado en naranja (`fontSize: 11`, `letterSpacing: 1`, `color: '#EA580C'`)

### B. Cápsula Inteligente Zenit (`SmartInsightCapsule`)
- **Propósito:** Mostrar frases motivacionales, sugerencias del algoritmo o alertas contextuales sin invadir la pantalla.
- **Forma:** Cápsula redonda completa (`borderRadius: 9999` / `borderRadius: 20`).
- **Fondo:** `#0F172A` (Negro espacial profundo).
- **Icono:** Círculo interno en tono naranja oscuro/quemado (`#2A1810` o `#431407`) con destellos ✨ o rayo en naranja `#F97316`.
- **Texto:** `#FFFFFF`, directo, conciso (máximo 2 líneas).

### C. Botón de Acción Principal (`ZenitGradientButton`)
- **Fondo:** `LinearGradient` con `colors={ZENIT_GRADIENT}`.
- **Esquinas:** `borderRadius: 18` (Generosas, suaves al tacto).
- **Sombra:** Suave con tinte cálido:
  ```javascript
  shadowColor: '#F97316',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 4,
  ```
- **Texto e Icono:** Blanco `#FFFFFF`, `fontWeight: '900'`, centrado.

### D. Patrón de Dos Botones Contiguos (Primario + Secundario Contrastante)
- **Regla Suprema de Emparejamiento (Duo-Action):**  
  Cuando en una interfaz (modal, tarjeta, diálogo de confirmación o barra de acciones) se colocan dos botones contiguos uno al lado del otro:
  1. **Botón Primario (Acción Principal):**
     - Relleno sólido `LinearGradient` con `colors={ZENIT_GRADIENT}` (`#DC2626` ➔ `#F97316`).
     - Texto e icono en blanco puro `#FFFFFF`, `fontWeight: '900'`.
     - Sombra cálida de acción (`shadowColor: '#F97316'`, `shadowOpacity: 0.28`).
  2. **Botón Contrastante / Secundario (Acción Alternativa o Cancelar):**
     - **Relleno Interior (Background Contextual):** DEBE tener obligatoriamente el color de fondo exacto del contenedor o superficie padre donde vive. Si la modal o card es `#FFFFFF`, el relleno interior es `#FFFFFF`; si es una superficie gris `#F8FAFC`, adopta `#F8FAFC`; y si la superficie es oscura `#0F172A` (o en futuro Dark Theme), adopta ese mismo color oscuro. Jamás inventar un gris intermedio o color plano ajeno.
     - **Borde Exterior:** Marco fino de `1.5px` renderizado con el `LinearGradient` oficial de Zenit (`ZENIT_GRADIENT`), logrado mediante un contenedor padre con padding de `1.5px`.
     - **Tipografía e Icono:** En color naranja ardiente de contraste (`#EA580C` o `#C2410C`), `fontWeight: '900'`, logrando perfecta simetría y armonía con el botón primario.
- **Estructura Técnica:**
  - Contenedor exterior: `LinearGradient` con `colors={ZENIT_GRADIENT}`, `borderRadius: 18`, `padding: 1.5`.
  - Contenedor interior: `backgroundColor: containerBgColor` (ej: `#FFFFFF`), `borderRadius: 16.5`, `paddingVertical: 14`.
  - Contenido: Texto e icono con `#EA580C`, `fontWeight: '900'`, `fontSize: 14`.

### E. Botón Flotante Redondo de Edición (`CircularActionButton`)
- Como el botón del lápiz en la esquina superior derecha de la captura:
  - Tamaño: `36x36px` o `40x40px`.
  - Fondo: `#F8FAFC` o `#FFFFFF`.
  - Borde: `1px` color `#E2E8F0` o sin borde con sombra muy leve.
  - Icono: `16px`, color `#94A3B8`.

### F. Selector de Pestañas Segmentadas
- **Contenedor:** Fondo `#F1F5F9`, padding `4px`, `borderRadius: 16`.
- **Pestaña Activa:** Fondo `#FFFFFF`, `borderRadius: 12`, sombra sutil (`shadowOpacity: 0.08`), texto `#0F172A` en `fontWeight: '800'`.
- **Pestaña Inactiva:** Fondo transparente, texto `#64748B` en `fontWeight: '600'`.

### G. Regla de Oro de Modales: Cero Saltos de Altura (Zero Layout Shift)
- **Principio:** **NUNCA** permitir que una modal cambie de altura o dé saltos bruscos ("ticks") al alternar entre pestañas o modos internos (ej: cambiar entre *'Por Envase/Unidad'* y *'Pesar en Gramos'*).
- **Implementación:** El contenedor del selector de porciones o el cuerpo de la modal debe tener un `minHeight` predefinido y fijo.
- **Animaciones:** Usar transiciones fluidas con `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` para que cualquier reajuste sea suave y orgánico a 60 fps.

### H. Calidad de Imágenes y Deduplicación de Productos (Full Packshots & Zero Duplicate Spam)
- **Packshots Completos Sin Recorte:** Las imágenes de alimentos y bebidas se renderizan enteras con `resizeMode="contain"` sobre un contenedor neutro (`#FFFFFF` o `#F8FAFC`), garantizando que las latas, botellas y cajas se aprecien de punta a punta sin cortes grotescos.
- **Resolución HD Automática:** En Open Food Facts se reemplazan dinámicamente las miniaturas de baja resolución (`.100.jpg`, `.200.jpg`) por packshots de alta definición (`.400.jpg`) mediante `toHighResImage()`.
- **Deduplicación Canónica:** Al buscar productos de consumo masivo (ej: Monster Energy, Havanna, Lucchetti), el buscador normaliza la clave (`brand + name`) ignorando palabras de relleno (`lata`, `ml`, `pack`, etc.) y prioriza las variedades oficiales argentinas curadas, eliminando por completo el spam de 50 entradas duplicadas generadas por usuarios.

### I. Tarjetas y Bloques de Destacado / Contraste con Borde Gradiente (`ZenitHighlightCard`)
- **Problema que Resuelve:** En pantallas o modales donde un bloque deba contrastar fuertemente con el fondo (ej: la tarjeta de selección de porciones o la tarjeta de calorías totales en la modal de producto), **NUNCA debe pintarse el fondo de color naranja pastel, crema o amarillento (`#FFF7ED`)**. Esos fondos ensucian la estética premium y colisionan con el Dark Theme.
- **Regla Canónica de Contraste:**
  1. **Fondo Interior (Background):** DEBE ser exactamente el color de fondo del contenedor padre (`#FFFFFF` en Modo Claro, `#0F172A`/`#020617` en Modo Oscuro).
  2. **Borde Exterior:** Marco fino de `1.5px` en `LinearGradient` oficial de Zenit (`colors={['#DC2626', '#F97316']}`).
  3. **Títulos y Rótulos Importantes:** En naranja ardiente oficial de la marca (`#EA580C` o `#F97316`).
  4. **Resto del Texto, Números y Subtítulos:** Estrictamente **Negro azabache (`#0F172A`)** en Modo Claro o **Blanco puro (`#FFFFFF`)** en Modo Oscuro. Prohibido usar marrones, cobrizos u otros colores intermedios.

---

## 5. 📱 Cómo Replicar Esta Estética en Cada Sección de la App

### 1. 🍗 Pestaña de Comidas (`FoodScreen.js`)
- **Catálogo de Alimentos:** Tarjetas blancas limpias con bordes `#F1F5F9`. Cero texto innecesario.
- **Modal de Detalle de Producto:** 
  - **Bloque de Porciones y Calorías Totales:** Aplican estrictamente el patrón `ZenitHighlightCard` (fondo blanco limpio + borde en `LinearGradient` Zenit + título en naranja `#EA580C` + números y textos en negro/blanco puro según el tema). **Cero fondos anaranjados/crema**.
  - **Cards de Macros Secundarias (Prot, Carb, Grasa):** Cards blancas limpias con bordes `#F1F5F9` y textos negro/blanco.
- **Carro de Recetas:** La barra flotante inferior replica el estilo de la cápsula inteligente: fondo con degradado Zenit `#DC2626` ➔ `#F97316`, píldora con esquinas redondeadas, texto blanco y badges nítidos.

### 2. 🏋️ Pestaña de Gimnasio (`GymScreen.js`)
- **Rutina del Día:** Hero card con el degradado Zenit para la barra de progreso de ejercicios completados.
- **Contador de Series (Sets):** Mini círculos con borde degradado Zenit idénticos a los sub-anillos de `PROT`, `CARB`, `GRASA`. Al completar una serie, el círculo se rellena con el gradiente Zenit.
- **Mensaje de Descanso:** Usar la cápsula inteligente `#0F172A` con el cronómetro en blanco y el destello en naranja.

### 3. ⚖️ Pantalla de Peso (`WeightTrackerScreen.js`)
- **Hero de Peso:** El peso actual (`74.8 kg`) debe tener la jerarquía del número gigante `2522`.
- **Estatus de IMC / Grasa:** Mini badges con tipografía en mayúsculas (`NORMAL`, `SALUDABLE`, `OBJETIVO`) con el tracking (`letterSpacing: 1`) idéntico a `RESTANTES` y `DISPO`.
- **Tarjeta de Advertencia DEXA:** Borde `#FED7AA`, fondo `#FFF7ED` y botón de calibración con degradado Zenit.

### 4. 💧 Hidratación (`WaterTrackerScreen.js`)
- **Meta de Agua:** Anillo circular o barra con oleaje suave, pero los botones de presets (`+250ml`, `+500ml`) y el botón de confirmar deben respetar la tipografía `900` y sombras de volumen Apple.
- **Sugerencia de Hidratación:** Mostrarla dentro de la cápsula negra `#0F172A` con icono de gota en vez de destellos.

### 5. 🚀 Onboarding
- **Pasos y Progreso:** Barra superior finita con degradado Zenit.
- **Preguntas:** Título en `#0F172A` (negro azabache), opciones en tarjetas blancas con borde que se enciende en degradado Zenit al seleccionarse.
- **Botón "Continuar":** Ancho completo con `ZENIT_GRADIENT`, `height: 56px`, esquinas `18px`.

---

## 6. 🚫 Lo que NUNCA Debemos Hacer (Anti-Patrones)

1. ❌ **No inventar colores aleatorios:** No usar morados, rosas o gradientes celestes para acciones primarias. La energía de Zenit es roja/naranja.
2. ❌ **No saturar con bordes oscuros:** Los bordes de las cards siempre deben ser `#F1F5F9` o `#E2E8F0`. Si un borde se ve negro o gris oscuro, rompe el diseño.
3. ❌ **No escribir textos largos en cards:** Si un usuario tiene que leer más de dos renglones para entender una tarjeta, el diseño falló. Usar números grandes + etiquetas en mayúscula (`DISPO`, `RESTANTES`, `META`).
4. ❌ **No usar botones rectangulares filosos:** El radio de esquina mínimo en Zenit es `14px` para elementos chicos y `18px` – `24px` para tarjetas y botones principales.
5. ❌ **No usar sombras negras duras:** Las sombras deben tener `shadowOpacity: 0.04` a `0.08` para cards neutras y `shadowColor: '#F97316'` con `shadowOpacity: 0.25` para botones de acción.
6. ❌ **No usar fondos anaranjados pastel, crema o amarillentos en tarjetas (`#FFF7ED` / `#FED7AA`):** Ensucien la limpieza visual, restan nitidez al número y colisionan con el Dark Theme. Todo bloque que deba contrastar con el fondo (como el selector de porciones o la tarjeta de calorías en la modal de alimentos) debe usar **fondo limpio idéntico al contenedor + borde fino en LinearGradient Zenit + títulos en naranja `#EA580C` + textos/números en blanco o negro según el tema**.

---

## 7. 📦 Snippets Oficiales Listos para Copiar y Pegar

### Tarjeta Canónica Zenit (`ZenitCard`)
```jsx
<View
  style={{
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  }}
>
  {children}
</View>
```

### Botón Primario Zenit (`ZenitPrimaryButton`)
```jsx
<TouchableOpacity
  activeOpacity={0.88}
  onPress={onPress}
  style={{
    borderRadius: 18,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  }}
>
  <LinearGradient
    colors={['#DC2626', '#F97316']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{
      paddingVertical: 15,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    }}
  >
    {Icon && <Icon size={18} color="#FFFFFF" strokeWidth={2.5} />}
    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.2 }}>
      {title}
    </Text>
  </LinearGradient>
</TouchableOpacity>
```

### Píldora Inteligente IA (`SmartInsightPill`)
```jsx
<View
  style={{
    backgroundColor: '#0F172A',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  }}
>
  <View
    style={{
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Sparkles size={15} color="#F97316" />
  </View>
  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', flex: 1 }}>
    {insightText}
  </Text>
</View>
```

### Botón Secundario Contrastante con Borde en Gradiente (`ZenitContrastButton`)
```jsx
<TouchableOpacity
  activeOpacity={0.85}
  onPress={onPress}
  style={{
    borderRadius: 18,
    overflow: 'hidden',
  }}
>
  <LinearGradient
    colors={['#DC2626', '#F97316']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{
      padding: 1.5, // Grosor exacto del borde en degradado
      borderRadius: 18,
    }}
  >
    <View
      style={{
        backgroundColor: containerBgColor || '#FFFFFF', // Respeta el color de fondo del contenedor padre
        borderRadius: 16.5,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
      }}
    >
      {Icon && <Icon size={18} color="#EA580C" strokeWidth={2.5} />}
      <Text style={{ color: '#EA580C', fontSize: 14, fontWeight: '900', letterSpacing: 0.2 }}>
        {title}
      </Text>
    </View>
  </LinearGradient>
</TouchableOpacity>
```

### Tarjeta Destacada con Borde en Gradiente (`ZenitHighlightCard`)
```jsx
{/* Tarjeta de alto contraste para porciones, calorías o bloques clave */}
<LinearGradient
  colors={['#DC2626', '#F97316']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={{
    padding: 1.5, // Borde fino en degradado oficial
    borderRadius: 20,
    marginVertical: 6,
  }}
>
  <View
    style={{
      backgroundColor: containerBgColor || '#FFFFFF', // Fondo idéntico al contenedor (blanco o dark)
      borderRadius: 18.5,
      padding: 16,
    }}
  >
    {/* Título importante siempre en Naranja Ardiente */}
    <Text style={{ color: '#EA580C', fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {sectionTitle}
    </Text>

    {/* Resto de contenido, métricas y subtítulos en Negro (Light) o Blanco (Dark) */}
    <Text style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontSize: 18, fontWeight: '900', marginTop: 4 }}>
      {primaryValue}
    </Text>
    <Text style={{ color: isDark ? '#94A3B8' : '#475569', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
      {description}
    </Text>
  </View>
</LinearGradient>
```

---

## 8. 🌓 Arquitectura & Preparación para Dark Theme (Future-Proofing)

> **Mandato Arquitectónico de Zenit:**  
> Toda la lógica de componentes, estilos, tokens y pantallas que hagan referencia a la identidad visual de la app **DEBEN concebirse y estructurarse teniendo en cuenta que el proyecto migrará o incorporará soporte completo para Dark Theme en futuras iteraciones**.

### 1. Superficies y Contenedores Adaptativos (Context-Aware Backgrounds)
- **Cero fondos fijos inflexibles:** Las tarjetas, modales, hojas flotantes y contenedores no deben asumir que el fondo siempre será `#FFFFFF` o `#FAFAFA`.
- Los botones secundarios y contrastantes ([`ZenitContrastButton`](#d-patrón-de-dos-botones-contiguos-primario--secundario-contrastante)) y las tarjetas destacadas ([`ZenitHighlightCard`](#i-tarjetas-y-bloques-de-destacado--contraste-con-borde-gradiente-zenithighlightcard)) deben tomar su relleno interno del fondo de su contenedor padre (`containerBgColor`).
  - *En Modo Claro:* Relleno `#FFFFFF` o `#F8FAFC`.
  - *En Modo Oscuro:* Relleno `#0F172A` o `#020617` (haciendo que el borde ardiente de Zenit resalte con máxima sofisticación sin alterar la silueta).

### 2. El Gradiente Zenit como Firma Inmutable
- La firma energética de la marca (`ZENIT_GRADIENT = ['#DC2626', '#F97316']`) **se mantiene idéntica en ambos temas**.
- En Modo Oscuro, el gradiente rojo ➔ naranja adquiere un contraste de nivel "Cyber-OLED" superior, por lo que nunca debe reemplazarse por colores apagados o grises.

### 3. Inversión Semántica de Textos y Contraste
Al estructurar constantes o clases de estilos, prever la inversión de jerarquía:
- **Títulos y Métricas Titán:** `#0F172A` (Claro) ➔ `#F8FAFC` o `#FFFFFF` (Oscuro).
- **Subtítulos y Jerarquía Media:** `#64748B` (Claro) ➔ `#94A3B8` (Oscuro).
- **Placeholders y Etiquetas de Estado Inactivo:** `#94A3B8` (Claro) ➔ `#64748B` (Oscuro).
- **Acentos Naranja / Estados:** `#EA580C` (Claro) ➔ `#F97316` (Oscuro, más luminoso para fondo negro).

### 4. Bordes y Sombras en Dark Mode
- **Bordes de Tarjetas:** De `#F1F5F9` pasarán a `#1E293B` o `#334155` (1px, sutiles y limpios).
- **Sombras:** Las sombras difusas negras pierden impacto en fondos oscuros. En Modo Oscuro se reemplazan por bordes de gradiente sutiles o un resplandor cálido tenue (`shadowColor: '#F97316'`, `shadowOpacity: 0.35`) en botones de acción.

### 5. Regla Bimodal Estricta de Texto (Blanco / Negro)
- **Cero textos coloridos intermedios:** Queda prohibido usar textos marrones, cobrizos o amarillentos para descripciones o valores secundarios.
- **Títulos Destacados:** Naranja ardiente oficial (`#EA580C` / `#F97316`).
- **Todo el resto de los textos y números:** Estrictamente **Negro azabache** (`#0F172A` / `#000000`) en tema claro, o **Blanco puro** (`#FFFFFF`) en tema oscuro. Esta disciplina garantiza legibilidad absoluta y consistencia visual en cualquier pantalla.



