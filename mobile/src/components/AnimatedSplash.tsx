import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    withDelay,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const LOGO_IMAGE = require('../../assets/images/logo.jpg');

interface AnimatedSplashProps {
    onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1.15);
    const progress = useSharedValue(0);
    const overlayOpacity = useSharedValue(0.4);

    useEffect(() => {
        // Smooth cinematic entrance
        opacity.value = withTiming(1, { duration: 1200 });
        scale.value = withTiming(1, { duration: 3000, easing: Easing.out(Easing.poly(3)) });

        // Lighten up slightly after entrance
        overlayOpacity.value = withDelay(500, withTiming(0, { duration: 1500 }));

        // Progress bar animation
        progress.value = withTiming(1, { duration: 3200 });

        const timer = setTimeout(() => {
            if (onAnimationComplete) {
                // Smooth fade out to app
                opacity.value = withTiming(0, { duration: 800 }, () => {
                    onAnimationComplete();
                });
            }
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <View style={styles.container}>
            {/* Full Brand Image Background */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                <Image
                    source={LOGO_IMAGE}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                />

                {/* Cinematic dimming that fades away */}
                <Animated.View style={[styles.darkOverlay, overlayStyle]} />

                {/* Sleek Progress Indicator */}
                <View style={styles.footer}>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBackground} />
                        <Animated.View style={[styles.progressBar, progressStyle]} />
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    footer: {
        position: 'absolute',
        bottom: 80,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 60,
    },
    progressContainer: {
        width: '100%',
        maxWidth: 240,
        height: 2,
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#C5A059', // This matches the gold text in the logo
        shadowColor: '#C5A059',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
    },
});
