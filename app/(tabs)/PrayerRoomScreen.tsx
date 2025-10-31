// app/(tabs)/PrayerRoomScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../constants/theme';

export default function PrayerRoomScreen() {
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
                Prayer Room - Coming Soon
            </Text>
        </View>
    );
}