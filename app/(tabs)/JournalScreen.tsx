// app/(tabs)/JournalScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../constants/theme';

export default function JournalScreen() {
    const theme = useTheme();

    return (
        <View style={theme.screen}>
            <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: theme.colors.text,
                textAlign: 'center',
                marginTop: theme.Spacing.xl
            }}>
                Journal Screen - Coming Soon
            </Text>
        </View>
    );
}