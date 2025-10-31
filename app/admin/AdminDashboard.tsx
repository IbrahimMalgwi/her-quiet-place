import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles.js";
import { Colors } from "../../constants/theme";

export default function AdminDashboard() {
    // TODO: fetch these counts from Supabase
    const stats = [
        { label: "Pending Prayers", value: 5 },
        { label: "Total Audio", value: 12 },
        { label: "Daily Posts", value: 20 },
        { label: "Users", value: 34 },
    ];

    return (
        <ScrollView style={GlobalStyles.container}>
            <Text style={GlobalStyles.title}>Admin Dashboard</Text>
            <View style={styles.grid}>
                {stats.map((item, index) => (
                    <View key={index} style={styles.card}>
                        <Text style={styles.value}>{item.value}</Text>
                        <Text style={styles.label}>{item.label}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    card: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        width: "48%",
        alignItems: "center",
    },
    value: {
        fontSize: 28,
        fontWeight: "700",
        color: Colors.accentPrimary,
    },
    label: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
});
