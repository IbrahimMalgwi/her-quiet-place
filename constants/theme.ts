// constants/theme.ts
import { Platform, Dimensions } from "react-native";
import { useColorScheme } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AppColors = {
    primaryBackground: "#FAEBD7",
    secondaryBackground: "#E6E6FA",
    primaryText: "#4A4A4A",
    secondaryText: "#6B7280",
    border: "#D3D3D3",
    accentPrimary: "#A8C1B4",
    accentSecondary: "#FADADD",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    disabled: "#9CA3AF",
    overlay: "rgba(0, 0, 0, 0.5)",
    white: "#FFFFFF",
    black: "#000000",
    transparent: "transparent",
};

export const Colors = {
    light: {
        background: AppColors.primaryBackground,
        backgroundSecondary: AppColors.secondaryBackground,
        backgroundCard: AppColors.white,
        backgroundModal: AppColors.white,
        text: AppColors.primaryText,
        textSecondary: AppColors.secondaryText,
        textInverse: AppColors.white,
        textDisabled: AppColors.disabled,
        tint: AppColors.accentPrimary,
        icon: AppColors.primaryText,
        border: AppColors.border,
        accentPrimary: AppColors.accentPrimary,
        accentSecondary: AppColors.accentSecondary,
        success: AppColors.success,
        warning: AppColors.warning,
        error: AppColors.error,
        info: AppColors.info,
        disabled: AppColors.disabled,
        overlay: AppColors.overlay,
    },
    dark: {
        background: "#1A1A1A",
        backgroundSecondary: "#2D2D2D",
        backgroundCard: "#2D2D2D",
        backgroundModal: "#2D2D2D",
        text: "#ECEDEE",
        textSecondary: "#A1A1AA",
        textInverse: "#1A1A1A",
        textDisabled: "#6B7280",
        tint: AppColors.accentPrimary,
        icon: "#ECEDEE",
        border: "#404040",
        accentPrimary: AppColors.accentPrimary,
        accentSecondary: AppColors.accentSecondary,
        success: "#34D399",
        warning: "#FBBF24",
        error: "#F87171",
        info: "#60A5FA",
        disabled: "#6B7280",
        overlay: "rgba(0, 0, 0, 0.7)",
    },
};

// Simple spacing constants
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 9999,
};

// Simplified useTheme hook
export const useTheme = () => {
    const colorScheme = useColorScheme() ?? "light";
    const colors = Colors[colorScheme];

    return {
        colors,
        colorScheme,
        Spacing,
        BorderRadius,
        // Simple style generators
        screen: {
            flex: 1,
            backgroundColor: colors.background,
        },
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: Spacing.md,
        },
        card: {
            backgroundColor: colors.backgroundCard,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
        },
        input: {
            backgroundColor: colors.backgroundCard,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            fontSize: 16,
            color: colors.text,
        },
        button: {
            backgroundColor: colors.accentPrimary,
            borderRadius: BorderRadius.md,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        buttonText: {
            color: colors.textInverse,
            fontSize: 16,
            fontWeight: '600' as const,
        },
        row: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
        },
        rowBetween: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
        },
        center: {
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
    };
};

export default {
    Colors,
    Spacing,
    BorderRadius,
    useTheme,
};