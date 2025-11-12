import { Stack } from 'expo-router';
import { useTheme } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
    const theme = useTheme();

    return (
        <>
            <StatusBar
                style={theme.colorScheme === 'dark' ? 'light' : 'dark'}
                backgroundColor={theme.colors.background}
            />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: theme.colors.background,
                    },
                    animation: 'slide_from_right',
                    animationDuration: 300,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                }}
            >
                <Stack.Screen
                    name="welcome"
                    options={{
                        title: 'Welcome',
                        animation: 'fade',
                    }}
                />
                <Stack.Screen
                    name="login"
                    options={{
                        title: 'Sign In',
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="signup"
                    options={{
                        title: 'Create Account',
                        animation: 'slide_from_right',
                    }}
                />
            </Stack>
        </>
    );
}