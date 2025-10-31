import { StyleSheet } from "react-native";
import { Colors } from "./theme";

export const GlobalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundPrimary || "#fff",
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: Colors.textPrimary || "#111",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textSecondary || "#444",
        marginBottom: 10,
    },
    text: {
        fontSize: 14,
        color: Colors.textPrimary || "#333",
        lineHeight: 20,
    },
    button: {
        backgroundColor: Colors.accentPrimary || "#0066cc",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginVertical: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
