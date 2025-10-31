import React from "react";
import { View, Text, ScrollView } from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";
import AdminItemCard from "../../components/AdminItemCard";

export default function ManageUsers() {
    const users = [
        { id: 1, title: "Jane Doe", subtitle: "Role: user" },
        { id: 2, title: "Ibrahim Gana", subtitle: "Role: admin" },
    ];

    return (
        <ScrollView style={GlobalStyles.container}>
            <Text style={GlobalStyles.title}>Manage Users</Text>
            {users.map((user) => (
                <AdminItemCard
                    key={user.id}
                    title={user.title}
                    subtitle={user.subtitle}
                    onEdit={() => console.log("Promote/Demote", user.id)}
                />
            ))}
        </ScrollView>
    );
}
