import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

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
    return (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {rightLabel && <Text style={styles.rightLabel}>{rightLabel}</Text>}
            {onEdit && (
                <TouchableOpacity onPress={onEdit} style={[styles.button, { backgroundColor: Colors.accentPrimary }]}>
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
            )}
            {onDelete && (
                <TouchableOpacity onPress={onDelete} style={[styles.button, { backgroundColor: Colors.accentSecondary }]}>
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    title: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
    subtitle: {
        color: Colors.textPrimary,
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
        color: Colors.textSecondary,
        marginLeft: 10,
    },
});
