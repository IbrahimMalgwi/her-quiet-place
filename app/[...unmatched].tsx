// app/[...unmatched].tsx
import { Link, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../constants/theme';
import { useEffect } from 'react';

export default function UnmatchedScreen() {
    const theme = useTheme();
    const router = useRouter();

    useEffect(() => {
        // Auto-redirect to welcome screen after a short delay
        const timer = setTimeout(() => {
            router.replace('/(auth)/welcome');
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

    const handleGoBack = () => {
        router.replace('/(auth)/welcome');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Welcome to Her Quiet Place
            </Text>
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                Taking you to your spiritual sanctuary...
            </Text>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.accentPrimary }]}
                onPress={handleGoBack}
            >
                <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
                    Enter Sanctuary
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});