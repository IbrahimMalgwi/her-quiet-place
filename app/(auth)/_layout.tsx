import { Stack } from 'expo-router';
import { useTheme } from '../../constants/theme';

export default function AuthLayout() {
    const theme = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: theme.colors.background,
                },
            }}
        >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
        </Stack>
    );
}