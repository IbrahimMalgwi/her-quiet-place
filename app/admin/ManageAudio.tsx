import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";
import AdminItemCard from "../../components/AdminItemCard";

export default function ManageAudio() {
    // TODO: Fetch audio metadata from Supabase
    const audioList = [
        { id: 1, title: "Morning Comfort 01", subtitle: "2:15 min" },
        { id: 2, title: "Evening Calm 02", subtitle: "3:45 min" },
    ];

    return (
        <ScrollView style={GlobalStyles.container}>
            <Text style={GlobalStyles.title}>Manage Audio Comforts</Text>
            <TouchableOpacity style={GlobalStyles.button}>
                <Text style={GlobalStyles.buttonText}>Upload New Audio</Text>
            </TouchableOpacity>

            {audioList.map((item) => (
                <AdminItemCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    onDelete={() => console.log("Delete", item.id)}
                />
            ))}
        </ScrollView>
    );
}
