// app/(tabs)/ProfileScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
    const theme = useTheme();
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <View style={theme.screen}>
            <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.text,
                textAlign: 'center',
                marginTop: theme.Spacing.xl,
                marginBottom: theme.Spacing.lg
            }}>
                Profile
            </Text>

            <View style={[theme.card, { margin: theme.Spacing.md }]}>
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.sm
                }}>
                    Email: {user?.email}
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.textSecondary
                }}>
                    User ID: {user?.id}
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    theme.button,
                    {
                        margin: theme.Spacing.md,
                        backgroundColor: theme.colors.error
                    }
                ]}
                onPress={handleSignOut}
            >
                <Text style={theme.buttonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}