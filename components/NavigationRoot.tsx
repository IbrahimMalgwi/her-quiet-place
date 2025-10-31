// components/NavigationRoot.tsx
import { Stack } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../constants/theme";

export default function NavigationRoot() {
    const { user, loading } = useAuth();
    const theme = useTheme();

    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.background
            }}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="(auth)" />
            ) : (
                <>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="admin" />
                </>
            )}
        </Stack>
    );
}