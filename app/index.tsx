// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../constants/theme';


export default function IndexScreen() {
    const { user, userRole, loading } = useAuth();
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



    // Redirect based on authentication status and role
    if (user) {
        if (userRole === 'admin') {
            return <Redirect href="/admin" />;
        } else {
            return <Redirect href="/(tabs)" />;
        }
    } else {
        return <Redirect href="/(auth)/login" />;
    }
}