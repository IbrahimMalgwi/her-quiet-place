//constants/theme.ts
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
        // ADD MISSING COLORS:
        black: AppColors.black,
        white: AppColors.white,
        transparent: AppColors.transparent,
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
        // ADD MISSING COLORS:
        black: AppColors.black,
        white: AppColors.white,
        transparent: AppColors.transparent,
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

// Font sizes for consistent typography
export const FontSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
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
        FontSizes,

        // Layout styles
        screen: {
            flex: 1,
            backgroundColor: colors.background,
        },
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: Spacing.md,
        },
        containerHorizontal: {
            flex: 1,
            backgroundColor: colors.background,
            paddingHorizontal: Spacing.md,
        },

        // Card styles
        card: {
            backgroundColor: colors.backgroundCard,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
        },
        cardElevated: {
            backgroundColor: colors.backgroundCard,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            shadowColor: colors.black, // Now this will work!
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        },

        // Typography styles
        title: {
            fontSize: FontSizes.xxxl,
            fontWeight: '700' as const,
            color: colors.text,
            marginBottom: Spacing.md,
        },
        subtitle: {
            fontSize: FontSizes.xxl,
            fontWeight: '600' as const,
            color: colors.text,
            marginBottom: Spacing.sm,
        },
        heading: {
            fontSize: FontSizes.xl,
            fontWeight: '600' as const,
            color: colors.text,
            marginBottom: Spacing.sm,
        },
        text: {
            fontSize: FontSizes.md,
            color: colors.text,
            lineHeight: 20,
        },
        textSmall: {
            fontSize: FontSizes.sm,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        textLarge: {
            fontSize: FontSizes.lg,
            color: colors.text,
            lineHeight: 22,
        },
        label: {
            fontSize: FontSizes.sm,
            fontWeight: '500' as const,
            color: colors.textSecondary,
            marginBottom: Spacing.xs,
        },

        // Form styles
        input: {
            backgroundColor: colors.backgroundCard,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            fontSize: FontSizes.md,
            color: colors.text,
        },
        inputFocused: {
            backgroundColor: colors.backgroundCard,
            borderWidth: 2,
            borderColor: colors.accentPrimary,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            fontSize: FontSizes.md,
            color: colors.text,
        },

        // Button styles
        button: {
            backgroundColor: colors.accentPrimary,
            borderRadius: BorderRadius.md,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        buttonSecondary: {
            backgroundColor: colors.accentSecondary,
            borderRadius: BorderRadius.md,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        buttonOutline: {
            backgroundColor: colors.transparent, // Now this will work!
            borderWidth: 1,
            borderColor: colors.accentPrimary,
            borderRadius: BorderRadius.md,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        buttonDisabled: {
            backgroundColor: colors.disabled,
            borderRadius: BorderRadius.md,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        buttonText: {
            color: colors.textInverse,
            fontSize: FontSizes.md,
            fontWeight: '600' as const,
        },
        buttonTextSecondary: {
            color: colors.text,
            fontSize: FontSizes.md,
            fontWeight: '600' as const,
        },
        buttonTextOutline: {
            color: colors.accentPrimary,
            fontSize: FontSizes.md,
            fontWeight: '600' as const,
        },
        buttonTextDisabled: {
            color: colors.textDisabled,
            fontSize: FontSizes.md,
            fontWeight: '600' as const,
        },

        // Layout utilities
        row: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
        },
        rowBetween: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
        },
        rowAround: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-around' as const,
        },
        rowCenter: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        center: {
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },

        // Spacing utilities
        gap: {
            xs: { gap: Spacing.xs },
            sm: { gap: Spacing.sm },
            md: { gap: Spacing.md },
            lg: { gap: Spacing.lg },
            xl: { gap: Spacing.xl },
        },

        // Margin utilities
        margin: {
            xs: { margin: Spacing.xs },
            sm: { margin: Spacing.sm },
            md: { margin: Spacing.md },
            lg: { margin: Spacing.lg },
            xl: { margin: Spacing.xl },
        },
        marginBottom: {
            xs: { marginBottom: Spacing.xs },
            sm: { marginBottom: Spacing.sm },
            md: { marginBottom: Spacing.md },
            lg: { marginBottom: Spacing.lg },
            xl: { marginBottom: Spacing.xl },
        },
        marginTop: {
            xs: { marginTop: Spacing.xs },
            sm: { marginTop: Spacing.sm },
            md: { marginTop: Spacing.md },
            lg: { marginTop: Spacing.lg },
            xl: { marginTop: Spacing.xl },
        },

        // Padding utilities
        padding: {
            xs: { padding: Spacing.xs },
            sm: { padding: Spacing.sm },
            md: { padding: Spacing.md },
            lg: { padding: Spacing.lg },
            xl: { padding: Spacing.xl },
        },
    };
};

export default {
    Colors,
    Spacing,
    BorderRadius,
    FontSizes,
    useTheme,
};