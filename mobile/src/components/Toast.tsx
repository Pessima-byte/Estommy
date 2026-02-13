import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View, Dimensions, Platform } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onHide: () => void;
    duration?: number;
}

const { width } = Dimensions.get('window');

export default function Toast({ message, type, onHide, duration = 3000 }: ToastProps) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate In
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 60,
                useNativeDriver: true,
                tension: 20,
                friction: 7
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            })
        ]).start();

        // Animate Out after duration
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start(() => onHide());
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'rgba(16, 185, 129, 0.95)',
                    icon: <CheckCircle2 size={20} color="#FFF" />,
                    title: 'SUCCESS'
                };
            case 'error':
                return {
                    bg: 'rgba(239, 68, 68, 0.95)',
                    icon: <AlertCircle size={20} color="#FFF" />,
                    title: 'ERROR'
                };
            default:
                return {
                    bg: 'rgba(38, 38, 48, 0.95)',
                    icon: <Info size={20} color="#FFF" />,
                    title: 'SYSTEM'
                };
        }
    };

    const config = getStyles();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                    backgroundColor: config.bg
                }
            ]}
        >
            <View style={styles.iconContainer}>
                {config.icon}
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 16, // Matching premium BorderRadius.md or similar
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 2,
    },
    message: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        opacity: 0.9,
    },
});
