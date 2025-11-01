// app/modal.tsx
import { View, Text, Button, StyleSheet } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "expo-router";

export default function ModalScreen() {
    const { user, signOut } = useAuth(); // Remove isAuthenticated
    const router = useRouter();

    const handleAuth = () => {
        if (user) {
            signOut();
            // No need to redirect here - your RootLayout will handle it automatically
        } else {
            router.push("/(auth)/login");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {user ? "You are logged in" : "You are not logged in"}
            </Text>

            {user && (
                <Text style={styles.subtitle}>
                    Email: {user.email}
                </Text>
            )}

            <Button
                title={user ? "Logout" : "Login"}
                onPress={handleAuth}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f2f2f2",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        color: "#666",
    },
});