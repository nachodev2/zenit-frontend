import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Search, X, Flame, Beef, Wheat, Droplet, Tag, AlertCircle } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';

/**
 * Componente de Búsqueda de Alimentos de Zenit (100% JavaScript / React Native)
 * Consume el procedimiento almacenado (RPC) 'search_zenit_foods' en Supabase.
 *
 * Estructura de cada alimento devuelto por el RPC:
 * - id: UUID
 * - canonical_name: TEXT
 * - category: TEXT
 * - calories_100g: NUMERIC
 * - protein_100g: NUMERIC
 * - carbs_100g: NUMERIC
 * - fats_100g: NUMERIC
 * - macro_source: TEXT ('official_table' | 'ai_estimated')
 * - matched_brand: TEXT | null
 */
export default function FoodSearchModal({ onSelectFood, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Búsqueda reactiva con debounce de 300ms consumiendo el RPC de Supabase
  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSearchResults([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('search_zenit_foods', {
          search_term: trimmed,
        });

        if (error) {
          throw error;
        }

        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al invocar search_zenit_foods:', err.message);
        setErrorMessage('No pudimos cargar los alimentos. Verificá tu conexión.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage(null);
  };

  // Renderizado de cada alimento canónico
  const renderItem = useCallback(
    ({ item }) => {
      return (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onSelectFood && onSelectFood(item)}
          style={styles.cardContainer}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleWrapper}>
              <Text style={styles.canonicalName} numberOfLines={2}>
                {item.canonical_name}
              </Text>

              {/* Marca coincidente si el alimento fue encontrado por un producto */}
              {item.matched_brand ? (
                <View style={styles.brandBadge}>
                  <Tag size={10} color="#EA580C" />
                  <Text style={styles.brandText} numberOfLines={1}>
                    {item.matched_brand}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.caloriesWrapper}>
              <Flame size={14} color="#EA580C" />
              <Text style={styles.caloriesNumber}>
                {Math.round(Number(item.calories_100g) || 0)}
              </Text>
              <Text style={styles.caloriesUnit}>kcal/100g</Text>
            </View>
          </View>

          {/* Fila de Macronutrientes por 100g */}
          <View style={styles.macrosRow}>
            <View style={styles.macroPill}>
              <Beef size={12} color="#0284C7" />
              <Text style={styles.macroValue}>
                {Number(item.protein_100g || 0).toFixed(1)}g
              </Text>
              <Text style={styles.macroLabel}>Prot</Text>
            </View>

            <View style={styles.macroPill}>
              <Wheat size={12} color="#D97706" />
              <Text style={styles.macroValue}>
                {Number(item.carbs_100g || 0).toFixed(1)}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>

            <View style={styles.macroPill}>
              <Droplet size={12} color="#DC2626" />
              <Text style={styles.macroValue}>
                {Number(item.fats_100g || 0).toFixed(1)}g
              </Text>
              <Text style={styles.macroLabel}>Grasas</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [onSelectFood]
  );

  return (
    <View style={styles.container}>
      {/* Barra de Búsqueda */}
      <View style={styles.searchBarWrapper}>
        <Search size={18} color="#94A3B8" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar alimento (ej: arroz, bife, leche)..."
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Manejo de Error */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#DC2626" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Spinner de Carga */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#EA580C" />
          <Text style={styles.loadingText}>Buscando en catálogo canónico...</Text>
        </View>
      )}

      {/* Lista de Resultados */}
      <FlatList
        data={searchResults}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !isLoading && searchQuery.trim().length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Sin coincidencias</Text>
              <Text style={styles.emptySubtitle}>
                No encontramos alimentos para "{searchQuery.trim()}".
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 10,
  },
  canonicalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
    textTransform: 'uppercase',
  },
  caloriesWrapper: {
    alignItems: 'flex-end',
  },
  caloriesNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  caloriesUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
  },
  macroPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    borderRadius: 10,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});

