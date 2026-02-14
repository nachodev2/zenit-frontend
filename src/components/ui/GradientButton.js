import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ZENIT_GRADIENT } from '../../constants/theme';

export const GradientButton = ({ onPress, text, icon: Icon, disabled }) => {
    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={disabled}
            activeOpacity={0.8} // Feedback táctil suave
            style={styles.container}
        >
            <LinearGradient
                colors={disabled ? ['#E5E7EB', '#D1D5DB'] : ZENIT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                <Text style={[styles.text, disabled && styles.textDisabled]}>
                    {text}
                </Text>
                {Icon && <Icon size={20} color="white" style={{ marginLeft: 8 }} />}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 56, // Altura estándar botones grandes
        borderRadius: 999, // Pill shape (redondo completo)
        
        // --- ESTILO APPLE (CLEAN) ---
        // Adiós sombra naranja (#F97316). 
        // Usamos negro con muy baja opacidad para dar solo "volumen".
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, // Muy sutil (10%)
        shadowRadius: 8,    // Difuminado amplio
        elevation: 3,       // Elevación mínima en Android
        
        marginBottom: 20, // Margen seguro abajo
    },
    gradient: {
        flex: 1,
        borderRadius: 999, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    textDisabled: {
        color: '#9CA3AF',
    }
});