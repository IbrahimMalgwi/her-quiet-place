import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../constants/theme";

interface AdminItemCardProps {
    title: string;
    subtitle?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    rightLabel?: string;
}

export default function AdminItemCard({
                                          title,
                                          subtitle,
                                          onEdit,
                                          onDelete,
                                      rightLabel,
                                  }: AdminItemCardProps) {
    const theme = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.subtitle, { color: theme.colors.text }]}>{subtitle}</Text>}
            </View>
            {rightLabel && <Text style={[styles.rightLabel, { color: theme.colors.textSecondary }]}>{rightLabel}</Text>}
            {onEdit && (
                <TouchableOpacity onPress={onEdit} style={[styles.button, { backgroundColor: theme.colors.accentPrimary }]}>
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
            )}
            {onDelete && (
                <TouchableOpacity onPress={onDelete} style={[styles.button, { backgroundColor: theme.colors.accentSecondary }]}>
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.8,
    },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        marginLeft: 6,
    },
    buttonText: {
        color: "white",
        fontSize: 13,
    },
    rightLabel: {
        fontSize: 13,
        marginLeft: 10,
    },
});
