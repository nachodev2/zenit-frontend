import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import {
  Drumstick,
  Search,
  Heart,
  Plus,
  Minus,
  Check,
  X,
  Flame,
  Utensils,
  BookOpen,
  Trash2,
  ChevronRight,
  Sparkles,
  ChefHat,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useUserStore } from '../store/useUserStore';
import { ZENIT_GRADIENT } from '../constants/theme';
import { ZenitModalAlert } from '../components/ui/ZenitModalAlert';
import {
  POPULAR_ARGENTINE_PRODUCTS,
  searchOpenFoodFacts,
  findLocalMatches,
} from '../services/api/openFoodFactsService';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 44) / 2;

// =================================================================
// COMPONENTES CANÓNICOS DEL ZENIT DESIGN SYSTEM (DESIGN_SYSTEM.md)
// =================================================================

/**
 * 1. Píldora Inteligente de IA (SmartInsightCapsule)
 * Cápsula redondeada en #0F172A con icono de destello naranja y texto blanco
 */
function SmartInsightCapsule({ text, style }) {
  return (
    <View
      style={[
        {
          backgroundColor: '#0F172A',
          borderRadius: 9999,
          paddingHorizontal: 16,
          paddingVertical: 11,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: 'rgba(249, 115, 22, 0.22)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={14} color="#F97316" />
      </View>
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: '600',
          flex: 1,
          lineHeight: 16,
        }}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * 2. Anillo Hero Canónico de Calorías (El Anillo Central de la Captura)
 * Anillo con gradiente Zenit (#DC2626 -> #F97316), Número Titán, Kcal y subtítulo
 */
function ZenitHeroKcalRing({ calories, label = 'Kcal', subtitle = 'PORCIÓN' }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
      <LinearGradient
        colors={ZENIT_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 146,
          height: 146,
          borderRadius: 73,
          padding: 9,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: 65,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
          }}
        >
          {/* NÚMERO TITÁN */}
          <Text
            style={{
              fontSize: 34,
              fontWeight: '900',
              color: '#0F172A',
              letterSpacing: -1,
              lineHeight: 38,
            }}
          >
            {calories}
          </Text>

          {/* UNIDAD MEDIA */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#64748B',
              marginTop: -2,
            }}
          >
            {label}
          </Text>

          {/* ESTADO EN NARANJA */}
          <Text
            style={{
              fontSize: 9,
              fontWeight: '800',
              color: '#EA580C',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * 3. Sub-Anillo Canónico de Macronutrientes (Trío PROT, CARB, GRASA de la Captura)
 * Mismo borde con gradiente Zenit, número + unidad, y etiqueta en gris
 */
function ZenitSubMacroRing({ value, unit = 'g', label = 'PROT', sublabel = 'DISPO' }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <LinearGradient
        colors={ZENIT_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 74,
          height: 74,
          borderRadius: 37,
          padding: 5,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.16,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '900',
              color: '#0F172A',
              lineHeight: 17,
            }}
          >
            {value}
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>{unit}</Text>
          </Text>

          <Text
            style={{
              fontSize: 8,
              fontWeight: '800',
              color: '#EA580C',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {sublabel}
          </Text>
        </View>
      </LinearGradient>

      {/* ETIQUETA INFERIOR EN GRIS */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          color: '#94A3B8',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginTop: 6,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * 4. Botón Primario Oficial Zenit con Sombra Cálida
 */
function ZenitPrimaryButton({ onPress, title, icon: Icon, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        {
          borderRadius: 18,
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 10,
          elevation: 4,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={ZENIT_GRADIENT}
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
        {Icon && <Icon size={18} color="#FFFFFF" strokeWidth={2.8} />}
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '900',
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * 5. Thumbnail de Producto Limpio (Packshot completo sin cortes ni deformación)
 */
function ProductThumbnail({ uri, style, iconSize = 28, resizeMode = 'contain' }) {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#F1F5F9',
          },
          style,
        ]}
      >
        <Drumstick size={iconSize} color="#94A3B8" strokeWidth={1.5} />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 6,
        },
        style,
      ]}
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={resizeMode}
        onError={() => setHasError(true)}
      />
    </View>
  );
}

// =================================================================
// PANTALLA PRINCIPAL: FOODSCREEN
// =================================================================

export default function FoodScreen({ navigation }) {
  // Store selectors
  const favorites = useUserStore((state) => state.favorites) || [];
  const recipes = useUserStore((state) => state.recipes) || [];
  const customProducts = useUserStore((state) => state.customProducts) || [];
  const recipeCart = useUserStore((state) => state.recipeCart) || [];

  const toggleFavorite = useUserStore((state) => state.toggleFavorite);
  const addRecipe = useUserStore((state) => state.addRecipe);
  const deleteRecipe = useUserStore((state) => state.deleteRecipe);
  const addCustomProduct = useUserStore((state) => state.addCustomProduct);
  const addConsumedFood = useUserStore((state) => state.addConsumedFood);

  // Acciones del carrito de recetas (E-commerce)
  const addToRecipeCart = useUserStore((state) => state.addToRecipeCart);
  const updateRecipeCartGrams = useUserStore((state) => state.updateRecipeCartGrams);
  const removeFromRecipeCart = useUserStore((state) => state.removeFromRecipeCart);
  const clearRecipeCart = useUserStore((state) => state.clearRecipeCart);
  const saveRecipeFromCart = useUserStore((state) => state.saveRecipeFromCart);

  // Estados UI
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'recipes' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(POPULAR_ARGENTINE_PRODUCTS);
  const [isSearching, setIsSearching] = useState(false);

  // Modal de Detalle de Producto al tocar la card
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [portionMode, setPortionMode] = useState('unit'); // 'unit' | 'grams'
  const [unitCount, setUnitCount] = useState(1);
  const [productGrams, setProductGrams] = useState(100);

  // Modal de Carro de Receta
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [recipeNameInput, setRecipeNameInput] = useState('');
  const [recipeServingsInput, setRecipeServingsInput] = useState(1);

  // Modal Crear nuevo producto personalizado
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdServing, setNewProdServing] = useState('1 unidad (100g)');
  const [newProdCals, setNewProdCals] = useState('');
  const [newProdProt, setNewProdProt] = useState('');
  const [newProdCarbs, setNewProdCarbs] = useState('');
  const [newProdFats, setNewProdFats] = useState('');
  const [newProdImage, setNewProdImage] = useState('');

  // Alerta modal informativa
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Búsqueda inteligente de alto rendimiento en dos fases (0ms local + red cancelable)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([...customProducts, ...POPULAR_ARGENTINE_PRODUCTS]);
      setIsSearching(false);
      return;
    }

    // 1. Fase inmediata (0 ms): filtrar al instante el catálogo local y productos del usuario
    const instantMatches = findLocalMatches(trimmed, customProducts);
    setSearchResults(instantMatches);
    setIsSearching(true);

    // 2. Fase de red con cancelación (AbortController) y debounce ágil de 280ms
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const offResults = await searchOpenFoodFacts(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          const freshLocal = findLocalMatches(trimmed, customProducts);
          const seen = new Set(
            freshLocal.map((i) => `${(i.brand || '').toLowerCase()} ${(i.name || '').toLowerCase()}`)
          );
          const newRemote = offResults.filter(
            (item) => !seen.has(`${(item.brand || '').toLowerCase()} ${(item.name || '').toLowerCase()}`)
          );
          setSearchResults([...freshLocal, ...newRemote]);
        }
      } catch (e) {
        // Ignorar abort
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 280);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchQuery, customProducts]);

  // Cálculos dinámicos del producto seleccionado (por unidad / lata O por gramos)
  const calculatedMacros = useMemo(() => {
    if (!selectedProduct) return { calories: 0, protein: 0, carbs: 0, fats: 0 };

    if (portionMode === 'unit') {
      const baseUnitCals = selectedProduct.unitCalories != null
        ? Number(selectedProduct.unitCalories)
        : Math.round((Number(selectedProduct.calories) || 0) * ((selectedProduct.unitGrams || 100) / 100));

      const baseUnitProt = selectedProduct.unitProtein != null
        ? Number(selectedProduct.unitProtein)
        : Number(((Number(selectedProduct.protein) || 0) * ((selectedProduct.unitGrams || 100) / 100)).toFixed(1));

      const baseUnitCarbs = selectedProduct.unitCarbs != null
        ? Number(selectedProduct.unitCarbs)
        : Number(((Number(selectedProduct.carbs) || 0) * ((selectedProduct.unitGrams || 100) / 100)).toFixed(1));

      const baseUnitFats = selectedProduct.unitFats != null
        ? Number(selectedProduct.unitFats)
        : Number(((Number(selectedProduct.fats) || 0) * ((selectedProduct.unitGrams || 100) / 100)).toFixed(1));

      const count = Math.max(1, unitCount);

      return {
        calories: Math.round(baseUnitCals * count),
        protein: Number((baseUnitProt * count).toFixed(1)),
        carbs: Number((baseUnitCarbs * count).toFixed(1)),
        fats: Number((baseUnitFats * count).toFixed(1)),
      };
    } else {
      const baseCals = Number(selectedProduct.calories) || 0;
      const baseProt = Number(selectedProduct.protein) || 0;
      const baseCarbs = Number(selectedProduct.carbs) || 0;
      const baseFats = Number(selectedProduct.fats) || 0;
      const ratio = (productGrams || 100) / 100;

      return {
        calories: Math.round(baseCals * ratio),
        protein: Number((baseProt * ratio).toFixed(1)),
        carbs: Number((baseCarbs * ratio).toFixed(1)),
        fats: Number((baseFats * ratio).toFixed(1)),
      };
    }
  }, [selectedProduct, portionMode, unitCount, productGrams]);

  // Cálculos dinámicos de los totales del carrito de recetas
  const cartTotals = useMemo(() => {
    const totalCals = recipeCart.reduce((acc, item) => acc + (Number(item.calories) || 0), 0);
    const totalProt = recipeCart.reduce((acc, item) => acc + (Number(item.protein) || 0), 0);
    const totalCarbs = recipeCart.reduce((acc, item) => acc + (Number(item.carbs) || 0), 0);
    const totalFats = recipeCart.reduce((acc, item) => acc + (Number(item.fats) || 0), 0);

    return {
      calories: totalCals,
      protein: Number(totalProt.toFixed(1)),
      carbs: Number(totalCarbs.toFixed(1)),
      fats: Number(totalFats.toFixed(1)),
    };
  }, [recipeCart]);

  // Abrir detalle del producto
  const handleOpenProductDetail = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProduct(product);

    const preferUnit = product.defaultPortionType === 'unit' || !!product.unitName;
    setPortionMode(preferUnit ? 'unit' : 'grams');
    setUnitCount(1);
    setProductGrams(product.unitGrams || 100);
  };

  // Alternar modo de porción con animación fluida y cero tick
  const handleSwitchPortionMode = (mode) => {
    if (portionMode === mode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPortionMode(mode);
  };

  // Botón 1: "Sumar a la ingesta de mi día"
  const handleLogToToday = () => {
    if (!selectedProduct) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const portionLabel = portionMode === 'unit'
      ? `${unitCount} ${unitCount > 1 ? 'unidades' : 'unidad'} (${selectedProduct.unitName || selectedProduct.servingSize || ''})`
      : `${productGrams}g`;

    addConsumedFood({
      name: `${selectedProduct.name} - ${portionLabel}`,
      calories: calculatedMacros.calories,
      protein: calculatedMacros.protein,
      carbs: calculatedMacros.carbs,
      fats: calculatedMacros.fats,
      ingredients: [],
    });

    const addedName = selectedProduct.name;
    const addedCals = calculatedMacros.calories;
    setSelectedProduct(null);

    setAlertConfig({
      visible: true,
      title: '¡Sumado a tu Día!',
      message: `Agregaste "${addedName}" (+${addedCals} kcal) a tus macros de hoy.`,
      type: 'success',
    });
  };

  // Botón 2: "Agregar a una receta" (estilo carrito de compras)
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const effectiveGrams = portionMode === 'unit'
      ? (selectedProduct.unitGrams || 100) * unitCount
      : productGrams;

    addToRecipeCart(selectedProduct, effectiveGrams);

    const prodName = selectedProduct.name;
    const currentCount = recipeCart.length + 1;
    setSelectedProduct(null);

    setAlertConfig({
      visible: true,
      title: '🛒 Agregado a la Receta',
      message: `"${prodName}" se sumó a tu receta en curso. Llevás ${currentCount} ingrediente${currentCount > 1 ? 's' : ''}.`,
      type: 'success',
    });
  };

  // Guardar receta desde el carrito
  const handleSaveRecipeFromCart = (andLogToday = false) => {
    if (recipeCart.length === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const recipeName = recipeNameInput.trim() || 'Mi Receta Casera';
    const createdRecipe = saveRecipeFromCart(recipeName, recipeServingsInput);
    setIsCartModalOpen(false);
    setRecipeNameInput('');
    setRecipeServingsInput(1);

    if (andLogToday && createdRecipe) {
      addConsumedFood({
        name: createdRecipe.name,
        calories: createdRecipe.totalMacros.calories,
        protein: createdRecipe.totalMacros.protein,
        carbs: createdRecipe.totalMacros.carbs,
        fats: createdRecipe.totalMacros.fats,
        ingredients: createdRecipe.ingredients || [],
      });

      setAlertConfig({
        visible: true,
        title: '¡Receta Creada y Consumida!',
        message: `Guardaste "${recipeName}" y sumaste +${createdRecipe.totalMacros.calories} kcal a hoy.`,
        type: 'success',
      });
    } else {
      setAlertConfig({
        visible: true,
        title: '¡Receta Guardada!',
        message: `"${recipeName}" ahora está lista en la pestaña "Mis recetas".`,
        type: 'success',
      });
    }

    setActiveTab('recipes');
  };


  // Guardar nuevo producto propio en Zenit DB
  const handleSaveCustomProduct = () => {
    if (!newProdName.trim() || !newProdCals) {
      setAlertConfig({
        visible: true,
        title: 'Datos necesarios',
        message: 'Ingresá al menos el nombre y las calorías del producto.',
        type: 'warning',
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const prod = {
      name: newProdName.trim(),
      brand: newProdBrand.trim() || 'Marca Propia',
      servingSize: newProdServing.trim() || '1 unidad (100g)',
      unitName: newProdServing.trim() || '1 unidad',
      unitGrams: 100,
      defaultPortionType: 'unit',
      calories: Number(newProdCals) || 0,
      protein: Number(newProdProt) || 0,
      carbs: Number(newProdCarbs) || 0,
      fats: Number(newProdFats) || 0,
      unitCalories: Number(newProdCals) || 0,
      unitProtein: Number(newProdProt) || 0,
      unitCarbs: Number(newProdCarbs) || 0,
      unitFats: Number(newProdFats) || 0,
      image: newProdImage.trim() || null,
      category: 'Personalizado',
    };

    addCustomProduct(prod);
    setIsCreateProductModalOpen(false);
    setNewProdName('');
    setNewProdBrand('');
    setNewProdCals('');
    setNewProdProt('');
    setNewProdCarbs('');
    setNewProdFats('');
    setNewProdImage('');

    handleOpenProductDetail(prod);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ======================================================= */}
        {/* ENCABEZADO CANÓNICO ZENIT                               */}
        {/* ======================================================= */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LinearGradient
              colors={ZENIT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.28,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Drumstick size={20} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>

            <View>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#0F172A', letterSpacing: -0.4 }}>
                Alimentos
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                Buscador, recetario y despensa
              </Text>
            </View>
          </View>

          {/* ACCIONES SUPERIORES */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsCreateProductModalOpen(true);
              }}
              style={{
                height: 38,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: '#0F172A',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Plus size={15} color="#FFFFFF" strokeWidth={3} />
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>Crear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================= */}
        {/* PESTAÑAS SEGMENTADAS CANÓNICAS                          */}
        {/* ======================================================= */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, backgroundColor: '#FFFFFF' }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F1F5F9',
              padding: 4,
              borderRadius: 16,
            }}
          >
            {/* PESTAÑA 1: PRODUCTOS */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('products');
              }}
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: 'center',
                backgroundColor: activeTab === 'products' ? '#FFFFFF' : 'transparent',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === 'products' ? 0.08 : 0,
                shadowRadius: 3,
                elevation: activeTab === 'products' ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === 'products' ? '800' : '600',
                  color: activeTab === 'products' ? '#0F172A' : '#64748B',
                }}
              >
                Productos
              </Text>
            </TouchableOpacity>

            {/* PESTAÑA 2: MIS RECETAS */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('recipes');
              }}
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: 'center',
                backgroundColor: activeTab === 'recipes' ? '#FFFFFF' : 'transparent',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === 'recipes' ? 0.08 : 0,
                shadowRadius: 3,
                elevation: activeTab === 'recipes' ? 2 : 0,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === 'recipes' ? '800' : '600',
                  color: activeTab === 'recipes' ? '#0F172A' : '#64748B',
                }}
              >
                Mis recetas
              </Text>
              {recipeCart.length > 0 && (
                <View
                  style={{
                    backgroundColor: '#EA580C',
                    paddingHorizontal: 6,
                    height: 16,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>
                    {recipeCart.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* PESTAÑA 3: FAVORITOS */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('favorites');
              }}
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: 'center',
                backgroundColor: activeTab === 'favorites' ? '#FFFFFF' : 'transparent',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === 'favorites' ? 0.08 : 0,
                shadowRadius: 3,
                elevation: activeTab === 'favorites' ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === 'favorites' ? '800' : '600',
                  color: activeTab === 'favorites' ? '#0F172A' : '#64748B',
                }}
              >
                Favoritos ({favorites.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================= */}
        {/* CONTENIDO SCROLL PRINCIPAL                              */}
        {/* ======================================================= */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: recipeCart.length > 0 ? 175 : 110 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ======================================================= */}
          {/* PESTAÑA 1: PRODUCTOS                                    */}
          {/* ======================================================= */}
          {activeTab === 'products' && (
            <View>
              {/* SMART INSIGHT PILL CANÓNICA */}
              <SmartInsightCapsule
                text="Tocá cualquier alimento para ver sus macros o sumarlo a una receta casera."
                style={{ marginBottom: 14 }}
              />

              {/* BUSCADOR ESTILO APPLE */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                  marginBottom: 16,
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                }}
              >
                <Search size={18} color="#94A3B8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar Monster, pollo, yogur, avena..."
                  placeholderTextColor="#94A3B8"
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 14,
                    color: '#0F172A',
                    fontWeight: '700',
                  }}
                  clearButtonMode="while-editing"
                />
                {isSearching ? (
                  <ActivityIndicator size="small" color="#EA580C" style={{ marginLeft: 6 }} />
                ) : searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* CUADRÍCULA DE PRODUCTOS (SOLO FOTO Y NOMBRE, SIN MACROS) O ESTADO VACÍO */}
              {isSearching && searchResults.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    paddingVertical: 36,
                    paddingHorizontal: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 8,
                    elevation: 1,
                  }}
                >
                  <ActivityIndicator size="large" color="#EA580C" />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: '#0F172A',
                      marginTop: 14,
                      textAlign: 'center',
                    }}
                  >
                    Buscando en la base de datos...
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#64748B',
                      marginTop: 4,
                      textAlign: 'center',
                    }}
                  >
                    Consultando catálogo local y marcas argentinas
                  </Text>
                </View>
              ) : searchResults.length === 0 && searchQuery.trim().length > 0 ? (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    paddingVertical: 36,
                    paddingHorizontal: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                >
                  {/* Icono de búsqueda en contenedor neutral */}
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Search size={28} color="#94A3B8" />
                  </View>

                  {/* Leyenda exacta requerida por el usuario */}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '900',
                      color: '#0F172A',
                      textAlign: 'center',
                      lineHeight: 22,
                    }}
                  >
                    No hay productos disponibles de acuerdo a tu búsqueda
                  </Text>

                  {/* Subtexto aclaratorio */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#64748B',
                      textAlign: 'center',
                      marginTop: 8,
                      lineHeight: 19,
                      maxWidth: 300,
                    }}
                  >
                    ¿No encontrás "{searchQuery.trim()}"? Podés darlo de alta manualmente con sus macros en 1 minuto.
                  </Text>

                  {/* Botón CTA con degradado Zenit oficial */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setNewProdName(searchQuery.trim());
                      setIsCreateProductModalOpen(true);
                    }}
                    style={{
                      marginTop: 22,
                      width: '100%',
                      borderRadius: 18,
                      overflow: 'hidden',
                      shadowColor: '#EA580C',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <LinearGradient
                      colors={ZENIT_GRADIENT}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Plus size={18} color="#FFFFFF" strokeWidth={2.8} />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '800',
                          color: '#FFFFFF',
                          letterSpacing: 0.2,
                        }}
                      >
                        Dar de alta este producto
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  {searchResults.map((item) => {
                    const isFav = favorites.some((f) => f.name.toLowerCase() === item.name.toLowerCase());
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.88}
                        onPress={() => handleOpenProductDetail(item)}
                        style={{
                          width: COLUMN_WIDTH,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 22,
                          padding: 10,
                          borderWidth: 1,
                          borderColor: '#F1F5F9',
                          shadowColor: '#0F172A',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.04,
                          shadowRadius: 10,
                          elevation: 2,
                        }}
                      >
                        {/* FOTO CON CORAZÓN SUTIL */}
                        <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
                          <ProductThumbnail
                            uri={item.image}
                            style={{
                              width: '100%',
                              height: 124,
                              borderRadius: 16,
                            }}
                          />

                          {/* ACCIÓN SUTIL CORAZÓN */}
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              toggleFavorite(item);
                            }}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: 'rgba(255, 255, 255, 0.92)',
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                            }}
                          >
                            <Heart
                              size={16}
                              color={isFav ? '#E11D48' : '#64748B'}
                              fill={isFav ? '#E11D48' : 'transparent'}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* INFORMACIÓN DEL PRODUCTO: SOLO MARCA Y NOMBRE */}
                        <View style={{ marginTop: 10, paddingHorizontal: 2 }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: '#94A3B8',
                              textTransform: 'uppercase',
                              letterSpacing: 0.6,
                            }}
                            numberOfLines={1}
                          >
                            {item.brand || 'Alimento'}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '800',
                              color: '#0F172A',
                              marginTop: 2,
                              lineHeight: 17,
                            }}
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ======================================================= */}
          {/* PESTAÑA 2: MIS RECETAS                                  */}
          {/* ======================================================= */}
          {activeTab === 'recipes' && (
            <View>
              {/* SMART INSIGHT PILL */}
              <SmartInsightCapsule
                text="Creá combinaciones de alimentos para calcular los macros totales en 1 solo paso."
                style={{ marginBottom: 14 }}
              />

              {/* BANNER CARRITO ACTIVO */}
              {recipeCart.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setIsCartModalOpen(true)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 22,
                    padding: 16,
                    borderWidth: 1.5,
                    borderColor: '#F1F5F9',
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.04,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: '#0F172A',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ChefHat size={22} color="#F97316" strokeWidth={2.2} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>
                        Receta en curso ({recipeCart.length} productos)
                      </Text>
                      <Text style={{ fontSize: 12, color: '#EA580C', fontWeight: '800', marginTop: 2 }}>
                        {cartTotals.calories} kcal • {cartTotals.protein}g proteína
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={20} color="#94A3B8" strokeWidth={2.5} />
                </TouchableOpacity>
              )}

              {/* BOTÓN ARMAR RECETA NUEVA */}
              <ZenitPrimaryButton
                title={recipeCart.length > 0 ? 'Ver / Terminar Receta en Curso' : 'Armar Receta con Ingredientes'}
                icon={Utensils}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setIsCartModalOpen(true);
                }}
                style={{ marginBottom: 18 }}
              />

              {/* LISTA DE RECETAS GUARDADAS */}
              {recipes && recipes.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {recipes.map((recipe) => (
                    <View
                      key={recipe.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 22,
                        padding: 18,
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                        shadowColor: '#0F172A',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.04,
                        shadowRadius: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                            {recipe.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 }}>
                            {recipe.ingredients?.length || 0} ingredientes • {recipe.servings || 1} porción
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            deleteRecipe(recipe.id);
                          }}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: '#F8FAFC',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={15} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>

                      {/* INGREDIENTES RESUMEN */}
                      <View style={{ marginTop: 12, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 }}>
                        {recipe.ingredients?.map((ing, idx) => (
                          <Text key={idx} style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginVertical: 1.5 }}>
                            • {ing.name} ({ing.amount})
                          </Text>
                        ))}
                      </View>

                      {/* MACROS Y ACCIÓN REGISTRAR */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 16,
                          paddingTop: 14,
                          borderTopWidth: 1,
                          borderTopColor: '#F1F5F9',
                        }}
                      >
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>
                            {recipe.totalMacros?.calories} <Text style={{ fontSize: 10, color: '#94A3B8' }}>kcal</Text>
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#EA580C' }}>
                            {recipe.totalMacros?.protein}g P
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#CA8A04' }}>
                            {recipe.totalMacros?.carbs}g C
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#16A34A' }}>
                            {recipe.totalMacros?.fats}g G
                          </Text>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.88}
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            addConsumedFood({
                              name: recipe.name,
                              calories: recipe.totalMacros.calories,
                              protein: recipe.totalMacros.protein,
                              carbs: recipe.totalMacros.carbs,
                              fats: recipe.totalMacros.fats,
                              ingredients: recipe.ingredients || [],
                            });
                            setAlertConfig({
                              visible: true,
                              title: '¡Receta Registrada!',
                              message: `Sumaste "${recipe.name}" (+${recipe.totalMacros.calories} kcal) a hoy.`,
                              type: 'success',
                            });
                          }}
                          style={{
                            borderRadius: 14,
                            overflow: 'hidden',
                            shadowColor: '#F97316',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.22,
                            shadowRadius: 6,
                          }}
                        >
                          <LinearGradient
                            colors={ZENIT_GRADIENT}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Plus size={14} color="#FFFFFF" strokeWidth={3} />
                            <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>
                              Sumar a mi día
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <BookOpen size={42} color="#CBD5E1" />
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 12 }}>
                    Aún no tenés recetas armadas
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 30 }}>
                    Navegá por los productos y tocá "Agregar a una receta" para combinarlos en tu carrito.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ======================================================= */}
          {/* PESTAÑA 3: FAVORITOS                                    */}
          {/* ======================================================= */}
          {activeTab === 'favorites' && (
            <View>
              <SmartInsightCapsule
                text="Tus comidas y alimentos favoritos siempre disponibles para sumar en un toque."
                style={{ marginBottom: 14 }}
              />

              {favorites && favorites.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  {favorites.map((fav) => (
                    <TouchableOpacity
                      key={fav.id}
                      activeOpacity={0.88}
                      onPress={() => handleOpenProductDetail(fav)}
                      style={{
                        width: COLUMN_WIDTH,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 22,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                        shadowColor: '#0F172A',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.04,
                        shadowRadius: 10,
                        elevation: 2,
                      }}
                    >
                      <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
                        <ProductThumbnail
                          uri={fav.image || fav.imageUri}
                          style={{
                            width: '100%',
                            height: 124,
                            borderRadius: 16,
                          }}
                        />

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleFavorite(fav);
                          }}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.92)',
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Heart size={16} color="#E11D48" fill="#E11D48" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ marginTop: 10, paddingHorizontal: 2 }}>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: 0.6,
                          }}
                          numberOfLines={1}
                        >
                          Favorito
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '800',
                            color: '#0F172A',
                            marginTop: 2,
                            lineHeight: 17,
                          }}
                          numberOfLines={2}
                        >
                          {fav.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ paddingVertical: 50, alignItems: 'center' }}>
                  <Heart size={44} color="#CBD5E1" />
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 12 }}>
                    Sin comidas favoritas todavía
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 30 }}>
                    Tocá el corazón en cualquier producto para tenerlo siempre a mano acá.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ======================================================= */}
        {/* BARRA FLOTANTE DE RECETA (CARRITO E-COMMERCE)           */}
        {/* ======================================================= */}
        {recipeCart.length > 0 && activeTab !== 'recipes' && (
          <View
            style={{
              position: 'absolute',
              bottom: 96,
              left: 16,
              right: 16,
              borderRadius: 22,
              overflow: 'hidden',
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={ZENIT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 18,
                paddingVertical: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChefHat size={22} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>
                    {recipeCart.length} ingrediente{recipeCart.length > 1 ? 's' : ''} en tu receta
                  </Text>
                  <Text style={{ color: '#FFEDD5', fontSize: 11, fontWeight: '800' }}>
                    {cartTotals.calories} kcal • {cartTotals.protein}g proteína
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsCartModalOpen(true);
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              >
                <Text style={{ color: '#EA580C', fontSize: 12, fontWeight: '900' }}>Ver Receta</Text>
                <ChevronRight size={15} color="#EA580C" strokeWidth={3} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ======================================================= */}
        {/* MODAL 1: DETALLE DE PRODUCTO CON ANILLOS CANÓNICOS      */}
        {/* ======================================================= */}
        <Modal
          visible={!!selectedProduct}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedProduct(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                paddingHorizontal: 22,
                paddingTop: 18,
                paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                maxHeight: '90%',
              }}
            >
              {/* HEADER CON BOTÓN SUTIL DE CIERRE */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
                  {selectedProduct?.image ? (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                        padding: 3,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image
                        source={{ uri: selectedProduct.image }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#EA580C', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      {selectedProduct?.brand || 'Alimento'}
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 1 }}>
                      {selectedProduct?.name}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setSelectedProduct(null)}
                  style={{
                    backgroundColor: '#F8FAFC',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                  }}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* SELECTOR DUAL: UNIDAD vs GRAMOS */}
                <View style={{ marginBottom: 14 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: '#F1F5F9',
                      padding: 4,
                      borderRadius: 14,
                      marginBottom: 10,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleSwitchPortionMode('unit')}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        alignItems: 'center',
                        backgroundColor: portionMode === 'unit' ? '#FFFFFF' : 'transparent',
                        borderRadius: 11,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: portionMode === 'unit' ? 0.08 : 0,
                        shadowRadius: 2,
                        elevation: portionMode === 'unit' ? 2 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: portionMode === 'unit' ? '800' : '600',
                          color: portionMode === 'unit' ? '#EA580C' : '#64748B',
                        }}
                      >
                        Por Envase / Unidad
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSwitchPortionMode('grams')}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        alignItems: 'center',
                        backgroundColor: portionMode === 'grams' ? '#FFFFFF' : 'transparent',
                        borderRadius: 11,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: portionMode === 'grams' ? 0.08 : 0,
                        shadowRadius: 2,
                        elevation: portionMode === 'grams' ? 2 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: portionMode === 'grams' ? '800' : '600',
                          color: portionMode === 'grams' ? '#EA580C' : '#64748B',
                        }}
                      >
                        Pesar en Gramos (g)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* CONTROLES SEGÚN MODO CON ALTURA ESTABLE (ZERO LAYOUT SHIFT) */}
                  <View style={{ minHeight: 96, justifyContent: 'center' }}>
                    {portionMode === 'unit' ? (
                      <LinearGradient
                        colors={ZENIT_GRADIENT}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          borderRadius: 18,
                          padding: 1.5,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16.5,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '900', color: '#EA580C' }}>
                              {selectedProduct?.unitName || selectedProduct?.servingSize || '1 unidad'}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#0F172A', fontWeight: '600', marginTop: 2 }}>
                              Envase o unidad estándar
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setUnitCount((prev) => Math.max(1, prev - 1));
                              }}
                              style={{
                                backgroundColor: '#F8FAFC',
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: '#F1F5F9',
                              }}
                            >
                              <Minus size={15} color="#0F172A" strokeWidth={2.5} />
                            </TouchableOpacity>

                            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', minWidth: 32, textAlign: 'center' }}>
                              {unitCount}
                            </Text>

                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setUnitCount((prev) => prev + 1);
                              }}
                              style={{
                                backgroundColor: '#F8FAFC',
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: '#F1F5F9',
                              }}
                            >
                              <Plus size={15} color="#0F172A" strokeWidth={2.5} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </LinearGradient>
                    ) : (
                      <View>
                        <LinearGradient
                          colors={ZENIT_GRADIENT}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            borderRadius: 18,
                            padding: 1.5,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#FFFFFF',
                              borderRadius: 16.5,
                              paddingHorizontal: 16,
                              paddingVertical: 10,
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '900', color: '#EA580C' }}>
                              Cantidad en gramos:
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setProductGrams((prev) => Math.max(25, prev - 25));
                                }}
                                style={{
                                  backgroundColor: '#F8FAFC',
                                  width: 32,
                                  height: 32,
                                  borderRadius: 10,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 1,
                                  borderColor: '#F1F5F9',
                                }}
                              >
                                <Minus size={15} color="#0F172A" />
                              </TouchableOpacity>

                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A', minWidth: 46, textAlign: 'center' }}>
                                {productGrams}g
                              </Text>

                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setProductGrams((prev) => prev + 25);
                                }}
                                style={{
                                  backgroundColor: '#F8FAFC',
                                  width: 32,
                                  height: 32,
                                  borderRadius: 10,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 1,
                                  borderColor: '#F1F5F9',
                                }}
                              >
                                <Plus size={15} color="#0F172A" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </LinearGradient>

                        {/* CHIPS RÁPIDOS */}
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, justifyContent: 'center' }}>
                          {[50, 100, 150, 200, 250].map((g) => (
                            <TouchableOpacity
                              key={g}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setProductGrams(g);
                              }}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 8,
                                backgroundColor: productGrams === g ? '#0F172A' : '#F1F5F9',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: productGrams === g ? '#FFFFFF' : '#64748B',
                                }}
                              >
                                {g}g
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* ======================================================= */}
                {/* MACROS ZENIT (4 CARDS LIMPIAS RESPETANDO PALETA OFICIAL)*/}
                {/* ======================================================= */}
                <View style={{ marginBottom: 18 }}>
                  {/* HERO CARD CALORÍAS (ZenitHighlightCard: Borde en LinearGradient + Fondo Blanco Puro) */}
                  <LinearGradient
                    colors={ZENIT_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 18,
                      padding: 1.5,
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16.5,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: '#F8FAFC',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: '#F1F5F9',
                          }}
                        >
                          <Flame size={20} color="#EA580C" />
                        </View>
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: '#EA580C' }}>
                            Calorías Totales
                          </Text>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>
                            {portionMode === 'unit' ? (selectedProduct?.unitName || '1 porción') : `${productGrams}g`}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.6 }}>
                          {calculatedMacros.calories}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                          kcal
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* TRÍO DE MACROS: PROTEÍNAS, CARBS, GRASAS */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Proteína */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: '#F8FAFC',
                        borderRadius: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Proteína
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
                        <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>
                          {calculatedMacros.protein}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', marginLeft: 1 }}>g</Text>
                      </View>
                      <View style={{ height: 3, width: 22, backgroundColor: '#EA580C', borderRadius: 2, marginTop: 6 }} />
                    </View>

                    {/* Carbos */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: '#F8FAFC',
                        borderRadius: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Carbos
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
                        <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>
                          {calculatedMacros.carbs}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', marginLeft: 1 }}>g</Text>
                      </View>
                      <View style={{ height: 3, width: 22, backgroundColor: '#F97316', borderRadius: 2, marginTop: 6 }} />
                    </View>

                    {/* Grasa */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: '#F8FAFC',
                        borderRadius: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Grasas
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
                        <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>
                          {calculatedMacros.fats}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', marginLeft: 1 }}>g</Text>
                      </View>
                      <View style={{ height: 3, width: 22, backgroundColor: '#DC2626', borderRadius: 2, marginTop: 6 }} />
                    </View>
                  </View>
                </View>

                {/* LOS 2 BOTONES DE ACCIÓN CLAVE */}
                <View style={{ gap: 10 }}>
                  {/* BOTÓN 1: SUMAR A LA INGESTA DE MI DÍA */}
                  <ZenitPrimaryButton
                    title="Sumar a la ingesta de mi día"
                    icon={Check}
                    onPress={handleLogToToday}
                  />

                  {/* BOTÓN 2: AGREGAR A UNA RECETA (Borde Degradado Zenit + Fondo Blanco Modal) */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleAddToCart}
                  >
                    <LinearGradient
                      colors={ZENIT_GRADIENT}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 18,
                        padding: 1.5,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 16.5,
                          paddingVertical: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <ChefHat size={18} color="#EA580C" strokeWidth={2.4} />
                        <Text style={{ color: '#EA580C', fontSize: 14, fontWeight: '900' }}>
                          Agregar a una receta
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ======================================================= */}
        {/* MODAL 2: CARRITO DE RECETA (E-COMMERCE RECIPE BUILDER)  */}
        {/* ======================================================= */}
        <Modal
          visible={isCartModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsCartModalOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                paddingHorizontal: 22,
                paddingTop: 18,
                paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                maxHeight: '90%',
              }}
            >
              {/* HEADER CARRITO */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ChefHat size={22} color="#EA580C" strokeWidth={2.4} />
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                    Tu Receta ({recipeCart.length} ingredientes)
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setIsCartModalOpen(false)}
                  style={{
                    backgroundColor: '#F8FAFC',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                  }}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* NOMBRE DE LA RECETA */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 6 }}>
                    Nombre de tu receta
                  </Text>
                  <TextInput
                    value={recipeNameInput}
                    onChangeText={setRecipeNameInput}
                    placeholder="Ej: Bowl de Pollo, Arroz y Huevo"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14,
                      fontWeight: '800',
                      color: '#0F172A',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  />
                </View>

                {/* PORCIONES */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>
                    Porciones que rinde:
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setRecipeServingsInput((prev) => Math.max(1, prev - 1));
                      }}
                      style={{
                        backgroundColor: '#FFFFFF',
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#CBD5E1',
                      }}
                    >
                      <Minus size={14} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>
                      {recipeServingsInput}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setRecipeServingsInput((prev) => prev + 1);
                      }}
                      style={{
                        backgroundColor: '#FFFFFF',
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#CBD5E1',
                      }}
                    >
                      <Plus size={14} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* LISTADO DE PRODUCTOS EN EL CARRITO */}
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 8 }}>
                  Ingredientes agregados
                </Text>

                {recipeCart.length === 0 ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <Utensils size={36} color="#CBD5E1" />
                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 8 }}>
                      El carrito está vacío. Tocá un producto y agregalo a tu receta.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8, marginBottom: 16 }}>
                    {recipeCart.map((item) => (
                      <View
                        key={item.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 18,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: '#F1F5F9',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          shadowColor: '#0F172A',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.03,
                          shadowRadius: 6,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <ProductThumbnail
                            uri={item.image}
                            style={{ width: 44, height: 44, borderRadius: 12 }}
                            iconSize={20}
                          />
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#EA580C', fontWeight: '800' }}>
                              {item.calories} kcal • {item.protein}g Prot
                            </Text>
                          </View>
                        </View>

                        {/* CONTROLES DE GRAMOS Y BORRAR */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#F8FAFC',
                              borderRadius: 10,
                              paddingHorizontal: 6,
                              paddingVertical: 4,
                              gap: 6,
                            }}
                          >
                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                updateRecipeCartGrams(item.id, (item.grams || 100) - 25);
                              }}
                            >
                              <Minus size={13} color="#0F172A" />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', minWidth: 36, textAlign: 'center' }}>
                              {item.grams}g
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                updateRecipeCartGrams(item.id, (item.grams || 100) + 25);
                              }}
                            >
                              <Plus size={13} color="#0F172A" />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              removeFromRecipeCart(item.id);
                            }}
                            style={{ padding: 4 }}
                          >
                            <Trash2 size={16} color="#94A3B8" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* TOTALES DE LA RECETA ESTILO ZENIT */}
                {recipeCart.length > 0 && (
                  <View
                    style={{
                      backgroundColor: '#0F172A',
                      borderRadius: 22,
                      padding: 18,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Macros totales de la receta
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                      <View>
                        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>
                          {cartTotals.calories}
                        </Text>
                        <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '800' }}>KCAL TOTAL</Text>
                      </View>
                      <View>
                        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>
                          {cartTotals.protein}g
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800' }}>PROT</Text>
                      </View>
                      <View>
                        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>
                          {cartTotals.carbs}g
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800' }}>CARB</Text>
                      </View>
                      <View>
                        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>
                          {cartTotals.fats}g
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800' }}>GRASA</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* ACCIONES FINALES DEL CARRITO */}
                {recipeCart.length > 0 && (
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => handleSaveRecipeFromCart(false)}
                      style={{
                        backgroundColor: '#0F172A',
                        borderRadius: 18,
                        paddingVertical: 14,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                        Guardar en Mis Recetas
                      </Text>
                    </TouchableOpacity>

                    <ZenitPrimaryButton
                      title="Guardar y Consumir Hoy"
                      icon={Check}
                      onPress={() => handleSaveRecipeFromCart(true)}
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 }}>
                      <TouchableOpacity
                        onPress={() => setIsCartModalOpen(false)}
                        style={{ paddingVertical: 6 }}
                      >
                        <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '800' }}>
                          + Seguir sumando productos
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          clearRecipeCart();
                        }}
                        style={{ paddingVertical: 6 }}
                      >
                        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '800' }}>
                          Vaciar carrito
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ======================================================= */}
        {/* MODAL 3: CREAR PRODUCTO PERSONALIZADO                   */}
        {/* ======================================================= */}
        <Modal
          visible={isCreateProductModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsCreateProductModalOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                paddingHorizontal: 22,
                paddingTop: 18,
                paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                maxHeight: '90%',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                  Crear Alimento Propio
                </Text>
                <TouchableOpacity
                  onPress={() => setIsCreateProductModalOpen(false)}
                  style={{
                    backgroundColor: '#F8FAFC',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>
                      Nombre del alimento *
                    </Text>
                    <TextInput
                      value={newProdName}
                      onChangeText={setNewProdName}
                      placeholder="Ej: Panqueques de Proteína"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 14,
                        padding: 12,
                        fontSize: 14,
                        fontWeight: '800',
                        color: '#0F172A',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>
                      Marca o procedencia
                    </Text>
                    <TextInput
                      value={newProdBrand}
                      onChangeText={setNewProdBrand}
                      placeholder="Ej: Casero / Marca Propia"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 14,
                        padding: 12,
                        fontSize: 14,
                        fontWeight: '800',
                        color: '#0F172A',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>
                      Porción o envase
                    </Text>
                    <TextInput
                      value={newProdServing}
                      onChangeText={setNewProdServing}
                      placeholder="Ej: 1 unidad (120g) / 100g"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 14,
                        padding: 12,
                        fontSize: 14,
                        fontWeight: '800',
                        color: '#0F172A',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>
                      URL de foto (opcional)
                    </Text>
                    <TextInput
                      value={newProdImage}
                      onChangeText={setNewProdImage}
                      placeholder="https://..."
                      autoCapitalize="none"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 14,
                        padding: 12,
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#0F172A',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    />
                  </View>

                  {/* 4 MACROS INPUTS */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#EA580C', marginBottom: 4 }}>
                        Kcal *
                      </Text>
                      <TextInput
                        value={newProdCals}
                        onChangeText={setNewProdCals}
                        placeholder="250"
                        keyboardType="numeric"
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: 14,
                          padding: 12,
                          fontSize: 14,
                          fontWeight: '900',
                          color: '#0F172A',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          textAlign: 'center',
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569', marginBottom: 4 }}>
                        Prot (g)
                      </Text>
                      <TextInput
                        value={newProdProt}
                        onChangeText={setNewProdProt}
                        placeholder="20"
                        keyboardType="numeric"
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: 14,
                          padding: 12,
                          fontSize: 14,
                          fontWeight: '900',
                          color: '#0F172A',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          textAlign: 'center',
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569', marginBottom: 4 }}>
                        Carb (g)
                      </Text>
                      <TextInput
                        value={newProdCarbs}
                        onChangeText={setNewProdCarbs}
                        placeholder="30"
                        keyboardType="numeric"
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: 14,
                          padding: 12,
                          fontSize: 14,
                          fontWeight: '900',
                          color: '#0F172A',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          textAlign: 'center',
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569', marginBottom: 4 }}>
                        Grasa (g)
                      </Text>
                      <TextInput
                        value={newProdFats}
                        onChangeText={setNewProdFats}
                        placeholder="5"
                        keyboardType="numeric"
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: 14,
                          padding: 12,
                          fontSize: 14,
                          fontWeight: '900',
                          color: '#0F172A',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          textAlign: 'center',
                        }}
                      />
                    </View>
                  </View>

                  <ZenitPrimaryButton
                    title="Guardar en mi Despensa"
                    onPress={handleSaveCustomProduct}
                    style={{ marginTop: 14 }}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ALERTA MODAL ZENIT */}
        <ZenitModalAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
