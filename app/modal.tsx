import { View, Text, Button, StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";

export default function ModalScreen() {
    const { isAuthenticated, login, logout } = useAuth();
    const router = useRouter();

    const handleAuth = () => {
        if (isAuthenticated) {
            logout();
        } else {
            login();
            router.replace("/(tabs)/explore"); // Go to explore after login
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {isAuthenticated ? "You are logged in" : "You are not logged in"}
            </Text>

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
});
