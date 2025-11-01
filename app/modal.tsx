import { View, Text, Button, StyleSheet } from "react-native";
import { useAuth } from "../contexts/AuthContext"; // Import from the correct path
import { useRouter } from "expo-router";

export default function ModalScreen() {
    const { isAuthenticated, user, signOut } = useAuth(); // Now isAuthenticated is available
    const router = useRouter();

    const handleAuth = () => {
        if (isAuthenticated) {
            signOut();
            router.replace("/(auth)/login");
        } else {
            router.replace("/(auth)/login");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {isAuthenticated ? "You are logged in" : "You are not logged in"}
            </Text>

            {isAuthenticated && user && (
                <Text style={styles.subtitle}>
                    Email: {user.email}
                </Text>
            )}

            <Button
                title={isAuthenticated ? "Logout" : "Login"}
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