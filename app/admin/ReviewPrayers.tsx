import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

import { GlobalStyles } from "@/constants/GlobalStyles";
import AdminItemCard from "../../components/AdminItemCard";
import { Colors } from "../../constants/theme";

export default function ReviewPrayers() {
    const pendingPrayers = [
        { id: 1, title: "Please pray for peace in my family." },
        { id: 2, title: "Healing for my friend recovering from surgery." },
    ];

    return (
        <ScrollView style={GlobalStyles.container}>
            <Text style={GlobalStyles.title}>Review Prayers</Text>

            {pendingPrayers.map((prayer) => (
                <View key={prayer.id} style={{ marginBottom: 8 }}>
                    <AdminItemCard title={prayer.title} />
                    <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                        <TouchableOpacity
                            style={[GlobalStyles.button, { backgroundColor: Colors.accentPrimary, width: "45%", marginRight: 10 }]}
                        >
                            <Text style={GlobalStyles.buttonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[GlobalStyles.button, { backgroundColor: Colors.accentSecondary, width: "45%" }]}
                        >
                            <Text style={GlobalStyles.buttonText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}
