import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
// import {  Colors } from "../../constants/theme";
import { GlobalStyles } from "@/constants/GlobalStyles";
import AdminItemCard from "../../components/AdminItemCard";

export default function ManageDailyStrength() {
    // TODO: Fetch from Supabase
    const messages = [
        { id: 1, title: "Be still and know that I am God.", subtitle: "Psalm 46:10" },
        { id: 2, title: "You are loved beyond measure.", subtitle: "Daily quote" },
    ];

    return (
        <ScrollView style={GlobalStyles.container}>
            <Text style={GlobalStyles.title}>Manage Daily Strength</Text>
            <TouchableOpacity style={GlobalStyles.button}>
                <Text style={GlobalStyles.buttonText}>Add New Message</Text>
            </TouchableOpacity>

            {messages.map((msg) => (
                <AdminItemCard
                    key={msg.id}
                    title={msg.title}
                    subtitle={msg.subtitle}
                    onEdit={() => console.log("Edit", msg.id)}
                    onDelete={() => console.log("Delete", msg.id)}
                />
            ))}
        </ScrollView>
    );
}
